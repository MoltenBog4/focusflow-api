const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

// ---- Firebase Admin ----
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT is not set");
  process.exit(1);
}
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ---- MongoDB ----
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---- Auth middleware ----
async function verifyToken(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = h.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // has uid
    next();
  } catch (e) {
    console.error("Token verification failed:", e);
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ---- User schema for FCM tokens and preferences ----
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fcmTokens: [{ 
    token: String,
    deviceId: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  fcmTokenUpdatedAt: Date,
  notificationEnabled: { type: Boolean, default: true },
  reminderEnabled: { type: Boolean, default: true },
  quietHoursStart: Number, // Hour of day (0-23)
  quietHoursEnd: Number,   // Hour of day (0-23)
  lastSyncTime: Date
});
const User = mongoose.model("User", userSchema);

// ---- Task schema with latitude/longitude ----
const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: String,
  priority: String,
  completed: { type: Boolean, default: false },

  allDay: Boolean,
  startTime: Number,
  endTime: Number,
  location: String,
  latitude: {
    type: Number,
    min: -90,
    max: 90,
    default: null
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180,
    default: null
  },
  reminderOffsetMinutes: Number,
  reminderSent: { type: Boolean, default: false }
});
const Task = mongoose.model("Task", taskSchema);

// ---- Helper functions ----

// Validate latitude/longitude
function validateCoordinates(lat, lng) {
  if (lat !== null && lat !== undefined && (lat < -90 || lat > 90)) {
    return { valid: false, error: "Latitude must be between -90 and 90" };
  }
  if (lng !== null && lng !== undefined && (lng < -180 || lng > 180)) {
    return { valid: false, error: "Longitude must be between -180 and 180" };
  }
  return { valid: true };
}

// Check if current time is within quiet hours
function isQuietHours(user) {
  if (!user.quietHoursStart || !user.quietHoursEnd) return false;
  const now = new Date();
  const currentHour = now.getHours();
  const start = user.quietHoursStart;
  const end = user.quietHoursEnd;
  
  if (start <= end) {
    return currentHour >= start && currentHour < end;
  } else {
    // Quiet hours span midnight
    return currentHour >= start || currentHour < end;
  }
}

// Send FCM notification to user
async function sendNotification(userId, title, body, data = {}) {
  try {
    const user = await User.findOne({ userId });
    if (!user || !user.notificationEnabled || !user.reminderEnabled) {
      return { success: false, error: "Notifications disabled for user" };
    }
    
    if (isQuietHours(user)) {
      return { success: false, error: "Quiet hours active" };
    }
    
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return { success: false, error: "No FCM tokens found for user" };
    }
    
    const messages = user.fcmTokens.map(fcmToken => ({
      token: fcmToken.token,
      notification: { title, body },
      data: {
        ...data,
        taskId: data.taskId || "",
        action: data.action || "reminder",
        type: data.type || "task"
      },
      android: {
        priority: "high"
      },
      apns: {
        headers: {
          "apns-priority": "10"
        }
      }
    }));
    
    const results = await admin.messaging().sendAll(messages);
    
    // Clean up invalid tokens
    const invalidTokens = [];
    results.responses.forEach((response, index) => {
      if (!response.success) {
        if (response.error?.code === "messaging/invalid-registration-token" ||
            response.error?.code === "messaging/registration-token-not-registered") {
          invalidTokens.push(user.fcmTokens[index].token);
        }
      }
    });
    
    if (invalidTokens.length > 0) {
      await User.updateOne(
        { userId },
        { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
      );
    }
    
    return { success: true, sent: results.successCount, failed: results.failureCount };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

// ---- Protected routes ----
app.use(verifyToken);

// list user tasks
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find({ userId: req.user.uid }).sort({ startTime: 1, _id: -1 });
  res.json(tasks);
});

// create user task
app.post("/tasks", async (req, res) => {
  const body = req.body;
  
  // Validate coordinates if provided
  const coordValidation = validateCoordinates(body.latitude, body.longitude);
  if (!coordValidation.valid) {
    return res.status(400).json({ error: coordValidation.error });
  }
  
  const task = new Task({ ...body, userId: req.user.uid, completed: false });
  await task.save();

  res.status(201).json(task);
});

// update user task (e.g. mark as completed)
app.put("/tasks/:id", async (req, res) => {
  // Validate coordinates if provided
  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    const coordValidation = validateCoordinates(req.body.latitude, req.body.longitude);
    if (!coordValidation.valid) {
      return res.status(400).json({ error: coordValidation.error });
    }
  }
  
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.uid },
    req.body,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Task not found or not authorized" });
  res.json(updated);
});

// delete user task
app.delete("/tasks/:id", async (req, res) => {
  const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
  if (!deleted) return res.status(404).json({ error: "Task not found or not authorized" });
  res.json({ message: "Task deleted" });
});

// ---- FCM Token Management ----

// Store/update FCM token for user
app.post("/users/fcm-token", async (req, res) => {
  const { fcmToken, deviceId } = req.body;
  
  if (!fcmToken) {
    return res.status(400).json({ error: "fcmToken is required" });
  }
  
  try {
    const userId = req.user.uid;
    let user = await User.findOne({ userId });
    
    if (!user) {
      // Create new user record
      user = new User({
        userId,
        fcmTokens: [{ token: fcmToken, deviceId: deviceId || null, updatedAt: new Date() }],
        fcmTokenUpdatedAt: new Date()
      });
      await user.save();
    } else {
      // Update existing user
      const existingTokenIndex = user.fcmTokens.findIndex(
        t => t.token === fcmToken || (deviceId && t.deviceId === deviceId)
      );
      
      if (existingTokenIndex >= 0) {
        // Update existing token
        user.fcmTokens[existingTokenIndex].token = fcmToken;
        user.fcmTokens[existingTokenIndex].deviceId = deviceId || user.fcmTokens[existingTokenIndex].deviceId;
        user.fcmTokens[existingTokenIndex].updatedAt = new Date();
      } else {
        // Add new token
        user.fcmTokens.push({ token: fcmToken, deviceId: deviceId || null, updatedAt: new Date() });
      }
      
      user.fcmTokenUpdatedAt = new Date();
      await user.save();
    }
    
    res.json({ message: "FCM token stored successfully" });
  } catch (error) {
    console.error("Error storing FCM token:", error);
    res.status(500).json({ error: "Failed to store FCM token" });
  }
});

// Send manual notification for a task (for testing)
app.post("/tasks/:id/notify", async (req, res) => {
  const { title, body } = req.body;
  const taskId = req.params.id;
  
  const task = await Task.findOne({ _id: taskId, userId: req.user.uid });
  if (!task) {
    return res.status(404).json({ error: "Task not found or not authorized" });
  }
  
  const notificationTitle = title || "Task Reminder";
  const notificationBody = body || `Don't forget: ${task.title}`;
  
  const result = await sendNotification(
    req.user.uid,
    notificationTitle,
    notificationBody,
    { taskId: task._id.toString(), action: "reminder", type: "task" }
  );
  
  if (result.success) {
    res.json({ message: "Notification sent", sent: result.sent, failed: result.failed });
  } else {
    res.status(400).json({ error: result.error });
  }
});

// ---- Offline Sync ----

// Batch sync tasks
app.post("/tasks/sync", async (req, res) => {
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "tasks must be an array" });
  }
  
  const synced = [];
  const errors = [];
  const userId = req.user.uid;
  
  for (const taskData of tasks) {
    try {
      const { localId, _id, ...taskFields } = taskData;
      
      // Validate coordinates if provided
      const coordValidation = validateCoordinates(taskFields.latitude, taskFields.longitude);
      if (!coordValidation.valid) {
        errors.push({ localId, error: coordValidation.error });
        continue;
      }
      
      let task;
      let status;
      
      if (_id) {
        // Try to update existing task
        task = await Task.findOne({ _id, userId });
        if (task) {
          // Update existing task
          Object.assign(task, taskFields);
          task.userId = userId; // Ensure userId matches
          await task.save();
          status = "updated";
        } else {
          // ID exists but task doesn't - create new (ID conflict)
          task = new Task({ ...taskFields, userId, completed: false });
          await task.save();
          status = "created";
        }
      } else {
        // Create new task
        task = new Task({ ...taskFields, userId, completed: false });
        await task.save();
        status = "created";
      }
      
      synced.push({
        localId: localId || null,
        remoteId: task._id.toString(),
        status
      });
    } catch (error) {
      errors.push({
        localId: taskData.localId || null,
        error: error.message
      });
    }
  }
  
  // Update user's last sync time
  await User.findOneAndUpdate(
    { userId },
    { lastSyncTime: new Date() },
    { upsert: true, new: true }
  );
  
  res.json({ synced, errors });
});

// Get sync status
app.get("/tasks/sync-status", async (req, res) => {
  const userId = req.user.uid;
  
  const user = await User.findOne({ userId });
  const serverTime = Date.now();
  
  res.json({
    lastSyncTime: user?.lastSyncTime ? user.lastSyncTime.getTime() : null,
    pendingCount: 0, // Could be calculated if tracking pending syncs
    serverTime
  });
});

// ---- Scheduled Reminder Job ----
// Runs every minute to check for tasks that need reminders
async function checkAndSendReminders() {
  try {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1 minute in milliseconds
    
    // Find tasks that need reminders
    // Conditions:
    // - reminderOffsetMinutes is set
    // - startTime is in the future
    // - completed is false
    // - reminderSent is false
    // - reminderTime is within the last minute
    const tasks = await Task.find({
      reminderOffsetMinutes: { $exists: true, $ne: null },
      startTime: { $gt: now }, // Task is in the future
      completed: false,
      reminderSent: { $ne: true }
    });
    
    for (const task of tasks) {
      const reminderTime = task.startTime - (task.reminderOffsetMinutes * 60 * 1000);
      
      // Check if reminder time is within the last minute
      if (reminderTime <= now && reminderTime > oneMinuteAgo) {
        // Send notification
        const result = await sendNotification(
          task.userId,
          "⏰ Task Reminder",
          `${task.title} is due soon!`,
          { taskId: task._id.toString(), action: "reminder", type: "task" }
        );
        
        if (result.success) {
          // Mark reminder as sent
          task.reminderSent = true;
          await task.save();
          console.log(`✅ Sent reminder for task: ${task.title} (${task._id})`);
        } else {
          console.error(`⚠️ Failed to send reminder for task: ${task.title} - ${result.error}`);
        }
      }
    }
  } catch (error) {
    console.error("Error in reminder job:", error);
  }
}

// Schedule reminder job to run every minute
cron.schedule("* * * * *", checkAndSendReminders); // Every minute
console.log("✅ Scheduled reminder job started (runs every minute)");

// ---- Daily Summary Job ----
async function sendDailySummary() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find tasks due today and not completed
    const tasks = await Task.find({
      startTime: { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() },
      completed: false
    });

    // Group tasks by userId
    const tasksByUser = {};
    tasks.forEach(task => {
      if (!tasksByUser[task.userId]) {
        tasksByUser[task.userId] = [];
      }
      tasksByUser[task.userId].push(task);
    });

    // Send summary to each user
    for (const userId in tasksByUser) {
      const userTasks = tasksByUser[userId];
      if (userTasks.length > 0) {
        const titles = userTasks.map(t => t.title).join(", ");
        await sendNotification(
          userId,
          "Tasks Due Today",
          `You have ${userTasks.length} task(s): ${titles}`,
          { action: "daily_summary", type: "task" }
        );
      }
    }
  } catch (error) {
    console.error("Error in daily summary job:", error);
  }
}

// Schedule daily summary at 8:00 AM every day
cron.schedule("0 8 * * *", sendDailySummary);
console.log("✅ Daily summary job scheduled (runs at 8:00 AM daily)");

// ---- Start server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API on :${PORT}`);
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");

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

// ---- Task schema (plus fcmToken) ----
const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: String,
  priority: String,
  completed: { type: Boolean, default: false },

  allDay: Boolean,
  startTime: Number,
  endTime: Number,
  location: String,
  reminderOffsetMinutes: Number,

  fcmToken: String
});
const Task = mongoose.model("Task", taskSchema);

// ---- Protected routes ----
app.use(verifyToken);

// list user tasks
app.get("/tasks", async (req, res) => {
  // Accept userId as query parameter, but validate it matches authenticated user
  const userId = req.query.userId || req.user.uid;
  
  // Security check: prevent users from accessing other users' tasks
  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden: Cannot access other users' tasks" });
  }
  
  const tasks = await Task.find({ userId: userId }).sort({ startTime: 1, _id: -1 });
  res.json(tasks);
});

// create user task
app.post("/tasks", async (req, res) => {
  const body = req.body;
  
  // Validate that userId in body matches authenticated user (if provided)
  if (body.userId && body.userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden: userId must match authenticated user" });
  }
  
  // Always use authenticated user's uid to ensure security
  const task = new Task({ ...body, userId: req.user.uid, completed: false });
  await task.save();

  // Schedule individual reminder
  if (
    task.fcmToken &&
    typeof task.startTime === "number" &&
    typeof task.reminderOffsetMinutes === "number"
  ) {
    const reminderTime = task.startTime - task.reminderOffsetMinutes * 60 * 1000;
    const delay = reminderTime - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        admin
          .messaging()
          .send({
            token: task.fcmToken,
            notification: {
              title: "⏰ Task Reminder",
              body: `${task.title} is due soon!`
            }
          })
          .then(() => {
            console.log(`✅ Sent reminder for task: ${task.title}`);
          })
          .catch((err) => {
            console.error("⚠️ Error sending FCM", err);
          });
      }, delay);
    } else {
      console.log("⚠️ Reminder time already passed, skipping push for", task.title);
    }
  }

  res.status(201).json(task);
});

// update user task (e.g. mark as completed)
app.put("/tasks/:id", async (req, res) => {
  // Validate that userId in body matches authenticated user (if provided)
  if (req.body.userId && req.body.userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden: userId must match authenticated user" });
  }
  
  // Ensure updates only affect tasks belonging to the authenticated user
  // Remove userId from body to prevent tampering, use authenticated user's uid
  const updateData = { ...req.body };
  delete updateData.userId; // Prevent userId modification
  
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.uid },
    updateData,
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

// ---- New: Daily summary push job ----
async function sendDailySummary() {
  // For each user, fetch tasks due today and not completed, then send push if any
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // find tasks for all users? or group by userId
  const tasks = await Task.find({
    startTime: { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() },
    completed: false,
    fcmToken: { $exists: true, $ne: null }
  });

  // group by userId + fcmToken
  const byUser = {};
  tasks.forEach(t => {
    const key = t.userId + "|" + t.fcmToken;
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(t);
  });

  for (const key in byUser) {
    const arr = byUser[key];
    // pick one token
    const token = arr[0].fcmToken;
    const titles = arr.map(t => t.title).join(", ");
    await admin.messaging().send({
      token,
      notification: {
        title: "Tasks Due Today",
        body: `You have: ${titles}`
      }
    }).catch(err => console.error("Daily summary push error", err));
  }
}

// Schedule daily summary (once per day)
// Here simple setInterval — but better: cron, or use a scheduling library like node-cron
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// Compute delay until next midnight + small offset
function scheduleDailySummary() {
  const now = new Date();
  const next = new Date();
  next.setHours(8, 0, 0, 0); // e.g. send at 8:00 each day
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  const delay = next.getTime() - now.getTime();
  setTimeout(() => {
    sendDailySummary();
    // then run every 24h
    setInterval(sendDailySummary, ONE_DAY_MS);
  }, delay);
}

// Start daily summary job
scheduleDailySummary();

// ---- Start server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API on :${PORT}`);
});

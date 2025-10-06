const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// ---- Firebase Admin from env (Render) ----
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

// ---- Root ----
app.get("/", (_req, res) => res.send("✅ FocusFlow API running"));

// ---- Task schema (user-specific + calendar fields + fcm token) ----
const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // 🔐 Firebase UID owner
  title: String,
  priority: String,
  completed: Boolean,

  allDay: Boolean,
  startTime: Number,
  endTime: Number,
  location: String,
  reminderOffsetMinutes: Number,

  fcmToken: String // <-- added field
});
const Task = mongoose.model("Task", taskSchema);

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
  // ensure fcmToken comes from client
  const task = new Task({ ...body, userId: req.user.uid });
  await task.save();

  // Schedule FCM notification
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

// update user task
app.put("/tasks/:id", async (req, res) => {
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

// ---- Start server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API on :${PORT}`));

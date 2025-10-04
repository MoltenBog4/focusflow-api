const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin"); // ✅ Firebase Admin

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialise Firebase Admin SDK
// Make sure you have your Firebase service account JSON set in an environment variable or file
// Example: process.env.GOOGLE_APPLICATION_CREDENTIALS = "./serviceAccountKey.json"
admin.initializeApp();

// ✅ Connect to MongoDB (from Render Environment Variables)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware to verify Firebase ID token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send("✅ FocusFlow API is running! Use /tasks to interact with tasks.");
});

// ✅ Task schema (with userId)
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  completed: Boolean,
  userId: { type: String, required: true }, // 🔐 Firebase UID
});

const Task = mongoose.model("Task", taskSchema);

// ✅ CRUD Routes (protected)
app.use(verifyToken); // All routes below this line require auth

// Get all tasks for logged-in user
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find({ userId: req.user.uid });
  res.json(tasks);
});

// Create task for logged-in user
app.post("/tasks", async (req, res) => {
  const task = new Task({
    ...req.body,
    userId: req.user.uid, // attach Firebase UID
  });
  await task.save();
  res.status(201).json(task);
});

// Update task (only if belongs to user)
app.put("/tasks/:id", async (req, res) => {
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.uid }, // 🔐 ensure ownership
    req.body,
    { new: true }
  );
  res.json(updated);
});

// Delete task (only if belongs to user)
app.delete("/tasks/:id", async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
  res.json({ message: "Task deleted" });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));

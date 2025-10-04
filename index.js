const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Load Firebase service account
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware to verify Firebase ID token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // uid, email, etc.
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

// ✅ Task Schema
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  completed: Boolean,
  userId: { type: String, required: true }, // Firebase UID
});

const Task = mongoose.model("Task", taskSchema);

// ✅ All routes below this line require authentication
app.use(verifyToken);

// 📥 Get all tasks for authenticated user
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find({ userId: req.user.uid });
  res.json(tasks);
});

// ➕ Create task for authenticated user
app.post("/tasks", async (req, res) => {
  const task = new Task({
    ...req.body,
    userId: req.user.uid,
  });
  await task.save();
  res.status(201).json(task);
});

// 🖊️ Update task (only if owned by user)
app.put("/tasks/:id", async (req, res) => {
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.uid },
    req.body,
    { new: true }
  );
  if (!updated) {
    return res.status(404).json({ error: "Task not found or not authorized" });
  }
  res.json(updated);
});

// 🗑️ Delete task (only if owned by user)
app.delete("/tasks/:id", async (req, res) => {
  const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
  if (!deleted) {
    return res.status(404).json({ error: "Task not found or not authorized" });
  }
  res.json({ message: "Task deleted" });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));

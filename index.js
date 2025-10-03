const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas (replace with your real connection string)
mongoose.connect("mongodb+srv://Sashiel:Marquez18@focusflow.385yfyu.mongodb.net/?retryWrites=true&w=majority&appName=FocusFlow", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  completed: Boolean,
});

const Task = mongoose.model("Task", taskSchema);

// Routes
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.put("/tasks/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));

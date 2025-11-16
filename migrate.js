/**
 * Database Migration Script
 * 
 * This script adds the new latitude and longitude fields to existing tasks
 * and creates the User collection for FCM token management.
 * 
 * Run with: node migrate.js
 */

const mongoose = require("mongoose");

// Load environment variables (optional - only if dotenv is installed)
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not installed, assume environment variables are set directly
  console.log("ℹ️  dotenv not found, using environment variables directly");
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    runMigration();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function runMigration() {
  try {
    const db = mongoose.connection.db;
    
    // Get the tasks collection
    const tasksCollection = db.collection("tasks");
    
    // Add latitude and longitude fields to existing tasks (set to null)
    // Note: Mongoose will handle this automatically, but this ensures explicit migration
    const result = await tasksCollection.updateMany(
      { latitude: { $exists: false } },
      { $set: { latitude: null, longitude: null, reminderSent: false } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} tasks with new fields`);
    
    // Create indexes for better query performance
    await tasksCollection.createIndex({ userId: 1, startTime: 1 });
    await tasksCollection.createIndex({ userId: 1, reminderOffsetMinutes: 1, startTime: 1 });
    console.log("✅ Created indexes on tasks collection");
    
    // The User collection will be created automatically when first document is inserted
    // via the User model, so no explicit migration needed
    
    console.log("✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}


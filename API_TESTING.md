# API Testing & Verification Guide

Quick reference for testing all API endpoints to ensure everything works correctly.

## 🚀 Quick Start Testing

### Prerequisites
1. Server is running: `npm start`
2. Firebase token ready (get from your Android app or Firebase Console)
3. MongoDB connected

---

## 📝 Test Scripts

### 1. Test Task Creation with Location

```bash
# Replace YOUR_FIREBASE_TOKEN with actual token
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task with Location",
    "priority": "High",
    "startTime": 1704067200000,
    "endTime": 1704070800000,
    "location": "Test Location",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "reminderOffsetMinutes": 15
  }'
```

**Expected Response:**
```json
{
  "_id": "...",
  "title": "Test Task with Location",
  "latitude": 40.7128,
  "longitude": -74.0060,
  ...
}
```

---

### 2. Test Invalid Coordinates (Should Fail)

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Coordinates Test",
    "latitude": 100,
    "longitude": -200
  }'
```

**Expected Response:**
```json
{
  "error": "Latitude must be between -90 and 90"
}
```

---

### 3. Test Get All Tasks

```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "title": "...",
    "latitude": 40.7128,
    "longitude": -74.0060,
    ...
  }
]
```

---

### 4. Test Update Task

```bash
# Replace TASK_ID with actual task ID from previous response
curl -X PUT http://localhost:3000/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "latitude": 40.7580,
    "longitude": -73.9855
  }'
```

---

### 5. Test FCM Token Storage

```bash
curl -X POST http://localhost:3000/users/fcm-token \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "test_fcm_token_12345",
    "deviceId": "test_device_12345"
  }'
```

**Expected Response:**
```json
{
  "message": "FCM token stored successfully"
}
```

---

### 6. Test Manual Notification

```bash
# Replace TASK_ID with actual task ID
curl -X POST http://localhost:3000/tasks/TASK_ID/notify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification"
  }'
```

**Expected Response:**
```json
{
  "message": "Notification sent",
  "sent": 1,
  "failed": 0
}
```

---

### 7. Test Offline Sync

```bash
curl -X POST http://localhost:3000/tasks/sync \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "localId": "local_123",
        "title": "Synced Task 1",
        "priority": "High",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      {
        "localId": "local_456",
        "_id": "EXISTING_TASK_ID",
        "title": "Updated Task",
        "completed": true
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "synced": [
    {
      "localId": "local_123",
      "remoteId": "NEW_TASK_ID",
      "status": "created"
    },
    {
      "localId": "local_456",
      "remoteId": "EXISTING_TASK_ID",
      "status": "updated"
    }
  ],
  "errors": []
}
```

---

### 8. Test Sync Status

```bash
curl -X GET http://localhost:3000/tasks/sync-status \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Expected Response:**
```json
{
  "lastSyncTime": 1704067200000,
  "pendingCount": 0,
  "serverTime": 1704067300000
}
```

---

## ✅ Verification Checklist

### Task Endpoints
- [ ] Create task with latitude/longitude ✓
- [ ] Create task without coordinates ✓
- [ ] Get all tasks returns latitude/longitude ✓
- [ ] Update task with new coordinates ✓
- [ ] Invalid coordinates rejected ✓
- [ ] Delete task works ✓

### FCM Token Management
- [ ] Store FCM token ✓
- [ ] Update existing FCM token ✓
- [ ] Multiple devices supported ✓

### Notifications
- [ ] Manual notification sent ✓
- [ ] Notification respects user preferences ✓
- [ ] Invalid tokens cleaned up ✓

### Offline Sync
- [ ] Create new task via sync ✓
- [ ] Update existing task via sync ✓
- [ ] Sync returns correct remote IDs ✓
- [ ] Sync handles errors gracefully ✓

### Scheduled Jobs
- [ ] Reminder job runs every minute (check logs) ✓
- [ ] Daily summary scheduled (check logs) ✓

---

## 🔍 Server Log Checks

When testing, check server console for:

### Successful Operations
```
✅ Connected to MongoDB Atlas
✅ Scheduled reminder job started (runs every minute)
✅ Daily summary job scheduled (runs at 8:00 AM daily)
✅ Sent reminder for task: Task Name (task_id)
```

### Errors to Watch For
```
❌ MongoDB connection error: ...
⚠️ Failed to send reminder for task: ... - ...
Error sending notification: ...
```

---

## 🧪 Postman Collection

### Environment Variables
Create a Postman environment with:
- `baseUrl`: `http://localhost:3000`
- `firebaseToken`: Your Firebase ID token

### Collection Structure
```
FocusFlow API
├── Tasks
│   ├── GET All Tasks
│   ├── POST Create Task
│   ├── PUT Update Task
│   └── DELETE Task
├── FCM
│   └── POST Store FCM Token
├── Notifications
│   └── POST Send Notification
└── Sync
    ├── POST Sync Tasks
    └── GET Sync Status
```

---

## 📱 Android App Integration Test

### Test Flow
1. **Login** → Get Firebase token
2. **Store FCM Token** → `POST /users/fcm-token`
3. **Create Task** → `POST /tasks` with location
4. **Get Tasks** → `GET /tasks` verify location included
5. **Update Task** → `PUT /tasks/:id` mark complete
6. **Go Offline** → Create task locally
7. **Go Online** → `POST /tasks/sync` verify sync works
8. **Wait for Reminder** → Verify notification received

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** 
- Verify Firebase token is valid
- Check token hasn't expired
- Ensure "Bearer " prefix in header

### Issue: Coordinates not saving
**Solution:**
- Verify latitude is between -90 and 90
- Verify longitude is between -180 and 180
- Check data type is Number, not String

### Issue: Notifications not received
**Solution:**
- Verify FCM token stored: `POST /users/fcm-token`
- Check notification preferences enabled
- Verify quiet hours not active
- Check server logs for errors

### Issue: Sync not working
**Solution:**
- Verify Firebase token valid
- Check task data format matches schema
- Verify network connectivity
- Check sync response for errors

---

## 📊 Database Verification

### Check Tasks Collection
```javascript
// In MongoDB shell or Compass
db.tasks.find({ latitude: { $exists: true } })
```

### Check Users Collection
```javascript
db.users.find({ fcmTokens: { $exists: true } })
```

### Verify Indexes
```javascript
db.tasks.getIndexes()
// Should see indexes on userId, startTime, etc.
```

---

## 🎯 Performance Testing

### Load Test Task Creation
```bash
# Create 100 tasks
for i in {1..100}; do
  curl -X POST http://localhost:3000/tasks \
    -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Task $i\", \"priority\": \"Medium\"}" &
done
wait
```

### Test Sync with Many Tasks
```bash
# Create sync request with 50 tasks
# (Generate JSON array with 50 task objects)
curl -X POST http://localhost:3000/tasks/sync \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d @large_sync_payload.json
```

---

## ✅ Final Verification

Before deploying to production:

- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Coordinates validated properly
- [ ] FCM tokens stored and updated
- [ ] Notifications sent successfully
- [ ] Offline sync works
- [ ] Scheduled jobs running
- [ ] Database indexes created
- [ ] Server logs show no errors
- [ ] Android app integration tested

---

**Ready for Production!** 🚀


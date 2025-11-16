# Quick Start Guide - FocusFlow API Integration

## 🚀 Setup Checklist

### 1. Backend Setup
- [ ] Install dependencies: `npm install`
- [ ] Set environment variables:
  - `FIREBASE_SERVICE_ACCOUNT` (base64 encoded)
  - `MONGODB_URI`
  - `PORT` (optional, default: 3000)
- [ ] Run migration (optional): `node migrate.js`
- [ ] Start server: `npm start`

### 2. Android App Setup
- [ ] Configure Firebase Authentication
- [ ] Configure Firebase Cloud Messaging
- [ ] Set API base URL
- [ ] Implement token refresh mechanism

---

## 📱 Essential Integration Steps

### Step 1: Get Firebase Token
```kotlin
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        val token = task.result?.token
        // Use in API calls
    }
```

### Step 2: Store FCM Token (On App Start)
```kotlin
POST /users/fcm-token
{
  "fcmToken": "your_fcm_token",
  "deviceId": "device_id"
}
```

### Step 3: Create Task with Location
```kotlin
POST /tasks
{
  "title": "Task name",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "reminderOffsetMinutes": 15,
  ...
}
```

### Step 4: Implement Offline Sync
```kotlin
// When online, sync pending tasks
POST /tasks/sync
{
  "tasks": [/* pending tasks */]
}
```

---

## ✅ Quick Verification

### Test These Endpoints:
1. ✅ `GET /tasks` - Should return tasks with latitude/longitude
2. ✅ `POST /tasks` - Should create task with location
3. ✅ `POST /users/fcm-token` - Should store token
4. ✅ `POST /tasks/sync` - Should sync offline tasks

### Check Server Logs:
- ✅ "Connected to MongoDB Atlas"
- ✅ "Scheduled reminder job started"
- ✅ "Daily summary job scheduled"

---

## 📚 Documentation Files

1. **API_INTEGRATION_GUIDE.md** - Complete integration guide with examples
2. **API_TESTING.md** - Testing and verification guide
3. **FocusFlow_API.postman_collection.json** - Import into Postman for testing
4. **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

---

## 🔑 Key Points

- **Authentication**: All endpoints require `Authorization: Bearer <firebase_token>`
- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
- **FCM Token**: Store on app startup and when token refreshes
- **Offline Sync**: Use `/tasks/sync` to batch sync offline tasks
- **Notifications**: Automatically sent based on `reminderOffsetMinutes`

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Refresh Firebase token |
| Coordinates not saving | Validate range before sending |
| No notifications | Check FCM token stored, verify preferences |
| Sync not working | Check network, verify token, check error response |

---

## 📞 Need Help?

1. Check **API_INTEGRATION_GUIDE.md** for detailed examples
2. Use **API_TESTING.md** to verify endpoints
3. Import **FocusFlow_API.postman_collection.json** into Postman
4. Check server logs for errors

---

**Ready to integrate!** 🎉


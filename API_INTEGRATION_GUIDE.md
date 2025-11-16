# FocusFlow API Integration Guide

Complete guide for integrating the FocusFlow backend API with your Android app.

## 🔐 Authentication

All endpoints (except health checks) require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Getting Firebase Token (Android)
```kotlin
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val token = task.result?.token
            // Use this token in Authorization header
        }
    }
```

---

## 📍 Base URL

```
Production: https://your-api-domain.com
Development: http://localhost:3000
```

---

## 📋 API Endpoints

### 1. Task Management

#### GET /tasks
Get all tasks for the authenticated user.

**Request:**
```http
GET /tasks
Authorization: Bearer <firebase_token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Buy groceries",
    "priority": "High",
    "completed": false,
    "allDay": false,
    "startTime": 1704067200000,
    "endTime": 1704070800000,
    "location": "Supermarket",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "reminderOffsetMinutes": 30,
    "reminderSent": false
  }
]
```

**Android Example:**
```kotlin
val request = Request.Builder()
    .url("$baseUrl/tasks")
    .addHeader("Authorization", "Bearer $firebaseToken")
    .get()
    .build()

client.newCall(request).enqueue(callback)
```

---

#### POST /tasks
Create a new task.

**Request:**
```http
POST /tasks
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Team meeting",
  "priority": "Medium",
  "allDay": false,
  "startTime": 1704067200000,
  "endTime": 1704070800000,
  "location": "Conference Room A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "reminderOffsetMinutes": 15
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "title": "Team meeting",
  "priority": "Medium",
  "completed": false,
  "allDay": false,
  "startTime": 1704067200000,
  "endTime": 1704070800000,
  "location": "Conference Room A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "reminderOffsetMinutes": 15,
  "reminderSent": false
}
```

**Android Example:**
```kotlin
val taskJson = JSONObject().apply {
    put("title", "Team meeting")
    put("priority", "Medium")
    put("allDay", false)
    put("startTime", startTimeMillis)
    put("endTime", endTimeMillis)
    put("location", "Conference Room A")
    put("latitude", 40.7128)
    put("longitude", -74.0060)
    put("reminderOffsetMinutes", 15)
}

val requestBody = taskJson.toString().toRequestBody("application/json".toMediaType())

val request = Request.Builder()
    .url("$baseUrl/tasks")
    .addHeader("Authorization", "Bearer $firebaseToken")
    .post(requestBody)
    .build()
```

**Validation Errors:**
- `400 Bad Request` - Invalid latitude/longitude values
  ```json
  {
    "error": "Latitude must be between -90 and 90"
  }
  ```

---

#### PUT /tasks/:id
Update an existing task.

**Request:**
```http
PUT /tasks/507f1f77bcf86cd799439011
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated task title",
  "completed": true,
  "latitude": 40.7580,
  "longitude": -73.9855
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "title": "Updated task title",
  "completed": true,
  "latitude": 40.7580,
  "longitude": -73.9855,
  ...
}
```

**Error Responses:**
- `404 Not Found` - Task not found or not authorized
  ```json
  {
    "error": "Task not found or not authorized"
  }
  ```

---

#### DELETE /tasks/:id
Delete a task.

**Request:**
```http
DELETE /tasks/507f1f77bcf86cd799439011
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "message": "Task deleted"
}
```

---

### 2. FCM Token Management

#### POST /users/fcm-token
Store or update FCM token for push notifications.

**Request:**
```http
POST /users/fcm-token
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fcmToken": "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu",
  "deviceId": "device_12345"
}
```

**Response:**
```json
{
  "message": "FCM token stored successfully"
}
```

**Android Example:**
```kotlin
// Get FCM token
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val fcmToken = task.result
        
        // Send to backend
        val body = JSONObject().apply {
            put("fcmToken", fcmToken)
            put("deviceId", getDeviceId()) // Your device ID
        }
        
        val requestBody = body.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$baseUrl/users/fcm-token")
            .addHeader("Authorization", "Bearer $firebaseToken")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(callback)
    }
}
```

**When to Call:**
- On app startup (after user login)
- When FCM token is refreshed
- After app reinstall

---

### 3. Notifications

#### POST /tasks/:id/notify
Send a manual notification for testing.

**Request:**
```http
POST /tasks/507f1f77bcf86cd799439011/notify
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "title": "Custom Reminder",
  "body": "Don't forget this task!"
}
```

**Response:**
```json
{
  "message": "Notification sent",
  "sent": 1,
  "failed": 0
}
```

---

### 4. Offline Sync

#### POST /tasks/sync
Batch sync tasks created/updated offline.

**Request:**
```http
POST /tasks/sync
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tasks": [
    {
      "localId": "local_123",
      "_id": "507f1f77bcf86cd799439011",
      "title": "Task created offline",
      "priority": "High",
      "startTime": 1704067200000,
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    {
      "localId": "local_456",
      "title": "New offline task",
      "priority": "Medium"
    }
  ]
}
```

**Response:**
```json
{
  "synced": [
    {
      "localId": "local_123",
      "remoteId": "507f1f77bcf86cd799439011",
      "status": "updated"
    },
    {
      "localId": "local_456",
      "remoteId": "507f191e810c19729de860ea",
      "status": "created"
    }
  ],
  "errors": []
}
```

**Android Sync Strategy:**
```kotlin
// 1. Store tasks locally when offline
// 2. When online, sync all pending tasks
val pendingTasks = getPendingTasksFromLocalDB()

val syncBody = JSONObject().apply {
    put("tasks", JSONArray().apply {
        pendingTasks.forEach { task ->
            put(JSONObject().apply {
                put("localId", task.localId)
                task.remoteId?.let { put("_id", it) }
                put("title", task.title)
                // ... other fields
            })
        }
    })
}

// Send sync request
val request = Request.Builder()
    .url("$baseUrl/tasks/sync")
    .addHeader("Authorization", "Bearer $firebaseToken")
    .post(syncBody.toString().toRequestBody("application/json".toMediaType()))
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
        val result = JSONObject(response.body?.string())
        val synced = result.getJSONArray("synced")
        
        // Update local database with remote IDs
        for (i in 0 until synced.length()) {
            val item = synced.getJSONObject(i)
            updateLocalTask(
                localId = item.getString("localId"),
                remoteId = item.getString("remoteId")
            )
        }
    }
    
    override fun onFailure(call: Call, e: IOException) {
        // Retry later
    }
})
```

---

#### GET /tasks/sync-status
Get sync status information.

**Request:**
```http
GET /tasks/sync-status
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "lastSyncTime": 1704067200000,
  "pendingCount": 0,
  "serverTime": 1704067300000
}
```

---

## 🔔 Push Notifications

### Notification Payload Structure

When a push notification is received, it includes:

```json
{
  "notification": {
    "title": "⏰ Task Reminder",
    "body": "Team meeting is due soon!"
  },
  "data": {
    "taskId": "507f1f77bcf86cd799439011",
    "action": "reminder",
    "type": "task"
  }
}
```

### Android Notification Handling

```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val notification = remoteMessage.notification
        val data = remoteMessage.data
        
        if (notification != null) {
            val taskId = data["taskId"]
            val action = data["action"]
            
            // Show notification
            showNotification(
                title = notification.title ?: "",
                body = notification.body ?: "",
                taskId = taskId
            )
            
            // Handle action
            when (action) {
                "reminder" -> {
                    // Open task details
                }
                "daily_summary" -> {
                    // Open task list
                }
            }
        }
    }
}
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Invalid or missing Firebase token
**Solution:** Refresh Firebase token and retry

#### 400 Bad Request
```json
{
  "error": "Latitude must be between -90 and 90"
}
```
**Cause:** Invalid input data
**Solution:** Validate input before sending

#### 404 Not Found
```json
{
  "error": "Task not found or not authorized"
}
```
**Cause:** Task doesn't exist or belongs to another user
**Solution:** Check task ID and user permissions

#### 500 Internal Server Error
```json
{
  "error": "Failed to store FCM token"
}
```
**Cause:** Server error
**Solution:** Retry request or contact support

---

## ✅ Integration Checklist

### Initial Setup
- [ ] Configure Firebase Authentication in Android app
- [ ] Configure Firebase Cloud Messaging in Android app
- [ ] Set up base URL for API calls
- [ ] Implement token refresh mechanism

### Task Management
- [ ] Implement GET /tasks (list tasks)
- [ ] Implement POST /tasks (create task)
- [ ] Implement PUT /tasks/:id (update task)
- [ ] Implement DELETE /tasks/:id (delete task)
- [ ] Handle latitude/longitude in task creation/update
- [ ] Display location on map if coordinates exist

### Push Notifications
- [ ] Implement POST /users/fcm-token
- [ ] Call FCM token endpoint on app startup
- [ ] Handle FCM token refresh
- [ ] Implement notification receiver
- [ ] Handle notification actions (open task, etc.)

### Offline Support
- [ ] Implement local database for tasks
- [ ] Implement POST /tasks/sync
- [ ] Detect network connectivity
- [ ] Queue tasks when offline
- [ ] Sync when connection restored
- [ ] Handle sync conflicts

### Testing
- [ ] Test task CRUD operations
- [ ] Test with valid/invalid coordinates
- [ ] Test FCM token storage
- [ ] Test push notifications
- [ ] Test offline sync
- [ ] Test error handling

---

## 🧪 Testing Examples

### Test Task Creation with Location
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visit Central Park",
    "priority": "High",
    "startTime": 1704067200000,
    "latitude": 40.7829,
    "longitude": -73.9654,
    "reminderOffsetMinutes": 30
  }'
```

### Test FCM Token Storage
```bash
curl -X POST http://localhost:3000/users/fcm-token \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "test_token_123",
    "deviceId": "device_12345"
  }'
```

### Test Offline Sync
```bash
curl -X POST http://localhost:3000/tasks/sync \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "localId": "local_1",
        "title": "Synced task",
        "priority": "Medium"
      }
    ]
  }'
```

---

## 📱 Android Integration Tips

### 1. Network Interceptor for Token Refresh
```kotlin
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val token = tokenProvider()
        
        val authenticatedRequest = request.newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()
        
        var response = chain.proceed(authenticatedRequest)
        
        // Handle 401 - refresh token and retry
        if (response.code == 401) {
            val newToken = refreshFirebaseToken()
            val retryRequest = request.newBuilder()
                .addHeader("Authorization", "Bearer $newToken")
                .build()
            response = chain.proceed(retryRequest)
        }
        
        return response
    }
}
```

### 2. Offline Queue Manager
```kotlin
class OfflineQueueManager {
    private val pendingTasks = mutableListOf<Task>()
    
    fun addTask(task: Task) {
        if (isOnline()) {
            syncTask(task)
        } else {
            pendingTasks.add(task)
            saveToLocalDB(task)
        }
    }
    
    fun syncPendingTasks() {
        if (pendingTasks.isNotEmpty() && isOnline()) {
            syncTasks(pendingTasks)
            pendingTasks.clear()
        }
    }
}
```

### 3. Coordinate Validation
```kotlin
fun validateCoordinates(lat: Double?, lng: Double?): Boolean {
    return when {
        lat == null && lng == null -> true // Both null is OK
        lat != null && (lat < -90 || lat > 90) -> false
        lng != null && (lng < -180 || lng > 180) -> false
        else -> true
    }
}
```

---

## 🔍 Debugging

### Enable Logging
Check server logs for:
- `✅ Sent reminder for task: ...` - Reminder sent successfully
- `⚠️ Failed to send reminder...` - Reminder failed
- `✅ Scheduled reminder job started` - Cron job running

### Common Issues

1. **Notifications not received**
   - Check FCM token is stored: `POST /users/fcm-token`
   - Verify token is valid
   - Check notification preferences are enabled
   - Verify quiet hours settings

2. **Sync not working**
   - Check network connectivity
   - Verify Firebase token is valid
   - Check sync endpoint response for errors
   - Verify task data format

3. **Coordinates not saving**
   - Validate coordinates before sending
   - Check error response for validation messages
   - Ensure latitude/longitude are numbers, not strings

---

## 📞 Support

For issues or questions:
1. Check server logs
2. Verify environment variables are set
3. Test endpoints with curl/Postman
4. Check Firebase console for FCM delivery status

---

**Last Updated:** 2024
**API Version:** 1.0.0


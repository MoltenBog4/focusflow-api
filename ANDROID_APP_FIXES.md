# Android App Fixes Checklist

Complete list of changes needed in your Android app to properly integrate with the FocusFlow backend API.

## 🔐 1. Firebase Authentication - Get ID Token

### ❌ Current Issue
You're likely using the wrong token type or not getting the token correctly.

### ✅ Fix Required

**Location:** Wherever you're making API calls

**Change:**
```kotlin
// ❌ WRONG - Don't use FCM token for authentication
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    val fcmToken = task.result // This is NOT an ID token!
}

// ✅ CORRECT - Use Firebase Auth ID token
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val idToken = task.result?.token
            // Use this idToken in Authorization header
        } else {
            Log.e("Auth", "Failed to get ID token", task.exception)
        }
    }
```

**Key Points:**
- Use `FirebaseAuth.getInstance().currentUser?.getIdToken(true)`
- The `true` parameter forces a fresh token (important!)
- This is different from FCM token (`FirebaseMessaging.getInstance().token`)

---

## 📡 2. API Client Setup

### ✅ Create/Update API Client

**Create a new file:** `ApiClient.kt` or update existing

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class ApiClient(private val baseUrl: String) {
    private val client = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .build()
    
    // Get Firebase ID token synchronously
    private fun getFirebaseIdToken(forceRefresh: Boolean = false): String? {
        val user = FirebaseAuth.getInstance().currentUser ?: return null
        
        val latch = CountDownLatch(1)
        var token: String? = null
        
        user.getIdToken(forceRefresh)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    token = task.result?.token
                }
                latch.countDown()
            }
        
        latch.await(5, TimeUnit.SECONDS)
        return token
    }
    
    // Auth interceptor to add token to all requests
    private inner class AuthInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val token = getFirebaseIdToken()
            
            if (token == null) {
                throw IllegalStateException("User not authenticated")
            }
            
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
            
            var response = chain.proceed(request)
            
            // If 401, token might be expired, refresh and retry once
            if (response.code == 401) {
                response.close()
                val newToken = getFirebaseIdToken(forceRefresh = true)
                if (newToken != null) {
                    val retryRequest = chain.request().newBuilder()
                        .addHeader("Authorization", "Bearer $newToken")
                        .build()
                    response = chain.proceed(retryRequest)
                }
            }
            
            return response
        }
    }
    
    // GET request
    fun get(path: String, callback: (Response) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl$path")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(response)
            }
            
            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
    
    // POST request
    fun post(path: String, body: JSONObject, callback: (Response) -> Unit) {
        val requestBody = body.toString()
            .toRequestBody("application/json".toMediaType())
        
        val request = Request.Builder()
            .url("$baseUrl$path")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(response)
            }
            
            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
    
    // PUT request
    fun put(path: String, body: JSONObject, callback: (Response) -> Unit) {
        val requestBody = body.toString()
            .toRequestBody("application/json".toMediaType())
        
        val request = Request.Builder()
            .url("$baseUrl$path")
            .put(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(response)
            }
            
            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
    
    // DELETE request
    fun delete(path: String, callback: (Response) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl$path")
            .delete()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(response)
            }
            
            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
}
```

---

## 🌐 3. Update Base URL

### ✅ Set Production URL

**Location:** Constants or Config file

```kotlin
object ApiConfig {
    // Development
    // const val BASE_URL = "http://10.0.2.2:3000" // Android emulator
    // const val BASE_URL = "http://localhost:3000" // Not for Android!
    
    // Production (Render)
    const val BASE_URL = "https://your-service-name.onrender.com"
    
    // Make sure to replace "your-service-name" with your actual Render service name
}
```

---

## 📋 4. Task API Calls

### ✅ Update Task Creation

**Location:** Where you create tasks

```kotlin
fun createTask(task: Task) {
    val apiClient = ApiClient(ApiConfig.BASE_URL)
    
    val body = JSONObject().apply {
        put("title", task.title)
        put("priority", task.priority)
        put("allDay", task.allDay)
        task.startTime?.let { put("startTime", it) }
        task.endTime?.let { put("endTime", it) }
        task.location?.let { put("location", it) }
        task.latitude?.let { put("latitude", it) }
        task.longitude?.let { put("longitude", it) }
        task.reminderOffsetMinutes?.let { put("reminderOffsetMinutes", it) }
    }
    
    apiClient.post("/tasks", body) { response ->
        if (response.isSuccessful) {
            val responseBody = response.body?.string()
            // Parse response and update local database
        } else {
            // Handle error
            val errorBody = response.body?.string()
            Log.e("API", "Error: ${response.code} - $errorBody")
        }
    }
}
```

### ✅ Update Task Fetching

```kotlin
fun fetchTasks(callback: (List<Task>) -> Unit) {
    val apiClient = ApiClient(ApiConfig.BASE_URL)
    
    apiClient.get("/tasks") { response ->
        if (response.isSuccessful) {
            val responseBody = response.body?.string()
            val tasksJson = JSONArray(responseBody)
            val tasks = parseTasksFromJson(tasksJson)
            callback(tasks)
        } else {
            Log.e("API", "Error fetching tasks: ${response.code}")
            callback(emptyList())
        }
    }
}
```

### ✅ Update Task Update

```kotlin
fun updateTask(taskId: String, updates: Map<String, Any>) {
    val apiClient = ApiClient(ApiConfig.BASE_URL)
    
    val body = JSONObject().apply {
        updates.forEach { (key, value) ->
            when (value) {
                is String -> put(key, value)
                is Int -> put(key, value)
                is Long -> put(key, value)
                is Double -> put(key, value)
                is Boolean -> put(key, value)
                is Number -> put(key, value)
                null -> put(key, JSONObject.NULL)
            }
        }
    }
    
    apiClient.put("/tasks/$taskId", body) { response ->
        if (response.isSuccessful) {
            // Task updated successfully
        } else {
            // Handle error
        }
    }
}
```

---

## 🔔 5. FCM Token Storage

### ✅ Store FCM Token on App Start

**Location:** Application class or MainActivity onCreate

```kotlin
// In your Application class or MainActivity
private fun registerFcmToken() {
    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val fcmToken = task.result
            
            // Get Firebase ID token for authentication
            FirebaseAuth.getInstance().currentUser?.getIdToken(true)
                ?.addOnCompleteListener { idTokenTask ->
                    if (idTokenTask.isSuccessful) {
                        val idToken = idTokenTask.result?.token
                        
                        // Store FCM token on backend
                        val apiClient = ApiClient(ApiConfig.BASE_URL)
                        val body = JSONObject().apply {
                            put("fcmToken", fcmToken)
                            put("deviceId", getDeviceId()) // Your device ID method
                        }
                        
                        // Temporarily add auth header for this call
                        val requestBody = body.toString()
                            .toRequestBody("application/json".toMediaType())
                        
                        val request = Request.Builder()
                            .url("${ApiConfig.BASE_URL}/users/fcm-token")
                            .addHeader("Authorization", "Bearer $idToken")
                            .post(requestBody)
                            .build()
                        
                        OkHttpClient().newCall(request).enqueue(object : Callback {
                            override fun onResponse(call: Call, response: Response) {
                                if (response.isSuccessful) {
                                    Log.d("FCM", "FCM token stored successfully")
                                }
                            }
                            
                            override fun onFailure(call: Call, e: IOException) {
                                Log.e("FCM", "Failed to store FCM token", e)
                            }
                        })
                    }
                }
        } else {
            Log.e("FCM", "Failed to get FCM token", task.exception)
        }
    }
}

private fun getDeviceId(): String {
    return Settings.Secure.getString(
        contentResolver,
        Settings.Secure.ANDROID_ID
    )
}
```

**When to call:**
- On app startup (after user login)
- When FCM token is refreshed
- After app reinstall

---

## 🔄 6. Offline Sync Implementation

### ✅ Implement Offline Sync

**Location:** Network connectivity handler or sync service

```kotlin
fun syncOfflineTasks() {
    val apiClient = ApiClient(ApiConfig.BASE_URL)
    
    // Get pending tasks from local database
    val pendingTasks = getPendingTasksFromLocalDB()
    
    if (pendingTasks.isEmpty()) return
    
    val tasksArray = JSONArray()
    pendingTasks.forEach { task ->
        tasksArray.put(JSONObject().apply {
            task.localId?.let { put("localId", it) }
            task.remoteId?.let { put("_id", it) }
            put("title", task.title)
            put("priority", task.priority)
            task.startTime?.let { put("startTime", it) }
            task.endTime?.let { put("endTime", it) }
            task.location?.let { put("location", it) }
            task.latitude?.let { put("latitude", it) }
            task.longitude?.let { put("longitude", it) }
            put("completed", task.completed)
        })
    }
    
    val body = JSONObject().apply {
        put("tasks", tasksArray)
    }
    
    apiClient.post("/tasks/sync", body) { response ->
        if (response.isSuccessful) {
            val responseBody = response.body?.string()
            val result = JSONObject(responseBody)
            
            // Update local database with remote IDs
            val synced = result.getJSONArray("synced")
            for (i in 0 until synced.length()) {
                val item = synced.getJSONObject(i)
                val localId = item.getString("localId")
                val remoteId = item.getString("remoteId")
                
                updateLocalTaskRemoteId(localId, remoteId)
            }
            
            // Handle errors if any
            if (result.has("errors")) {
                val errors = result.getJSONArray("errors")
                // Log or handle errors
            }
        }
    }
}
```

---

## ✅ 7. Coordinate Validation

### ✅ Add Coordinate Validation

**Location:** Before creating/updating tasks with location

```kotlin
fun validateCoordinates(latitude: Double?, longitude: Double?): Boolean {
    return when {
        latitude == null && longitude == null -> true // Both null is OK
        latitude != null && (latitude < -90 || latitude > 90) -> false
        longitude != null && (longitude < -180 || longitude > 180) -> false
        else -> true
    }
}

// Usage
if (!validateCoordinates(task.latitude, task.longitude)) {
    // Show error to user
    showError("Invalid coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180")
    return
}
```

---

## 📱 8. Dependencies Check

### ✅ Verify Gradle Dependencies

**Location:** `app/build.gradle`

```gradle
dependencies {
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth-ktx'
    implementation 'com.google.firebase:firebase-messaging-ktx'
    
    // Networking
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // JSON parsing
    implementation 'org.json:json:20231013'
    
    // Coroutines (if using)
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

---

## 🔍 9. Error Handling

### ✅ Improve Error Handling

```kotlin
fun handleApiError(response: Response) {
    when (response.code) {
        401 -> {
            // Unauthorized - token expired or invalid
            // Refresh token and retry, or redirect to login
            Log.e("API", "Unauthorized - check Firebase token")
        }
        400 -> {
            // Bad request - validation error
            val errorBody = response.body?.string()
            Log.e("API", "Bad request: $errorBody")
        }
        404 -> {
            // Not found
            Log.e("API", "Resource not found")
        }
        500 -> {
            // Server error
            Log.e("API", "Server error")
        }
    }
}
```

---

## 📝 10. Checklist Summary

- [ ] **Fix Firebase ID Token** - Use `FirebaseAuth.getInstance().currentUser?.getIdToken(true)` instead of FCM token
- [ ] **Create/Update API Client** - Add auth interceptor with proper token handling
- [ ] **Update Base URL** - Set to your Render service URL
- [ ] **Update Task API Calls** - Include latitude/longitude in create/update
- [ ] **Store FCM Token** - Call `/users/fcm-token` on app startup
- [ ] **Implement Offline Sync** - Add `/tasks/sync` endpoint call
- [ ] **Add Coordinate Validation** - Validate before sending to API
- [ ] **Check Dependencies** - Ensure Firebase and OkHttp are included
- [ ] **Improve Error Handling** - Handle 401, 400, 404, 500 errors
- [ ] **Test All Endpoints** - Verify each API call works correctly

---

## 🧪 11. Testing Steps

1. **Test Authentication:**
   - Login user
   - Verify ID token is retrieved
   - Check token format (should have 3 parts separated by dots)

2. **Test Task Creation:**
   - Create task without location
   - Create task with location (latitude/longitude)
   - Verify task appears in GET /tasks response

3. **Test FCM Token:**
   - Check FCM token is stored on app start
   - Verify in server logs or database

4. **Test Offline Sync:**
   - Create task while offline
   - Go online
   - Verify sync works
   - Check local ID maps to remote ID

5. **Test Error Cases:**
   - Invalid coordinates
   - Expired token
   - Network errors

---

## 🆘 Common Issues to Watch For

1. **Using FCM token instead of ID token** - Most common mistake!
2. **Token not refreshed** - Always use `forceRefresh = true`
3. **Base URL wrong** - Make sure it's your Render URL
4. **Coordinates as strings** - Must be numbers (Double)
5. **Missing Authorization header** - Must include "Bearer " prefix

---

**After making these changes, your Android app should work correctly with the backend API!** 🚀


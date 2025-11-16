# Firebase Token Troubleshooting Guide

## 🔴 Error: "Decoding Firebase ID token failed"

This error means the server received an invalid or malformed Firebase ID token.

---

## ✅ Correct Way to Get Firebase ID Token (Android)

### Method 1: Using FirebaseAuth (Recommended)
```kotlin
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val idToken = task.result?.token
            // Use this token in Authorization header
            // Format: "Bearer $idToken"
        } else {
            Log.e("Auth", "Failed to get ID token", task.exception)
        }
    }
```

### Method 2: Using await (Coroutines)
```kotlin
suspend fun getFirebaseIdToken(): String? {
    return suspendCoroutine { continuation ->
        FirebaseAuth.getInstance().currentUser?.getIdToken(true)
            ?.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    continuation.resume(task.result?.token)
                } else {
                    continuation.resume(null)
                }
            }
    }
}
```

---

## ❌ Common Mistakes

### 1. Using FCM Token Instead of ID Token
**WRONG:**
```kotlin
// This is an FCM token, NOT an ID token!
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    val fcmToken = task.result // ❌ This is NOT an ID token
}
```

**CORRECT:**
```kotlin
// This is the ID token for authentication
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        val idToken = task.result?.token // ✅ This is the ID token
    }
```

### 2. Using Access Token Instead of ID Token
**WRONG:**
```kotlin
// Access tokens are for Google APIs, not Firebase Auth
val accessToken = GoogleSignIn.getLastSignedInAccount(context)?.idToken // ❌
```

### 3. Not Refreshing Expired Tokens
**WRONG:**
```kotlin
// Token might be expired
val token = cachedToken // ❌ May be expired
```

**CORRECT:**
```kotlin
// Always get fresh token with forceRefresh = true
FirebaseAuth.getInstance().currentUser?.getIdToken(true) // ✅
```

### 4. Truncating the Token
**WRONG:**
```kotlin
val token = fullToken.substring(0, 100) // ❌ Token is incomplete
```

**CORRECT:**
```kotlin
val token = fullToken // ✅ Use entire token
```

---

## 🔍 How to Verify Your Token

### Check Token Format
A valid Firebase ID token is a JWT with 3 parts separated by dots:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20v...signature
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^
           Header (Base64)                          Payload (Base64)                              Signature
```

### Test Token in Code
```kotlin
fun isValidTokenFormat(token: String): Boolean {
    val parts = token.split(".")
    return parts.size == 3 && parts.all { it.isNotBlank() }
}

// Usage
val token = getFirebaseIdToken()
if (token != null && isValidTokenFormat(token)) {
    // Token format is correct
    makeApiCall(token)
} else {
    Log.e("Auth", "Invalid token format")
}
```

---

## 🧪 Testing Your Token

### 1. Log the Token (for debugging)
```kotlin
FirebaseAuth.getInstance().currentUser?.getIdToken(true)
    ?.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val token = task.result?.token
            Log.d("Auth", "Token length: ${token?.length}")
            Log.d("Auth", "Token preview: ${token?.substring(0, 50)}...")
            Log.d("Auth", "Token parts: ${token?.split(".")?.size}")
            
            // Should see:
            // Token length: ~800-1200 characters
            // Token preview: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
            // Token parts: 3
        }
    }
```

### 2. Test with cURL
```bash
# Get token from your app logs, then test:
curl -X GET https://your-api.onrender.com/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN_HERE"
```

### 3. Decode Token (for debugging)
Use [jwt.io](https://jwt.io) to decode and inspect your token:
- Paste the token
- Check if it has 3 parts
- Verify the payload contains `iss`, `aud`, `sub`, `exp` fields

---

## 🔧 Fixing Common Issues

### Issue: Token is null
**Cause:** User is not logged in
**Solution:**
```kotlin
val user = FirebaseAuth.getInstance().currentUser
if (user == null) {
    // User not logged in, redirect to login
    startActivity(Intent(this, LoginActivity::class.java))
    return
}

user.getIdToken(true) // Now safe to call
```

### Issue: Token is expired
**Cause:** Token expired (tokens expire after 1 hour)
**Solution:**
```kotlin
// Always use forceRefresh = true to get fresh token
FirebaseAuth.getInstance().currentUser?.getIdToken(true) // ✅
```

### Issue: Token format is wrong
**Cause:** Using wrong type of token
**Solution:**
- Make sure you're using `FirebaseAuth.getInstance().currentUser?.getIdToken()`
- NOT `FirebaseMessaging.getInstance().token` (that's FCM token)
- NOT Google Sign-In access token

### Issue: Token is truncated
**Cause:** Token string is being cut off
**Solution:**
- Check if you're using `substring()` on the token
- Verify the entire token is being sent in the Authorization header
- Check network interceptor isn't modifying the header

---

## 📱 Complete Android Example

```kotlin
class ApiClient {
    private val client = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .build()
    
    private class AuthInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val token = getFirebaseIdTokenSync()
            
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
            
            var response = chain.proceed(request)
            
            // If 401, token might be expired, refresh and retry
            if (response.code == 401) {
                val newToken = getFirebaseIdTokenSync(forceRefresh = true)
                val retryRequest = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $newToken")
                    .build()
                response = chain.proceed(retryRequest)
            }
            
            return response
        }
        
        private fun getFirebaseIdTokenSync(forceRefresh: Boolean = false): String? {
            val user = FirebaseAuth.getInstance().currentUser ?: return null
            
            val latch = CountDownLatch(1)
            var token: String? = null
            
            user.getIdToken(forceRefresh)
                .addOnCompleteListener { task ->
                    token = task.result?.token
                    latch.countDown()
                }
            
            latch.await(5, TimeUnit.SECONDS)
            return token
        }
    }
}
```

---

## 🔍 Server-Side Debugging

The server now provides better error messages. Check the response:

```json
{
  "error": "Invalid token format",
  "details": "Firebase ID token must be a valid JWT (3 parts separated by dots)"
}
```

Or:
```json
{
  "error": "Unauthorized",
  "details": "Invalid token format. Make sure you're sending a Firebase ID token (not FCM token). Use FirebaseAuth.getInstance().currentUser?.getIdToken(true)"
}
```

---

## ✅ Checklist

- [ ] Using `FirebaseAuth.getInstance().currentUser?.getIdToken(true)`
- [ ] NOT using FCM token (`FirebaseMessaging.getInstance().token`)
- [ ] Token has 3 parts separated by dots
- [ ] Token is not null or empty
- [ ] Token is not truncated
- [ ] Authorization header format: `Bearer <token>`
- [ ] User is logged in before getting token
- [ ] Token is refreshed when expired (forceRefresh = true)

---

## 🆘 Still Having Issues?

1. **Check server logs** - Look for token preview in error messages
2. **Log token in Android** - Verify token format before sending
3. **Test with Postman** - Use a valid token from your app
4. **Verify Firebase project** - Make sure service account matches your Firebase project
5. **Check token expiration** - Tokens expire after 1 hour

---

**Remember:** Firebase ID Token ≠ FCM Token
- **ID Token**: For authentication (from `FirebaseAuth`)
- **FCM Token**: For push notifications (from `FirebaseMessaging`)


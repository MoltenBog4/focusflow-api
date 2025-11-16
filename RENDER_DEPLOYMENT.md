# Render Deployment Guide

Complete guide for deploying FocusFlow API to Render.com

## 🔐 Required Environment Variables

You need to set these environment variables in your Render service:

### 1. `FIREBASE_SERVICE_ACCOUNT` (Required)
Base64-encoded Firebase service account JSON.

**How to get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Encode it to Base64:

**On Windows (PowerShell):**
```powershell
$content = Get-Content -Path "path/to/serviceAccountKey.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "encoded.txt"
```

**On Mac/Linux:**
```bash
base64 -i serviceAccountKey.json -o encoded.txt
```

**Or use online tool:**
- Copy the entire JSON content
- Use [base64encode.org](https://www.base64encode.org/)
- Copy the encoded string

**In Render:**
- Key: `FIREBASE_SERVICE_ACCOUNT`
- Value: The entire base64-encoded string (no line breaks)

---

### 2. `MONGODB_URI` (Required)
MongoDB connection string.

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**How to get it:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<database>` with your database name (e.g., `focusflow`)

**In Render:**
- Key: `MONGODB_URI`
- Value: Your MongoDB connection string

---

### 3. `PORT` (Optional)
Server port number.

**Default:** `3000`

**Note:** Render automatically sets `PORT` environment variable, so you typically don't need to set this manually. However, if you want to override it:

**In Render:**
- Key: `PORT`
- Value: `3000` (or your preferred port)

---

## 🚀 Deployment Steps on Render

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository (or use public Git repository)

### Step 2: Configure Service

**Basic Settings:**
- **Name:** `focusflow-api` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)
- **Root Directory:** `focusflow-api` (if your code is in a subdirectory)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 3: Set Environment Variables

Click **Environment** tab and add:

```
FIREBASE_SERVICE_ACCOUNT = <your-base64-encoded-json>
MONGODB_URI = <your-mongodb-connection-string>
```

**Important Notes:**
- ✅ Do NOT include quotes around values
- ✅ For `FIREBASE_SERVICE_ACCOUNT`, paste the entire base64 string (it will be very long)
- ✅ Make sure there are no line breaks in the base64 string
- ✅ Click **Save Changes** after adding each variable

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Start your service (`npm start`)
3. Wait for deployment to complete
4. Your API will be available at: `https://your-service-name.onrender.com`

---

## 🔍 Verification

After deployment, check the logs to verify:

### Expected Logs:
```
✅ Connected to MongoDB Atlas
✅ Scheduled reminder job started (runs every minute)
✅ Daily summary job scheduled (runs at 8:00 AM daily)
🚀 API on :10000
```

**Note:** Render uses port 10000 internally, but your app should use the `PORT` environment variable.

### Test Your API:
```bash
curl https://your-service-name.onrender.com/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## ⚠️ Common Issues

### Issue: "FIREBASE_SERVICE_ACCOUNT is not set"
**Solution:**
- Verify the environment variable is set in Render
- Check for typos in variable name
- Ensure the base64 string is complete (no truncation)

### Issue: "MongoDB connection error"
**Solution:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- Verify database user has correct permissions

### Issue: Service crashes on startup
**Solution:**
- Check Render logs for error messages
- Verify all environment variables are set
- Ensure `package.json` has correct start script
- Check Node.js version compatibility

### Issue: Base64 encoding problems
**Solution:**
- Ensure the entire JSON file is encoded (including all brackets)
- Remove any line breaks from the base64 string
- Verify the original JSON is valid

---

## 🔒 Security Best Practices

1. **Never commit service account keys to Git**
   - Keep `serviceAccountKey.json` in `.gitignore`
   - Only use base64-encoded version in environment variables

2. **MongoDB Security:**
   - Use strong passwords
   - Whitelist only necessary IPs (or `0.0.0.0/0` for Render)
   - Use database user with minimal required permissions

3. **Environment Variables:**
   - Mark sensitive variables as "Secret" in Render
   - Rotate keys periodically
   - Don't share environment variable values

---

## 📝 Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Yes | Base64-encoded Firebase service account JSON | `eyJ0eXAiOiJKV1QiLCJhbGc...` |
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT` | ❌ No | Server port (Render sets this automatically) | `3000` |

---

## 🔄 Updating Environment Variables

1. Go to your service in Render Dashboard
2. Click **Environment** tab
3. Edit the variable value
4. Click **Save Changes**
5. Render will automatically redeploy your service

---

## 📊 Monitoring

### View Logs:
1. Go to your service in Render Dashboard
2. Click **Logs** tab
3. View real-time logs

### Health Checks:
Render automatically monitors your service. If it crashes, Render will attempt to restart it.

---

## 🎯 Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Service deployed successfully
- [ ] Logs show MongoDB connection successful
- [ ] Logs show scheduled jobs started
- [ ] API responds to test requests
- [ ] FCM token storage works
- [ ] Task creation with coordinates works
- [ ] Notifications can be sent

---

## 🔗 Update Your Android App

After deployment, update your Android app's base URL:

```kotlin
// Development
val baseUrl = "http://localhost:3000"

// Production
val baseUrl = "https://your-service-name.onrender.com"
```

---

## 💡 Pro Tips

1. **Free Tier Limitations:**
   - Render free tier services spin down after 15 minutes of inactivity
   - First request after spin-down may be slow (cold start)
   - Consider upgrading for production use

2. **Custom Domain:**
   - You can add a custom domain in Render settings
   - Update your Android app to use the custom domain

3. **Database Indexes:**
   - Run the migration script locally first
   - Or indexes will be created automatically when first used

4. **Monitoring:**
   - Set up alerts in Render for service failures
   - Monitor MongoDB Atlas for database performance

---

**Your API is now live on Render!** 🚀


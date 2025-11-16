# Environment Variables Reference

Quick reference for all environment variables needed for FocusFlow API.

## 📋 Required Variables

### 1. `FIREBASE_SERVICE_ACCOUNT`
**Type:** String (Base64-encoded JSON)  
**Required:** ✅ Yes  
**Description:** Firebase Admin SDK service account credentials

**How to get:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download JSON file
4. Encode to Base64 (see below)

**Base64 Encoding:**

**Windows PowerShell:**
```powershell
$content = Get-Content -Path "serviceAccountKey.json" -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [Convert]::ToBase64String($bytes)
$base64
```

**Mac/Linux:**
```bash
base64 -i serviceAccountKey.json
```

**Online:**
- Use [base64encode.org](https://www.base64encode.org/)
- Paste entire JSON content
- Copy encoded result

**Example:**
```
FIREBASE_SERVICE_ACCOUNT=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZm9jdXNmbG93LXByb2plY3QiLCJhdWQiOiJmb2N1c2Zsb3ctcHJvamVjdCIsImV4cCI6MTcwNDA2NzIwMDAsImlhdCI6MTcwNDA2MzYwMCwic3ViIjoiZmlyZWJhc2UtYWRtaW4tc2RrIn0...
```

---

### 2. `MONGODB_URI`
**Type:** String (Connection String)  
**Required:** ✅ Yes  
**Description:** MongoDB Atlas connection string

**How to get:**
1. MongoDB Atlas → Your Cluster → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password
5. Replace `<database>` with database name (e.g., `focusflow`)

**Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Example:**
```
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/focusflow?retryWrites=true&w=majority
```

**Important:**
- Replace `<password>` with your actual database password
- Replace `<database>` with your database name
- Keep the query parameters (`?retryWrites=true&w=majority`)

---

## 🔧 Optional Variables

### 3. `PORT`
**Type:** Number  
**Required:** ❌ No (defaults to 3000)  
**Description:** Server port number

**Note:** Render automatically sets this to `10000`, so you typically don't need to set it manually.

**Example:**
```
PORT=3000
```

---

## 🚀 For Render Deployment

In Render Dashboard → Your Service → Environment:

1. **Add `FIREBASE_SERVICE_ACCOUNT`:**
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Your entire base64-encoded string (very long, no line breaks)

2. **Add `MONGODB_URI`:**
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string

3. **Don't set `PORT`** (Render handles this automatically)

---

## ✅ Verification

After setting environment variables, check logs for:

```
✅ Connected to MongoDB Atlas
✅ Scheduled reminder job started
🚀 API on :10000
```

If you see errors, verify:
- Environment variable names are exact (case-sensitive)
- No extra spaces or quotes
- Base64 string is complete
- MongoDB URI is correct and accessible

---

## 🔒 Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Never commit `serviceAccountKey.json` to Git
- ✅ Use Render's "Secret" option for sensitive variables
- ✅ Rotate keys periodically
- ✅ Use strong MongoDB passwords

---

## 📝 Quick Checklist

- [ ] `FIREBASE_SERVICE_ACCOUNT` - Base64-encoded Firebase service account
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] MongoDB IP whitelist includes Render IPs (or `0.0.0.0/0`)
- [ ] Environment variables set in Render dashboard
- [ ] Service deployed and logs show success

---

**Ready to deploy!** 🚀


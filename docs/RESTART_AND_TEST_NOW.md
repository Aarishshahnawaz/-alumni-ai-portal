# ✅ Gmail App Password Updated!

## Current Configuration
```env
EMAIL_USER=iitianaarish@gmail.com  ✅
EMAIL_PASS=ltzaipmtioqdygbq       ✅ NEW PASSWORD
```

---

## 🚀 RESTART BACKEND SERVER NOW

### Step 1: Stop Current Server
In your backend terminal, press:
```
Ctrl + C
```

### Step 2: Start Server Again
```bash
cd alumni-portal-backend
npm start
```

### Step 3: Verify Configuration
You should see in console:
```
🔍 Environment Variables Check:
📧 EMAIL_USER: iitianaarish@gmail.com
🔑 EMAIL_PASS configured: true
```

**NO WARNING MESSAGES!** ✅

---

## 🧪 TEST OTP SYSTEM

### Option 1: Frontend (Recommended)
```
1. Open: http://localhost:3000/register
2. Enter email: test@example.com
3. Select role: Student
4. Click "Send OTP"
5. Check email inbox (and spam folder)
```

### Option 2: API Test
```bash
curl -X POST http://localhost:5000/api/pre-registration/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"student"}'
```

---

## 📊 Expected Backend Console Output

### Successful Flow:
```
🔍 ========== SEND OTP REQUEST START ==========
📦 Incoming body: { "email": "test@example.com", "role": "student" }
📧 Email: test@example.com
👤 Role: student
✅ Basic validation passed
🔍 Validating institutional email...
⚠️ [DEV MODE] Allowing all email domains for testing: test@example.com
✅ Email validation passed
🔍 Checking for existing user...
✅ No existing user found
🔍 Checking for existing verification record...
✅ No existing verification record
🔢 Generating OTP...
✅ OTP generated: 123456
⏰ OTP expires at: 2024-...
🗑️ Deleting old verification records...
✅ Old records deleted
💾 Creating new verification record...
✅ Verification record saved (OTP hashed)
📧 Attempting to send OTP email...
📧 Email recipient: test@example.com
📧 OTP to send: 123456
📧 Role: student
📧 Sending OTP email via Gmail SMTP...
📧 From: iitianaarish@gmail.com
📧 To: test@example.com
🔑 OTP: 123456
✅ Email sent successfully!
📬 Message ID: <...@gmail.com>
✅ Check inbox (and spam folder)
✅ OTP email sent successfully!
✅ ========== SEND OTP SUCCESS ==========
```

### If Error Occurs:
```
🔥 ========== EMAIL SEND ERROR ==========
🔥 Error name: ...
🔥 Error message: ...
🔥 Error code: ...
🔥 ========================================
```

---

## ✅ Success Indicators

### Backend Response (200 OK):
```json
{
  "success": true,
  "message": "OTP sent successfully to your institutional email. Please check your inbox.",
  "data": {
    "email": "test@example.com",
    "expiresIn": "5 minutes"
  }
}
```

### Email Received:
- ✅ Subject: "Verify Your Email - AlumniAI Portal Registration"
- ✅ From: AlumniAI Portal <iitianaarish@gmail.com>
- ✅ Contains 6-digit OTP
- ✅ Professional HTML template

---

## 🐛 If Still Getting Error

### Check Backend Console For:
1. **EAUTH Error** → Gmail authentication failed
   - Verify 2-Step Verification is enabled
   - Generate NEW App Password
   - Update .env file

2. **ECONNECTION Error** → Network issue
   - Check internet connection
   - Check firewall settings

3. **Other Error** → Copy FULL error and share

---

## 🎯 Quick Test Checklist

- [ ] Backend server restarted
- [ ] Console shows: "🔑 EMAIL_PASS configured: true"
- [ ] No warning messages
- [ ] Open http://localhost:3000/register
- [ ] Enter email + role
- [ ] Click "Send OTP"
- [ ] Check backend console for detailed logs
- [ ] Check email inbox (and spam folder)
- [ ] OTP received

---

## 🚀 DO THIS NOW:

1. **Restart backend server** (Ctrl+C, then npm start)
2. **Test OTP**: http://localhost:3000/register
3. **Check email inbox** for OTP
4. **If error occurs**, copy the FULL backend console output and share it

---

**New App Password configured!** ✅

**Ready to test!** 🚀

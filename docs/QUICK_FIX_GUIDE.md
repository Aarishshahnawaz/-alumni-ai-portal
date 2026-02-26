# ⚡ Quick Fix Guide - OTP System

## Problem
```
POST /api/pre-registration/send-otp → 500 Internal Server Error
```

## Root Cause
```env
EMAIL_PASS=PASTE_YOUR_16_DIGIT_APP_PASSWORD_HERE  ← Placeholder value
```

---

## 🚀 5-Minute Fix

### 1. Generate App Password
https://myaccount.google.com/apppasswords

- Select: Mail
- Device: Other → "AlumniAI Portal"
- Copy: 16-digit password (remove spaces)

### 2. Update .env
File: `alumni-portal-backend/.env` (line 29)

```env
EMAIL_PASS=abcdefghijklmnop
```

### 3. Restart Backend
```bash
cd alumni-portal-backend
# Ctrl+C to stop
npm start
```

### 4. Test
```bash
curl http://localhost:5000/api/test/test-email
```

---

## ✅ Success Indicators

### Before
```
⚠️ WARNING: EMAIL_USER not configured!
POST /api/pre-registration/send-otp → 500 Error
```

### After
```
📧 EMAIL_USER: iitianaarish@gmail.com
🔑 EMAIL_PASS configured: true
✅ Email sent successfully!
POST /api/pre-registration/send-otp → 200 OK
```

---

## 📚 Detailed Guides

- `CONFIGURE_EMAIL_NOW.md` - Step-by-step setup
- `GMAIL_APP_PASSWORD_SETUP.md` - Gmail configuration
- `OTP_SYSTEM_STATUS.md` - Full technical details

---

## 🔧 Common Issues

### "2-Step Verification required"
→ Enable at: https://myaccount.google.com/security

### "Invalid credentials"
→ Use App Password, not Gmail password

### Still showing warning
→ Save .env file and restart server

---

## 🎯 What Works Now

- ✅ Backend server running
- ✅ Database connected
- ✅ Frontend ready
- ✅ OTP generation
- ✅ OTP hashing (bcrypt)
- ✅ Gmail/Yahoo allowed in dev mode
- ✅ Rate limiting disabled for testing

## ❌ What Needs Fix

- ❌ Email sending (needs App Password)

---

## 📞 Need Help?

Check backend console for detailed error messages after updating .env and restarting.

---

**Time Required**: 5 minutes
**Difficulty**: Easy
**Impact**: Unblocks user registration

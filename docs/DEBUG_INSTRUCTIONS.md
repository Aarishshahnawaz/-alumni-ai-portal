# 🔍 Debug Instructions - Find Exact Error

## ✅ Step 1: Enhanced Error Logging Added

I've added comprehensive error logging to the `sendOTP` function in:
```
alumni-portal-backend/src/controllers/preRegistrationController.js
```

## 🚀 Step 2: Restart Backend Server

```bash
cd alumni-portal-backend

# Stop current server (Ctrl+C)

# Start server again
npm start
```

## 🧪 Step 3: Trigger OTP Request ONCE

### Option A: Using Frontend
```
1. Open: http://localhost:3000/register
2. Enter email: test@example.com
3. Select role: Student
4. Click "Send OTP" ONCE
```

### Option B: Using curl
```bash
curl -X POST http://localhost:5000/api/pre-registration/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"student"}'
```

## 📋 Step 4: Copy Backend Terminal Output

Look for this section in your backend terminal:

```
🔥 ========== SEND OTP CRASH ==========
🔥 Error name: ...
🔥 Error message: ...
🔥 Error code: ...
🔥 Full error object: ...
🔥 Error stack: ...
🔥 =====================================
```

OR if email sending fails:

```
🔥 ========== EMAIL SEND ERROR ==========
🔥 Error name: ...
🔥 Error message: ...
🔥 Error code: ...
🔥 Full error: ...
🔥 Error stack: ...
🔥 ========================================
```

## 📤 Step 5: Share the Output

Copy the ENTIRE error section (everything between the 🔥 lines) and share it.

---

## 🎯 What to Look For

The enhanced logging will show EXACTLY where it crashes:

1. **Email validation error** → Will show "EMAIL VALIDATION ERROR"
2. **User check error** → Will show "USER CHECK ERROR"
3. **Verification process error** → Will show "VERIFICATION PROCESS ERROR"
4. **Email send error** → Will show "EMAIL SEND ERROR"
5. **General crash** → Will show "SEND OTP CRASH"

---

## ⚠️ Important

- Do NOT modify anything else
- Run the test ONCE only
- Copy the FULL error output
- Include the error stack trace

---

## 🔍 Expected Output Format

You should see detailed logs like:

```
🔍 ========== SEND OTP REQUEST START ==========
📦 Incoming body: { "email": "test@example.com", "role": "student" }
📧 Email: test@example.com
👤 Role: student
✅ Basic validation passed
🔍 Validating institutional email...
📧 Email validation result: { valid: true, message: '...' }
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

[IF ERROR OCCURS HERE, YOU'LL SEE:]

🔥 ========== EMAIL SEND ERROR ==========
🔥 Error name: Error
🔥 Error message: [EXACT ERROR MESSAGE]
🔥 Error code: EAUTH (or other code)
🔥 Full error: [FULL ERROR OBJECT]
🔥 Error stack: [STACK TRACE]
🔥 ========================================
```

---

## 🚀 Ready to Debug!

1. Restart backend server
2. Trigger OTP request ONCE
3. Copy the error output
4. Share it with me

This will tell us EXACTLY what's failing! 🔍

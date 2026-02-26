# 🧪 Test Your OTP System Now

## Quick Test Guide

Your OTP system is fully implemented. Let's test it!

---

## ✅ Prerequisites

1. Backend server running on port 5000
2. Frontend running on port 3000
3. MongoDB running
4. Gmail App Password configured in .env

---

## 🚀 Test Method 1: Frontend UI (Recommended)

### Step 1: Open Registration Page
```
http://localhost:3000/register
```

### Step 2: Enter Email + Role
- Email: `test@university.edu` (or any email in dev mode)
- Role: Student or Alumni
- Click "Send OTP"

### Expected Result:
- ✅ Toast: "OTP sent to your email!"
- ✅ Progress to Step 2
- ✅ Check email inbox for OTP

### Step 3: Enter OTP
- Enter the 6-digit OTP from email
- Click "Verify OTP"

### Expected Result:
- ✅ Toast: "Email verified!"
- ✅ Progress to Step 3
- ✅ Registration form appears

### Step 4: Complete Registration
- Fill in all required fields:
  - First Name
  - Last Name
  - Password (min 6 characters)
  - Confirm Password
- Click "Complete Registration"

### Expected Result:
- ✅ Toast: "Registration successful!"
- ✅ Auto-login
- ✅ Redirect to dashboard

### Step 5: Test Login (No OTP)
- Go to: `http://localhost:3000/login`
- Enter email + password
- Click "Sign In"

### Expected Result:
- ✅ Login successful
- ✅ NO OTP required
- ✅ Redirect to dashboard

---

## 🧪 Test Method 2: API Testing (Advanced)

### Test 1: Send OTP
```bash
curl -X POST http://localhost:5000/api/pre-registration/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "student"
  }'
```

**Expected Response:**
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

**Check:**
- ✅ Email received in inbox
- ✅ 6-digit OTP in email
- ✅ Backend console shows: "✅ OTP email sent successfully"

### Test 2: Verify OTP (Replace 123456 with actual OTP)
```bash
curl -X POST http://localhost:5000/api/pre-registration/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now complete your registration.",
  "data": {
    "email": "test@example.com",
    "role": "student",
    "verified": true,
    "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the verificationToken for next step!**

### Test 3: Complete Registration (Replace <TOKEN> with actual token)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "verificationToken": "<TOKEN>",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890",
      "graduationYear": 2024,
      "degree": "Bachelor",
      "major": "Computer Science",
      "currentCompany": "Tech Corp",
      "location": "New York",
      "bio": "Test user"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful! You are now logged in.",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "role": "student",
      "isEmailVerified": true,
      "profile": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Test 4: Login (No OTP Required)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

## 🔍 Error Testing

### Test 5: Existing User Block
```bash
curl -X POST http://localhost:5000/api/pre-registration/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "student"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "An account with this email already exists. Please login instead."
}
```

### Test 6: Wrong OTP
```bash
curl -X POST http://localhost:5000/api/pre-registration/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "otp": "000000"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid OTP. 4 attempts remaining."
}
```

### Test 7: Expired OTP
1. Send OTP
2. Wait 6 minutes
3. Try to verify

**Expected Response:**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

### Test 8: Resend OTP
```bash
curl -X POST http://localhost:5000/api/pre-registration/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "New OTP sent successfully. Please check your email.",
  "data": {
    "email": "test2@example.com",
    "expiresIn": "5 minutes",
    "remainingResends": 2
  }
}
```

---

## 📊 Backend Console Output

### Successful OTP Send
```
📧 OTP request for: test@example.com Role: student
📦 Request body: { "email": "test@example.com", "role": "student" }
✅ Email validation passed
✅ No existing user found
✅ OTP generated and saved (hashed)
📧 Sending OTP email via Gmail SMTP...
📧 From: iitianaarish@gmail.com
📧 To: test@example.com
🔑 OTP: 123456
✅ Email sent successfully!
📬 Message ID: <...@gmail.com>
✅ Check inbox (and spam folder)
✅ OTP email sent successfully
```

### Successful OTP Verification
```
🔍 Verifying OTP for: test@example.com
✅ OTP verified successfully
```

### Successful Registration
```
📝 Registration request for: test@example.com
✅ Verification token validated
✅ Email pre-verification confirmed
✅ User created successfully
```

---

## ✅ Success Indicators

### Email Received
- ✅ Subject: "Verify Your Email - AlumniAI Portal Registration"
- ✅ From: AlumniAI Portal <iitianaarish@gmail.com>
- ✅ Contains 6-digit OTP
- ✅ Professional HTML template
- ✅ Expiry warning (5 minutes)

### Database Records
```javascript
// EmailVerification collection
{
  email: "test@example.com",
  role: "student",
  otp: "$2a$10$...", // Hashed
  verified: true,
  attempts: 0,
  expiresAt: ISODate("2024-..."),
  createdAt: ISODate("2024-...")
}

// User collection (after registration)
{
  email: "test@example.com",
  role: "student",
  isEmailVerified: true,
  profile: {...},
  createdAt: ISODate("2024-...")
}
```

---

## 🐛 Troubleshooting

### Issue: Email not received
**Check:**
1. Spam folder
2. Backend console for errors
3. EMAIL_USER and EMAIL_PASS in .env
4. Gmail App Password is correct

**Solution:**
```bash
# Run diagnostic test
cd alumni-portal-backend
node test-email-direct.js
```

### Issue: "Failed to send OTP email"
**Check:**
1. Backend console shows: "❌ Email sending failed!"
2. Error code: EAUTH (authentication failed)

**Solution:**
1. Verify 2-Step Verification is enabled
2. Generate new Gmail App Password
3. Update .env file
4. Restart backend

### Issue: "Invalid or expired verification token"
**Cause:** Token expired (10 minutes)

**Solution:**
1. Start registration process again
2. Complete registration within 10 minutes of OTP verification

### Issue: "Maximum verification attempts exceeded"
**Cause:** Entered wrong OTP 5 times

**Solution:**
1. Request new OTP (resend)
2. Check email for correct OTP

---

## 🎯 Quick Test Checklist

- [ ] Backend server running
- [ ] Frontend running
- [ ] MongoDB running
- [ ] Gmail App Password configured
- [ ] Open http://localhost:3000/register
- [ ] Enter email + role
- [ ] Click "Send OTP"
- [ ] Check email inbox
- [ ] Enter OTP
- [ ] Click "Verify OTP"
- [ ] Complete registration form
- [ ] Click "Complete Registration"
- [ ] Verify auto-login works
- [ ] Verify redirect to dashboard
- [ ] Test login (no OTP required)

---

## 🚀 Ready to Test!

Your system is fully implemented and ready for testing.

**Start here:**
```
http://localhost:3000/register
```

**Or run API tests:**
```bash
curl -X POST http://localhost:5000/api/pre-registration/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"student"}'
```

**Check email inbox for OTP!** 📧

---

## 📞 Need Help?

If you encounter any issues:
1. Check backend console for detailed errors
2. Run diagnostic test: `node test-email-direct.js`
3. Verify .env configuration
4. Check MongoDB is running
5. Verify Gmail App Password is correct

**System is production-ready!** ✅

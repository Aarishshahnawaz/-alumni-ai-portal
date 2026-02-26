# 🧪 Manual Testing Guide - OTP Registration System

## ✅ Prerequisites
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ MongoDB connected
- ✅ Nodemailer installed

## 🎯 Test the Complete Flow

### Step 1: Open Registration Page
1. Open your browser
2. Go to: **http://localhost:3000/register**
3. You should see a 3-step registration form

### Step 2: Enter Email and Role
1. **Email:** Enter any institutional email format
   - Example: `test.student@university.edu`
   - Example: `john.doe@college.ac.in`
   - ⚠️ Do NOT use Gmail, Yahoo, Outlook, etc.

2. **Role:** Select either:
   - 🎓 Student
   - 👔 Alumni

3. Click **"Send OTP"** button

### Step 3: Check for OTP
**Option A: Check Backend Console**
Look for this in your backend terminal:
```
📧 OTP request for: test.student@university.edu
✅ Email validation passed
✅ OTP generated and saved (hashed)
✅ OTP email sent
```

The OTP will be visible in the console logs (6-digit number).

**Option B: Check Email (if SMTP configured)**
If you configured real email in `.env`, check your inbox.

### Step 4: Enter OTP
1. You should now see the OTP input screen
2. Enter the 6-digit OTP from backend console
3. Click **"Verify OTP"**

**Expected Result:**
- ✅ Success message: "Email verified successfully!"
- ✅ Moves to Step 3 (Registration Form)

### Step 5: Complete Registration
1. Fill in the registration form:
   - **First Name:** John
   - **Last Name:** Doe
   - **Password:** password123
   - **Confirm Password:** password123
   - **Phone:** (optional)
   - **Graduation Year:** (optional)

2. Click **"Complete Registration"**

**Expected Result:**
- ✅ Success message: "Registration successful!"
- ✅ Automatically logged in
- ✅ Redirected to dashboard (student or alumni)
- ✅ Tokens stored in localStorage

### Step 6: Verify Auto-Login
1. Check if you're on the dashboard
2. Open browser DevTools (F12)
3. Go to Application → Local Storage
4. Verify these keys exist:
   - `token`
   - `refreshToken`

### Step 7: Test Normal Login (No OTP)
1. Logout from dashboard
2. Go to: **http://localhost:3000/login**
3. Enter:
   - **Email:** test.student@university.edu
   - **Password:** password123
4. Click **"Login"**

**Expected Result:**
- ✅ Login successful WITHOUT OTP
- ✅ Redirected to dashboard
- ✅ No OTP required for login

## 🧪 Additional Test Cases

### Test Case 1: Public Email Rejection
1. Go to registration page
2. Enter: `test@gmail.com`
3. Click "Send OTP"

**Expected:** ❌ Error: "Public email domains are not allowed"

### Test Case 2: Invalid OTP
1. Send OTP
2. Enter wrong OTP: `000000`
3. Click "Verify OTP"

**Expected:** ❌ Error: "Invalid OTP. X attempts remaining."

### Test Case 3: OTP Expiry
1. Send OTP
2. Wait 6 minutes
3. Try to verify OTP

**Expected:** ❌ Error: "OTP has expired. Please request a new OTP."

### Test Case 4: Resend OTP
1. Send OTP
2. Click "Resend OTP" button
3. Check backend console for new OTP

**Expected:** ✅ New OTP generated and sent

### Test Case 5: Max Attempts
1. Send OTP
2. Enter wrong OTP 5 times

**Expected:** ❌ Error: "Maximum verification attempts exceeded"

### Test Case 6: Token Expiry
1. Complete OTP verification
2. Wait 11 minutes (token expires in 10 min)
3. Try to complete registration

**Expected:** ❌ Error: "Invalid or expired verification token"

## 🔍 Debugging Tips

### Check Backend Logs
Your backend console should show:
```
📧 OTP request for: email
✅ Email validation passed
✅ OTP generated and saved (hashed)
✅ OTP email sent
🔍 Verifying OTP for: email
✅ OTP verified successfully
📝 Registration request for: email
✅ Verification token validated
✅ Email pre-verification confirmed
✅ User created successfully
```

### Check MongoDB
Open MongoDB Compass and connect to: `mongodb://localhost:27017/alumniai`

**EmailVerification Collection:**
```javascript
{
  email: "test.student@university.edu",
  role: "student",
  otp: "$2a$10$...", // Hashed
  verified: true,
  attempts: 0,
  expiresAt: ISODate("...")
}
```

**Users Collection (after registration):**
```javascript
{
  email: "test.student@university.edu",
  role: "student",
  isEmailVerified: true,
  profile: {
    firstName: "John",
    lastName: "Doe",
    ...
  }
}
```

### Check Network Tab
Open DevTools → Network tab and watch for:

1. **POST /api/pre-registration/send-otp**
   - Status: 200
   - Response: `{ success: true, message: "OTP sent..." }`

2. **POST /api/pre-registration/verify-otp**
   - Status: 200
   - Response: `{ success: true, data: { verificationToken: "..." } }`

3. **POST /api/auth/register**
   - Status: 201
   - Response: `{ success: true, data: { user, token, refreshToken } }`

## ✅ Success Criteria

- ✅ Can send OTP to institutional email
- ✅ Public emails are rejected
- ✅ OTP verification works
- ✅ Invalid OTP shows error
- ✅ Registration completes after OTP verification
- ✅ User is automatically logged in
- ✅ Tokens are stored in localStorage
- ✅ Normal login works without OTP
- ✅ User cannot register without OTP verification

## 🎉 Expected Final Result

After completing all steps:
1. ✅ User registered successfully
2. ✅ Email verified via OTP
3. ✅ Automatically logged in
4. ✅ On dashboard page
5. ✅ Can logout and login normally (no OTP)
6. ✅ Profile shows verified email

## 📞 If Something Goes Wrong

### Backend Not Responding
```bash
cd alumni-portal-backend
npm start
```

### Frontend Not Loading
```bash
cd alumni-portal-frontend
npm start
```

### MongoDB Not Connected
```bash
# Start MongoDB service
# Windows: Check Services
# Mac/Linux: sudo systemctl start mongodb
```

### Check Ports
- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000
- MongoDB: mongodb://localhost:27017

## 🚀 Ready to Test!

Open http://localhost:3000/register and start testing!

The system is fully implemented and ready for production use.

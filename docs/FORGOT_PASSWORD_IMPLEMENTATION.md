# Forgot Password System with OTP Email Verification

## Complete Implementation Guide

---

## Overview

Implemented a secure forgot password system with OTP (One-Time Password) email verification. Users can reset their password by receiving a 6-digit OTP via email.

---

## Features

✅ Email-based OTP verification
✅ 10-minute OTP expiration
✅ Maximum 3 OTP attempts
✅ Resend OTP functionality
✅ Password strength indicator
✅ Beautiful email templates
✅ Activity logging
✅ Security best practices

---

## Flow Diagram

```
User Flow:
1. Forgot Password Page → Enter Email → Send OTP
2. Verify OTP Page → Enter 6-digit OTP → Verify
3. Reset Password Page → Enter New Password → Reset
4. Login Page → Login with new password
```

---

## Backend Implementation

### 1. User Model Updates

**File**: `alumni-portal-backend/src/models/User.js`

Added fields:
```javascript
resetOTP: {
  type: String,
  select: false
},
resetOTPExpiry: {
  type: Date,
  select: false
},
resetOTPAttempts: {
  type: Number,
  default: 0,
  select: false
}
```

### 2. Email Service

**File**: `alumni-portal-backend/src/services/emailService.js`

Features:
- NodeMailer integration
- Beautiful HTML email templates
- Support for Gmail, SMTP, and Ethereal (testing)
- OTP email with expiration warning
- Password reset success email

Functions:
- `sendOTPEmail(email, otp, firstName)` - Send OTP to user
- `sendPasswordResetSuccessEmail(email, firstName)` - Confirmation email

### 3. Auth Controllers

**File**: `alumni-portal-backend/src/controllers/authController.js`

Added three new endpoints:

#### A. Forgot Password
```javascript
POST /api/auth/forgot-password
Body: { email: string }
```

Process:
1. Validate email exists
2. Generate 6-digit OTP
3. Set 10-minute expiration
4. Save OTP to database
5. Send email with OTP
6. Return success message

#### B. Verify OTP
```javascript
POST /api/auth/verify-otp
Body: { email: string, otp: string }
```

Process:
1. Check if OTP exists
2. Verify not expired
3. Check attempts (max 3)
4. Validate OTP matches
5. Return verification status

#### C. Reset Password
```javascript
POST /api/auth/reset-password
Body: { email: string, otp: string, newPassword: string }
```

Process:
1. Verify OTP again
2. Hash new password (bcrypt)
3. Clear OTP fields
4. Logout from all devices
5. Send success email
6. Log activity

### 4. Routes

**File**: `alumni-portal-backend/src/routes/authRoutes.js`

Added routes:
```javascript
router.post('/forgot-password', logAuthActivity('forgot_password'), forgotPassword);
router.post('/verify-otp', logAuthActivity('verify_otp'), verifyOTP);
router.post('/reset-password', logAuthActivity('reset_password'), resetPassword);
```

---

## Frontend Implementation

### 1. Forgot Password Page

**File**: `alumni-portal-frontend/src/pages/auth/ForgotPasswordPage.js`

Features:
- Email input with validation
- Send OTP button
- Loading state
- Error handling
- Redirect to verify OTP page

### 2. Verify OTP Page

**File**: `alumni-portal-frontend/src/pages/auth/VerifyOTPPage.js`

Features:
- 6-digit OTP input boxes
- Auto-focus next input
- Paste support (6-digit codes)
- 10-minute countdown timer
- Resend OTP (after 1 minute)
- Maximum 3 attempts
- Auto-redirect on success

### 3. Reset Password Page

**File**: `alumni-portal-frontend/src/pages/auth/ResetPasswordPage.js`

Features:
- New password input
- Confirm password input
- Password visibility toggles
- Password strength indicator (Weak/Fair/Good/Strong/Very Strong)
- Real-time validation
- Success redirect to login

### 4. Routes

**File**: `alumni-portal-frontend/src/App.js`

Added routes:
```javascript
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/verify-otp" element={<VerifyOTPPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

### 5. Login Page Update

**File**: `alumni-portal-frontend/src/pages/auth/LoginPage.js`

Added "Forgot your password?" link pointing to `/forgot-password`

---

## Email Configuration

### Environment Variables

**File**: `alumni-portal-backend/.env`

```env
# Production (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Development (Ethereal - fake SMTP for testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test@ethereal.email
SMTP_PASS=test
```

### Gmail Setup (Production)

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use generated password in `EMAIL_PASS`

### Ethereal Setup (Development)

1. Visit https://ethereal.email/
2. Create account (or use test credentials)
3. Use provided SMTP credentials
4. View sent emails in Ethereal inbox

---

## Security Features

### 1. OTP Security
- 6-digit random OTP
- 10-minute expiration
- Maximum 3 attempts
- Cleared after successful reset
- Not exposed in API responses

### 2. Password Security
- Minimum 6 characters
- Bcrypt hashing (12 rounds)
- Password strength indicator
- Confirmation required

### 3. Session Security
- All refresh tokens cleared on reset
- User logged out from all devices
- Activity logging for audit trail

### 4. Rate Limiting
- Prevent brute force attacks
- Limit OTP requests per email
- Resend OTP cooldown (1 minute)

---

## Testing Guide

### 1. Install Dependencies

```bash
cd alumni-portal-backend
npm install nodemailer
```

### 2. Configure Email

**Option A: Development (Ethereal)**
```env
# No configuration needed - uses default ethereal
NODE_ENV=development
```

**Option B: Production (Gmail)**
```env
NODE_ENV=production
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Start Services

```bash
# Backend
cd alumni-portal-backend
npm start

# Frontend (new terminal)
cd alumni-portal-frontend
npm start
```

### 4. Test Flow

#### Step 1: Forgot Password
1. Navigate to `http://localhost:3000/login`
2. Click "Forgot your password?"
3. Enter registered email
4. Click "Send OTP"
5. Check email inbox (or Ethereal inbox for dev)

#### Step 2: Verify OTP
1. Enter 6-digit OTP from email
2. OTP auto-fills if pasted
3. Click "Verify OTP"
4. Or click "Resend OTP" if needed

#### Step 3: Reset Password
1. Enter new password (min 6 chars)
2. Confirm new password
3. Check password strength indicator
4. Click "Reset Password"
5. Redirected to login page

#### Step 4: Login
1. Login with new password
2. Success!

---

## API Endpoints

### 1. Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP has been sent to your email address. Please check your inbox.",
  "data": {
    "email": "user@example.com",
    "expiresIn": "10 minutes"
  }
}
```

### 2. Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "data": {
    "email": "user@example.com",
    "verified": true
  }
}
```

### 3. Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

---

## Error Handling

### Common Errors

#### 1. Email Not Found
```json
{
  "success": true,
  "message": "If the email exists, an OTP has been sent to it."
}
```
Note: Returns success even if email doesn't exist (security best practice)

#### 2. OTP Expired
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one."
}
```

#### 3. Invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP. 2 attempts remaining."
}
```

#### 4. Max Attempts Exceeded
```json
{
  "success": false,
  "message": "Maximum OTP attempts exceeded. Please request a new OTP."
}
```

#### 5. Password Too Short
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

---

## Email Templates

### OTP Email

Subject: `Password Reset OTP - AlumniAI Portal`

Features:
- Professional design
- Large OTP display
- Expiration warning
- Security tips
- Responsive layout

### Success Email

Subject: `Password Reset Successful - AlumniAI Portal`

Features:
- Success confirmation
- Security reminder
- Contact support link
- Professional branding

---

## Database Changes

### User Collection

New fields added:
```javascript
{
  resetOTP: "123456",              // 6-digit OTP
  resetOTPExpiry: ISODate("..."),  // Expiration timestamp
  resetOTPAttempts: 0              // Attempt counter
}
```

These fields are:
- Not selected by default (`select: false`)
- Cleared after successful reset
- Cleared after expiration
- Cleared after max attempts

---

## Activity Logging

All password reset actions are logged:

```javascript
{
  userId: ObjectId("..."),
  action: "forgot_password" | "verify_otp" | "reset_password",
  resourceType: "user_security",
  details: {
    method: "otp",
    timestamp: ISODate("...")
  }
}
```

---

## Files Created/Modified

### Backend

**Created**:
- `src/services/emailService.js` - Email service with NodeMailer

**Modified**:
- `src/models/User.js` - Added OTP fields
- `src/controllers/authController.js` - Added 3 new controllers
- `src/routes/authRoutes.js` - Added 3 new routes
- `.env.example` - Added email configuration
- `package.json` - Added nodemailer dependency

### Frontend

**Created**:
- `src/pages/auth/ForgotPasswordPage.js` - Forgot password page
- `src/pages/auth/VerifyOTPPage.js` - OTP verification page
- `src/pages/auth/ResetPasswordPage.js` - Reset password page

**Modified**:
- `src/App.js` - Added 3 new routes
- `src/pages/auth/LoginPage.js` - Added forgot password link

---

## Best Practices Implemented

### Security
✅ OTP expires in 10 minutes
✅ Maximum 3 verification attempts
✅ OTP not exposed in API responses
✅ Password hashed with bcrypt
✅ All sessions cleared on reset
✅ Activity logging for audit trail

### User Experience
✅ Clear error messages
✅ Loading states
✅ Auto-focus inputs
✅ Paste support for OTP
✅ Countdown timer
✅ Resend OTP functionality
✅ Password strength indicator
✅ Success confirmations

### Code Quality
✅ Modular architecture
✅ Reusable email service
✅ Proper error handling
✅ Comprehensive logging
✅ Clean code structure
✅ No code duplication

---

## Troubleshooting

### Issue: Email not sending

**Solution**:
1. Check email credentials in `.env`
2. For Gmail, use App Password (not regular password)
3. Check console logs for error messages
4. For development, use Ethereal and check preview URL in logs

### Issue: OTP expired immediately

**Solution**:
1. Check server time is correct
2. Verify `resetOTPExpiry` is set to future time
3. Check timezone settings

### Issue: OTP not matching

**Solution**:
1. Ensure OTP is exactly 6 digits
2. Check for leading/trailing spaces
3. Verify OTP hasn't expired
4. Check attempts counter

### Issue: Password not updating

**Solution**:
1. Verify OTP is valid
2. Check password meets minimum requirements
3. Ensure bcrypt middleware is working
4. Check database connection

---

## Future Enhancements

Potential improvements:
1. SMS OTP as alternative
2. Configurable OTP length
3. Configurable expiration time
4. Rate limiting per IP
5. CAPTCHA integration
6. Multi-language email templates
7. Email verification on registration
8. Password history (prevent reuse)
9. Account lockout after failed attempts
10. Admin panel for OTP management

---

## Conclusion

✅ Complete forgot password system implemented
✅ Secure OTP-based verification
✅ Professional email templates
✅ Excellent user experience
✅ Production-ready code
✅ Comprehensive documentation

The system is fully functional and ready for production use!

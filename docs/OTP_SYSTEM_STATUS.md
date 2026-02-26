# 🔴 OTP System Status Report

## Current Issue: 500 Internal Server Error

### Root Cause
Gmail App Password is not configured in `.env` file, causing authentication failure when trying to send OTP emails.

---

## 📊 System Status

### ✅ What's Working
- Backend server running on port 5000
- Database connected (MongoDB)
- Frontend running on port 3000
- OTP generation logic (6-digit random OTP)
- OTP hashing with bcrypt
- Email verification model with TTL index
- Attempt tracking (max 5 attempts)
- Resend limits (max 3 per hour)
- Temporary verification token (JWT, 10 min expiry)
- Gmail/Yahoo allowed in development mode
- Rate limiting temporarily disabled for debugging
- Email validator allows all domains in dev mode

### ❌ What's NOT Working
- Email sending (Gmail authentication fails)
- OTP delivery to users
- Registration completion (blocked by OTP step)

### ⚠️ Configuration Issue
```env
# Current .env configuration (line 29)
EMAIL_USER=iitianaarish@gmail.com  ✅ CORRECT
EMAIL_PASS=PASTE_YOUR_16_DIGIT_APP_PASSWORD_HERE  ❌ PLACEHOLDER
```

---

## 🔧 Technical Details

### Backend Error Flow
1. User submits email + role on registration page
2. Frontend calls: `POST /api/pre-registration/send-otp`
3. Backend validates email and generates OTP
4. Backend attempts to send email via Gmail SMTP
5. **Gmail authentication fails** (EAUTH error)
6. Backend catches error and returns 500 status
7. Frontend shows error to user

### Console Output
```
🔍 Environment Variables Check:
📧 EMAIL_USER: iitianaarish@gmail.com
🔑 EMAIL_PASS configured: true  ← But it's a placeholder!

⚠️ WARNING: EMAIL_USER not configured!
⚠️ Update .env file with real Gmail credentials
⚠️ OTP emails will FAIL until configured
```

### Error in sendEmail.js
```javascript
// When EMAIL_PASS is wrong or placeholder
if (error.code === 'EAUTH') {
  console.error('🔴 GMAIL AUTHENTICATION FAILED!');
  throw new Error('Gmail authentication failed. Check EMAIL_USER and EMAIL_PASS in .env');
}
```

---

## 🎯 Solution

### Required Action
Generate Gmail App Password and update `.env` file.

### Step-by-Step Fix
1. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: Mail
   - Select device: Other (Custom name) → "AlumniAI Portal"
   - Click Generate
   - Copy 16-digit password (example: `abcd efgh ijkl mnop`)

3. **Update .env File**
   - Open: `alumni-portal-backend/.env`
   - Find line 29: `EMAIL_PASS=PASTE_YOUR_16_DIGIT_APP_PASSWORD_HERE`
   - Replace with: `EMAIL_PASS=abcdefghijklmnop` (no spaces)
   - Save file

4. **Restart Backend**
   ```bash
   cd alumni-portal-backend
   # Press Ctrl+C to stop
   npm start
   ```

5. **Verify Configuration**
   - Console should show: `🔑 EMAIL_PASS configured: true`
   - No warning messages

6. **Test Email Sending**
   ```bash
   curl http://localhost:5000/api/test/test-email
   ```
   - Should return: `{"success": true, "message": "Test email sent successfully"}`
   - Check inbox for test email

7. **Test OTP Registration**
   - Go to: http://localhost:3000/register
   - Enter email: `test@example.com`
   - Select role: Student or Alumni
   - Click "Send OTP"
   - Check email inbox (and spam folder)
   - Enter OTP and complete registration

---

## 📁 Key Files

### Configuration
- `alumni-portal-backend/.env` - Environment variables (line 29 needs update)

### Email Sending
- `alumni-portal-backend/src/utils/sendEmail.js` - Gmail SMTP transporter
- `alumni-portal-backend/src/utils/emailValidator.js` - Email validation (allows Gmail/Yahoo in dev)

### OTP Logic
- `alumni-portal-backend/src/controllers/preRegistrationController.js` - Send/verify/resend OTP
- `alumni-portal-backend/src/models/EmailVerification.js` - OTP storage with bcrypt hashing
- `alumni-portal-backend/src/utils/verificationToken.js` - JWT token generation

### Routes
- `alumni-portal-backend/src/routes/preRegistrationRoutes.js` - OTP endpoints
- `alumni-portal-backend/src/routes/testRoutes.js` - Test email endpoint

### Frontend
- `alumni-portal-frontend/src/pages/auth/MultiStepRegisterPage.js` - 3-step registration UI

### Server
- `alumni-portal-backend/src/app.js` - Main server (rate limiting temporarily disabled)

---

## 🔒 Security Features

### Already Implemented
- ✅ OTP hashed with bcrypt (not stored in plain text)
- ✅ 5-minute OTP expiry
- ✅ Max 5 verification attempts per OTP
- ✅ Max 3 resends per hour
- ✅ Temporary verification token (10 min expiry)
- ✅ Email verification before user creation
- ✅ No OTP required for login (only registration)
- ✅ TTL index for automatic cleanup of expired OTPs
- ✅ Institutional email validation (disabled in dev mode)
- ✅ Rate limiting (temporarily disabled for debugging)

### Production Considerations
- Re-enable rate limiting after testing
- Block public email domains (Gmail/Yahoo) in production
- Enable MX record verification in production
- Use environment-specific CORS origins
- Monitor failed authentication attempts
- Set up email delivery monitoring

---

## 🧪 Testing Checklist

### After Configuration
- [ ] Backend starts without warnings
- [ ] Test email endpoint returns success
- [ ] Test email received in inbox
- [ ] OTP registration sends email
- [ ] OTP verification works
- [ ] Invalid OTP shows error
- [ ] Expired OTP shows error
- [ ] Max attempts limit works
- [ ] Resend OTP works
- [ ] Resend limit works
- [ ] Registration completes after OTP verification
- [ ] Login works without OTP

---

## 📞 Support Resources

### Documentation
- `CONFIGURE_EMAIL_NOW.md` - Quick setup guide
- `GMAIL_APP_PASSWORD_SETUP.md` - Detailed Gmail setup
- `ACTIVITY_LOGS_FEATURE_SUMMARY.md` - Previous features summary

### Google Resources
- 2-Step Verification: https://myaccount.google.com/security
- App Passwords: https://myaccount.google.com/apppasswords
- Gmail SMTP Settings: https://support.google.com/mail/answer/7126229

### Common Errors
1. **EAUTH** - Wrong credentials or 2-Step Verification not enabled
2. **ECONNREFUSED** - SMTP server unreachable (check firewall)
3. **ETIMEDOUT** - Network timeout (check internet connection)
4. **Invalid credentials** - Using normal password instead of App Password

---

## 🚀 Next Steps

### Immediate (Required)
1. Generate Gmail App Password
2. Update `.env` file
3. Restart backend server
4. Test email sending
5. Test OTP registration flow

### After Testing (Recommended)
1. Re-enable rate limiting in `app.js` (lines 153-154)
2. Test rate limiting works correctly
3. Document any additional issues
4. Consider adding email delivery monitoring
5. Set up production email service (SendGrid, AWS SES, etc.)

---

## 📈 System Architecture

### OTP Registration Flow
```
1. User enters email + role
   ↓
2. Frontend: POST /api/pre-registration/send-otp
   ↓
3. Backend: Validate email (allows all in dev mode)
   ↓
4. Backend: Check if user already exists
   ↓
5. Backend: Generate 6-digit OTP
   ↓
6. Backend: Hash OTP with bcrypt
   ↓
7. Backend: Save to EmailVerification collection
   ↓
8. Backend: Send OTP via Gmail SMTP ← FAILS HERE (needs App Password)
   ↓
9. User receives email with OTP
   ↓
10. User enters OTP
   ↓
11. Frontend: POST /api/pre-registration/verify-otp
   ↓
12. Backend: Verify OTP with bcrypt.compare()
   ↓
13. Backend: Generate verification token (JWT, 10 min)
   ↓
14. Frontend: Show registration form
   ↓
15. User completes registration
   ↓
16. Frontend: POST /api/auth/register (with verification token)
   ↓
17. Backend: Verify token, create user
   ↓
18. User can login (no OTP required)
```

---

## 💡 Key Insights

### Why App Password?
- Google deprecated "Less Secure Apps" in 2022
- App Passwords are the current standard
- More secure than using main Gmail password
- Can be revoked without changing main password

### Why Not Working?
- `.env` file has placeholder value
- System detects this and shows warning
- Gmail SMTP authentication fails
- 500 error returned to frontend

### Why Gmail/Yahoo Allowed in Dev?
- For testing purposes
- Production will block public domains
- Allows developers to test with personal emails
- MX record verification disabled in dev mode

---

## 🎯 Success Criteria

System is working when:
- ✅ No warnings in backend console
- ✅ Test email endpoint returns success
- ✅ Test email received in inbox
- ✅ OTP registration sends real email
- ✅ OTP verification works correctly
- ✅ Registration completes successfully
- ✅ Login works without OTP

---

**Status**: ⏸️ Waiting for Gmail App Password configuration

**Estimated Fix Time**: 5 minutes

**Blocking**: User registration (login still works for existing users)

**Priority**: 🔴 HIGH - Blocks new user registration

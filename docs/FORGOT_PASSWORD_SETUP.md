# Forgot Password System - Quick Setup Guide

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd alumni-portal-backend
npm install
```

This will install `nodemailer` which was added to package.json.

---

### 2. Configure Email Service

#### Option A: Development/Testing (Ethereal - Fake SMTP)

No configuration needed! The system will automatically use Ethereal for testing.

**To view sent emails**:
1. Check backend console logs after sending OTP
2. Look for: `Preview URL: https://ethereal.email/message/...`
3. Click the URL to view the email in browser

#### Option B: Production (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update `.env` file**:

```env
NODE_ENV=production
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

#### Option C: Other SMTP Services

For SendGrid, Mailgun, or custom SMTP:

```env
NODE_ENV=production
SMTP_HOST=smtp.your-service.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
EMAIL_USER=noreply@yourdomain.com
```

---

### 3. Start the Application

```bash
# Terminal 1: Backend
cd alumni-portal-backend
npm start

# Terminal 2: Frontend
cd alumni-portal-frontend
npm start
```

---

## Testing the System

### Test User Flow

1. **Navigate to Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Click "Forgot your password?"**

3. **Enter Email**
   - Use a registered user email
   - Click "Send OTP"

4. **Check Email**
   - **Development**: Check console logs for Ethereal preview URL
   - **Production**: Check your Gmail inbox

5. **Enter OTP**
   - Copy 6-digit OTP from email
   - Paste or type in OTP boxes
   - Click "Verify OTP"

6. **Reset Password**
   - Enter new password (min 6 characters)
   - Confirm password
   - Click "Reset Password"

7. **Login**
   - Use new password to login
   - Success!

---

## Quick Test Commands

### Create Test User (if needed)

```bash
# Using MongoDB shell
mongosh alumniai

db.users.insertOne({
  email: "test@example.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHaSuu", // "password123"
  role: "student",
  profile: {
    firstName: "Test",
    lastName: "User",
    graduationYear: 2024,
    major: "Computer Science"
  },
  isActive: true,
  createdAt: new Date()
})
```

### Test API Endpoints

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Verify OTP (replace 123456 with actual OTP)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# 3. Reset Password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"newpass123"}'
```

---

## Verification Checklist

### Backend
- [ ] `nodemailer` installed
- [ ] Email service configured in `.env`
- [ ] Backend server running on port 5000
- [ ] MongoDB connected
- [ ] No errors in console

### Frontend
- [ ] Frontend running on port 3000
- [ ] Can access `/forgot-password` route
- [ ] Can access `/verify-otp` route
- [ ] Can access `/reset-password` route
- [ ] No errors in browser console

### Email
- [ ] OTP email received (or preview URL in console)
- [ ] Email template displays correctly
- [ ] OTP is 6 digits
- [ ] Expiration time shown (10 minutes)

### Functionality
- [ ] Can send OTP
- [ ] Can verify OTP
- [ ] Can reset password
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] OTP expires after 10 minutes
- [ ] Max 3 OTP attempts enforced
- [ ] Can resend OTP

---

## Common Issues & Solutions

### Issue: "Failed to send OTP email"

**Cause**: Email service not configured or credentials invalid

**Solution**:
1. For development: No action needed, uses Ethereal
2. For Gmail: Check App Password is correct (16 characters, no spaces)
3. Check `.env` file has correct EMAIL_USER and EMAIL_PASS
4. Restart backend server after changing `.env`

### Issue: "OTP has expired"

**Cause**: More than 10 minutes passed since OTP was sent

**Solution**:
1. Click "Resend OTP" button
2. Enter new OTP within 10 minutes

### Issue: "Invalid OTP"

**Cause**: Wrong OTP entered or OTP already used

**Solution**:
1. Check email for correct OTP
2. Ensure no spaces before/after OTP
3. Request new OTP if needed

### Issue: "Maximum OTP attempts exceeded"

**Cause**: Entered wrong OTP 3 times

**Solution**:
1. Click "Resend OTP" to get new OTP
2. Attempts counter resets with new OTP

### Issue: Email not received (Gmail)

**Cause**: Email in spam or App Password not set up

**Solution**:
1. Check spam/junk folder
2. Verify 2FA is enabled on Gmail
3. Generate new App Password
4. Use App Password (not regular password)

### Issue: "User not found"

**Cause**: Email not registered in system

**Solution**:
1. Register account first
2. Use correct email address
3. Check database for user

---

## Environment Variables Reference

```env
# Required for Production
NODE_ENV=production
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional (Development)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test@ethereal.email
SMTP_PASS=test
```

---

## Security Notes

### OTP Security
- OTP is 6 digits (100,000 - 999,999)
- Expires in 10 minutes
- Maximum 3 verification attempts
- Cleared after successful reset
- Not exposed in API responses

### Password Security
- Minimum 6 characters required
- Hashed with bcrypt (12 rounds)
- All sessions cleared on reset
- Activity logged for audit

### Email Security
- Use App Passwords (not regular passwords)
- Enable 2FA on email account
- Use environment variables (never commit credentials)
- Use HTTPS in production

---

## Next Steps

After successful setup:

1. **Test thoroughly** with different scenarios
2. **Configure production email** service
3. **Set up monitoring** for email delivery
4. **Add rate limiting** for forgot password endpoint
5. **Consider adding CAPTCHA** to prevent abuse
6. **Set up email templates** with your branding
7. **Configure email analytics** (optional)

---

## Support

If you encounter issues:

1. Check console logs (backend and frontend)
2. Verify email configuration
3. Test with Ethereal first (development)
4. Check MongoDB for user data
5. Review error messages carefully

---

## Success Indicators

You'll know it's working when:

✅ OTP email arrives within seconds
✅ OTP verification succeeds
✅ Password reset completes
✅ Can login with new password
✅ Success email received
✅ Activity logged in database

---

## Production Deployment

Before deploying to production:

1. **Use real email service** (Gmail, SendGrid, etc.)
2. **Set NODE_ENV=production**
3. **Use strong email passwords**
4. **Enable HTTPS**
5. **Set up email monitoring**
6. **Configure rate limiting**
7. **Test email deliverability**
8. **Set up error alerting**

---

## Congratulations! 🎉

Your forgot password system is now ready to use!

Users can now securely reset their passwords using OTP email verification.

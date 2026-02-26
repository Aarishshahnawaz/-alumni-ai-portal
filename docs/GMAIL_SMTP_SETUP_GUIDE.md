# Gmail SMTP Setup Guide - Send Real OTP Emails

## 🎯 Current Status

Right now, OTP is being logged to console only. To send REAL emails to inbox, follow this guide.

## 📧 Step-by-Step Gmail Configuration

### Step 1: Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Click "Get Started"
4. Follow the prompts to enable it
5. ✅ Verify it's enabled (should show "On")

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App Passwords
2. Click "Select app" → Choose "Mail"
3. Click "Select device" → Choose "Other (Custom name)"
4. Enter: "AlumniAI Portal"
5. Click "Generate"
6. **COPY the 16-digit password** (looks like: `abcd efgh ijkl mnop`)
7. ⚠️ Save it somewhere - you won't see it again!

### Step 3: Update .env File

Open: `alumni-portal-backend/.env`

Update these lines:
```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Example:**
```env
EMAIL_USER=iitianaarish@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

⚠️ **Important:**
- Remove spaces from app password: `abcdefghijklmnop`
- Use your REAL Gmail address
- Use App Password, NOT your normal Gmail password

### Step 4: Restart Backend

Stop and restart the backend server:
```bash
# Press Ctrl+C to stop
# Then run:
npm start
```

### Step 5: Test Email Configuration

Open browser and go to:
```
http://localhost:5000/api/test/test-email
```

Or test with specific email:
```
http://localhost:5000/api/test/test-email?to=test@gmail.com
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox.",
  "details": {
    "from": "your-email@gmail.com",
    "to": "test@gmail.com",
    "messageId": "...",
    "timestamp": "..."
  }
}
```

### Step 6: Test OTP Registration

1. Go to: http://localhost:3000/register
2. Enter email: `test@gmail.com`
3. Select role: Student
4. Click "Send OTP"
5. **Check your email inbox** (and spam folder)
6. You should receive OTP email!

## 🔍 Troubleshooting

### Error: "Gmail authentication failed"

**Possible Reasons:**
1. Wrong EMAIL_USER or EMAIL_PASS in .env
2. Using normal password instead of App Password
3. 2-Step Verification not enabled
4. App Password not generated correctly
5. Spaces in app password (remove them)

**Solution:**
- Double-check EMAIL_USER is correct
- Regenerate App Password
- Remove all spaces from password
- Restart backend after updating .env

### Error: "Cannot connect to Gmail SMTP"

**Possible Reasons:**
1. No internet connection
2. Firewall blocking port 587
3. Antivirus blocking SMTP

**Solution:**
- Check internet connection
- Temporarily disable firewall/antivirus
- Try different network

### Email Goes to Spam

**Solution:**
- Check spam folder
- Mark as "Not Spam"
- Add sender to contacts
- This is normal for new senders

### Email Not Received

**Check:**
1. Correct email address entered
2. Check spam folder
3. Check backend console for errors
4. Verify EMAIL_USER and EMAIL_PASS are correct
5. Test with `/api/test/test-email` endpoint first

## 📊 What Happens After Configuration

### Before (Development Mode):
```
📧 [DEV MODE] OTP Email would be sent to: test@gmail.com
🔑 [DEV MODE] OTP: 123456
⚠️  Configure EMAIL_USER and EMAIL_PASS in .env for production
```

### After (Gmail Configured):
```
📧 Using Gmail SMTP with: your-email@gmail.com
📧 Attempting to send OTP email to: test@gmail.com
📧 Sending real email via Gmail SMTP...
✅ Registration OTP email sent successfully via Gmail!
📧 Email sent to: test@gmail.com
📬 Message ID: <...@gmail.com>
✅ Check inbox (and spam folder) for OTP
```

## 🎯 Quick Test Checklist

- [ ] 2-Step Verification enabled in Gmail
- [ ] App Password generated (16 digits)
- [ ] .env file updated with EMAIL_USER
- [ ] .env file updated with EMAIL_PASS (no spaces)
- [ ] Backend restarted
- [ ] Test endpoint works: `/api/test/test-email`
- [ ] Test email received in inbox
- [ ] OTP registration sends real email
- [ ] OTP received in inbox

## 💡 Pro Tips

1. **Use a dedicated Gmail account** for sending emails (not your personal one)
2. **Keep App Password secure** - don't commit to Git
3. **Check spam folder** first time you send emails
4. **Test with test endpoint** before trying full registration
5. **Restart backend** after any .env changes

## 🔐 Security Notes

- App Password is safer than normal password
- App Password can be revoked anytime
- Each app should have its own App Password
- Never share or commit App Password to Git
- .env file is in .gitignore (safe)

## 📝 Example .env Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/alumniai

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Email Configuration (UPDATE THESE!)
EMAIL_USER=iitianaarish@gmail.com
EMAIL_PASS=abcdefghijklmnop

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Ready to Send Real Emails!

Once configured:
1. Users will receive OTP in their email inbox
2. No need to check backend console
3. Professional email template
4. Works with any email provider (Gmail, Yahoo, etc.)
5. Production-ready!

**Test it now with the test endpoint!** 🎉

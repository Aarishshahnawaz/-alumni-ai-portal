# 🔍 Debug Email Configuration

## Current Issue
Getting error: "Failed to send OTP email. Please check your email configuration"

---

## 🚀 Run Diagnostic Test

I've created a test script to diagnose the exact issue.

### Step 1: Run Test Script
```bash
cd alumni-portal-backend
node test-email-direct.js
```

This will:
- ✅ Show your EMAIL_USER and EMAIL_PASS status
- ✅ Attempt to send a test email
- ✅ Show detailed error messages if it fails
- ✅ Provide specific solutions based on error type

### Step 2: Check Output

#### If Successful ✅
```
✅ SUCCESS! Email sent successfully!
📬 Message ID: <...@gmail.com>
🎉 Check your inbox: iitianaarish@gmail.com
```

**Action**: Check your inbox! If email received, OTP system will work.

#### If Authentication Failed ❌
```
❌ FAILED! Email sending failed!
🔴 Error Code: EAUTH
🔴 AUTHENTICATION FAILED!
```

**Possible Reasons**:
1. Wrong App Password (typo or spaces)
2. 2-Step Verification not enabled
3. App Password revoked/expired
4. Wrong Gmail account

**Solutions**:
1. Verify 2-Step Verification is ON: https://myaccount.google.com/security
2. Generate NEW App Password: https://myaccount.google.com/apppasswords
3. Copy password carefully (remove ALL spaces)
4. Update `.env` file line 29
5. Run test again

#### If Connection Failed ❌
```
❌ FAILED! Email sending failed!
🔴 Error Code: ECONNECTION or ETIMEDOUT
🔴 CONNECTION FAILED!
```

**Possible Reasons**:
1. No internet connection
2. Firewall blocking port 587
3. Gmail SMTP unreachable

**Solutions**:
1. Check internet connection
2. Try disabling firewall temporarily
3. Try different network (mobile hotspot)

---

## 🔧 Common Issues & Fixes

### Issue 1: App Password Has Spaces
**Wrong**:
```env
EMAIL_PASS=rwef exeo qacx fyaj
```

**Correct**:
```env
EMAIL_PASS=rwefexeoqacxfyaj
```

**Current in your .env**: `rwefexeoqacxfyaj` ✅ (looks correct)

### Issue 2: 2-Step Verification Not Enabled
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. If it says "Off", click to enable it
4. After enabling, generate NEW App Password
5. Update `.env` file

### Issue 3: Wrong App Password
The App Password you provided: `rwef exeo qacx fyaj`

**Verify**:
1. Go to: https://myaccount.google.com/apppasswords
2. Check if this App Password exists
3. If not, generate a NEW one
4. Update `.env` file

### Issue 4: App Password Revoked
If you deleted the App Password from Google Account:
1. Generate a NEW App Password
2. Update `.env` file
3. Restart backend

---

## 🎯 Quick Verification Steps

### Step 1: Check 2-Step Verification
```
https://myaccount.google.com/security
```
- Should show: "2-Step Verification: On" ✅

### Step 2: Check App Passwords
```
https://myaccount.google.com/apppasswords
```
- Should show: "AlumniAI Portal Backend" or similar

### Step 3: Verify .env File
```bash
cd alumni-portal-backend
cat .env | grep EMAIL
```

Should show:
```
EMAIL_USER=iitianaarish@gmail.com
EMAIL_PASS=rwefexeoqacxfyaj
```

### Step 4: Test Connection
```bash
node test-email-direct.js
```

---

## 🔄 If Still Not Working

### Generate Fresh App Password

1. **Revoke old App Password** (if exists)
   - Go to: https://myaccount.google.com/apppasswords
   - Find "AlumniAI Portal Backend"
   - Click "Remove"

2. **Generate NEW App Password**
   - Click "Select app" → Mail
   - Click "Select device" → Other (Custom name)
   - Type: "AlumniAI Portal Backend NEW"
   - Click "Generate"
   - Copy the 16-digit password

3. **Update .env File**
   ```env
   EMAIL_PASS=your_new_16_digit_password_here
   ```

4. **Test Again**
   ```bash
   node test-email-direct.js
   ```

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] 2-Step Verification is enabled in Gmail
- [ ] App Password exists in Google Account
- [ ] App Password copied correctly (no spaces)
- [ ] `.env` file saved after editing
- [ ] Backend server restarted after .env change
- [ ] Internet connection working
- [ ] Firewall not blocking port 587
- [ ] Test script shows detailed error

---

## 🚨 Alternative: Try Different Email Service

If Gmail continues to fail, you can temporarily use a different service:

### Option 1: Gmail with Different Account
Try with a different Gmail account that has 2-Step Verification enabled.

### Option 2: Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_outlook_password
```

### Option 3: SendGrid (Free tier)
More reliable for production:
1. Sign up: https://sendgrid.com
2. Get API key
3. Use SendGrid SMTP

---

## 📞 Next Steps

1. **Run the test script**:
   ```bash
   cd alumni-portal-backend
   node test-email-direct.js
   ```

2. **Copy the FULL output** from the test script

3. **Share the output** so I can see the exact error

4. **Based on error**, we'll apply the specific fix

---

**DO THIS NOW:**
```bash
cd alumni-portal-backend
node test-email-direct.js
```

Then share the output! 🔍

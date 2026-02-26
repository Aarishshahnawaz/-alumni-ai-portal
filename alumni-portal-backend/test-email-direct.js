/**
 * Direct Email Test Script
 * Run this to test Gmail SMTP connection directly
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('');
console.log('🔍 Testing Gmail SMTP Configuration...');
console.log('');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('🔑 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug output
  logger: true // Log to console
});

// Test email
const mailOptions = {
  from: `"AlumniAI Test" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER, // Send to yourself
  subject: 'Test Email - Gmail SMTP Configuration',
  html: `
    <h2>✅ Gmail SMTP is Working!</h2>
    <p>If you received this email, your Gmail App Password is configured correctly.</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  `
};

console.log('📧 Attempting to send test email...');
console.log('📧 From:', mailOptions.from);
console.log('📧 To:', mailOptions.to);
console.log('');

// Send email
transporter.sendMail(mailOptions)
  .then(info => {
    console.log('');
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    console.log('');
    console.log('🎉 Check your inbox:', process.env.EMAIL_USER);
    console.log('');
    process.exit(0);
  })
  .catch(error => {
    console.log('');
    console.log('❌ FAILED! Email sending failed!');
    console.log('');
    console.log('🔴 Error Code:', error.code);
    console.log('🔴 Error Message:', error.message);
    console.log('');
    
    if (error.code === 'EAUTH') {
      console.log('🔴 AUTHENTICATION FAILED!');
      console.log('');
      console.log('Possible reasons:');
      console.log('1. Wrong App Password (check for typos)');
      console.log('2. 2-Step Verification not enabled in Gmail');
      console.log('3. App Password was revoked or expired');
      console.log('4. Wrong Gmail account');
      console.log('');
      console.log('Solutions:');
      console.log('1. Go to: https://myaccount.google.com/security');
      console.log('2. Enable 2-Step Verification if not enabled');
      console.log('3. Go to: https://myaccount.google.com/apppasswords');
      console.log('4. Generate a NEW App Password');
      console.log('5. Update .env file with new password (no spaces)');
      console.log('6. Run this test again');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('🔴 CONNECTION FAILED!');
      console.log('');
      console.log('Possible reasons:');
      console.log('1. No internet connection');
      console.log('2. Firewall blocking port 587');
      console.log('3. Gmail SMTP server unreachable');
      console.log('');
      console.log('Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Try disabling firewall temporarily');
      console.log('3. Try different network (mobile hotspot)');
    }
    
    console.log('');
    console.log('Full error details:');
    console.log(error);
    console.log('');
    process.exit(1);
  });

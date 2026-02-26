/**
 * Email Utility - Real Gmail SMTP Only
 * NO DEV MODE - Real emails only
 */

const nodemailer = require('nodemailer');

/**
 * Send OTP Email via Gmail SMTP
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} role - User role (student/alumni)
 */
async function sendOTPEmail(email, otp, role = 'student') {
  // Validate environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured in .env file');
  }

  if (process.env.EMAIL_USER === 'your_email@gmail.com') {
    throw new Error('Please update EMAIL_USER in .env with your real Gmail address');
  }

  console.log('📧 Sending OTP email via Gmail SMTP...');
  console.log('📧 From:', process.env.EMAIL_USER);
  console.log('📧 To:', email);
  console.log('🔑 OTP:', otp);

  // Create Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const roleText = role === 'student' ? 'Student' : 'Alumni';

  // Email options
  const mailOptions = {
    from: `"AlumniAI Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - AlumniAI Portal Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .otp-box {
            background-color: #2563eb;
            color: white;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
            letter-spacing: 10px;
          }
          .info {
            background-color: #dbeafe;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .role-badge {
            display: inline-block;
            padding: 5px 15px;
            background-color: #2563eb;
            color: white;
            border-radius: 20px;
            font-size: 14px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 AlumniAI Portal</div>
            <h2 style="color: #333; margin: 0;">Email Verification</h2>
            <div class="role-badge">${roleText} Registration</div>
          </div>
          
          <p>Hello,</p>
          
          <p>Thank you for starting your registration with AlumniAI Portal! To verify your email address, please use the OTP below:</p>
          
          <div class="otp-box">
            ${otp}
          </div>
          
          <div class="info">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This OTP is valid for <strong>5 minutes</strong></li>
              <li>Do not share this OTP with anyone</li>
              <li>You have <strong>5 attempts</strong> to enter the correct OTP</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>After verifying your email, you'll be able to complete your registration and access all features of the AlumniAI Portal.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>AlumniAI Portal Team</strong>
          </p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} AlumniAI Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('✅ Check inbox (and spam folder)');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed!');
    console.error('❌ Error:', error.message);
    
    // Check for common errors
    if (error.code === 'EAUTH') {
      console.error('');
      console.error('🔴 GMAIL AUTHENTICATION FAILED!');
      console.error('   Possible reasons:');
      console.error('   1. Wrong EMAIL_USER or EMAIL_PASS in .env');
      console.error('   2. Using normal password instead of App Password');
      console.error('   3. 2-Step Verification not enabled');
      console.error('   4. App Password not generated correctly');
      console.error('');
      throw new Error('Gmail authentication failed. Check EMAIL_USER and EMAIL_PASS in .env');
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = { sendOTPEmail };

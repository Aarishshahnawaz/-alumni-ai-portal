const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Debug: Log what EMAIL_USER is loaded
  console.log('🔍 DEBUG - EMAIL_USER from .env:', process.env.EMAIL_USER);
  console.log('🔍 DEBUG - EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
  
  // Check if Gmail credentials are configured
  const hasGmailConfig = process.env.EMAIL_USER && 
                         process.env.EMAIL_PASS && 
                         process.env.EMAIL_USER !== 'your_email@gmail.com';
  
  if (hasGmailConfig) {
    console.log('📧 Using Gmail SMTP with:', process.env.EMAIL_USER);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log('⚠️  Gmail not configured. Email will be logged to console only.');
    console.log('⚠️  To send real emails, configure EMAIL_USER and EMAIL_PASS in .env');
    return null; // Return null to indicate no transporter
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AlumniAI Portal" <${process.env.EMAIL_USER || 'noreply@alumniai.com'}>`,
      to: email,
      subject: 'Password Reset OTP - AlumniAI Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              letter-spacing: 8px;
            }
            .info {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
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
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎓 AlumniAI Portal</div>
              <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
            </div>
            
            <p>Hello ${firstName || 'User'},</p>
            
            <p>We received a request to reset your password. Use the OTP below to proceed with resetting your password:</p>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <div class="info">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for <strong>10 minutes</strong></li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>For security reasons, this OTP will expire in 10 minutes. If you need a new OTP, please request another password reset.</p>
            
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ OTP Email sent successfully');
    console.log('Message ID:', info.messageId);
    
    // For development with ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AlumniAI Portal" <${process.env.EMAIL_USER || 'noreply@alumniai.com'}>`,
      to: email,
      subject: 'Password Reset Successful - AlumniAI Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
              color: #22c55e;
              margin-bottom: 10px;
            }
            .success-icon {
              font-size: 64px;
              text-align: center;
              margin: 20px 0;
            }
            .info {
              background-color: #d1fae5;
              border-left: 4px solid #22c55e;
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎓 AlumniAI Portal</div>
              <h2 style="color: #333; margin: 0;">Password Reset Successful</h2>
            </div>
            
            <div class="success-icon">✅</div>
            
            <p>Hello ${firstName || 'User'},</p>
            
            <p>Your password has been successfully reset. You can now log in to your account using your new password.</p>
            
            <div class="info">
              <strong>🔒 Security Reminder:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Keep your password secure and don't share it with anyone</li>
                <li>Use a strong, unique password</li>
                <li>If you didn't make this change, contact support immediately</li>
              </ul>
            </div>
            
            <p>If you did not perform this action, please contact our support team immediately.</p>
            
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Password reset success email sent');
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't throw error here, password reset was successful
    return { success: false, error: error.message };
  }
};

// Send registration OTP email
const sendRegistrationOTPEmail = async (email, otp, role) => {
  try {
    console.log('📧 Attempting to send OTP email to:', email);
    
    const transporter = createTransporter();
    
    // If no transporter (Gmail not configured), log OTP to console
    if (!transporter) {
      console.log('📧 [DEV MODE] OTP Email would be sent to:', email);
      console.log('🔑 [DEV MODE] OTP:', otp);
      console.log('👤 [DEV MODE] Role:', role);
      console.log('⚠️  To send real emails, configure these in .env:');
      console.log('    EMAIL_USER=your-email@gmail.com');
      console.log('    EMAIL_PASS=your-16-digit-app-password');
      console.log('');
      console.log('📝 How to get Gmail App Password:');
      console.log('    1. Go to Google Account Settings');
      console.log('    2. Security → 2-Step Verification');
      console.log('    3. App Passwords → Generate');
      console.log('    4. Copy 16-digit password to .env');
      
      // Return success without actually sending
      return { 
        success: true, 
        messageId: 'dev-mode-' + Date.now(),
        devMode: true 
      };
    }

    // Gmail is configured, send real email
    console.log('📧 Sending real email via Gmail SMTP...');
    
    const roleText = role === 'student' ? 'Student' : 'Alumni';

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
              font-family: 'Arial', sans-serif;
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Registration OTP email sent successfully via Gmail!');
    console.log('📧 Email sent to:', email);
    console.log('📬 Message ID:', info.messageId);
    console.log('✅ Check inbox (and spam folder) for OTP');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Registration OTP email sending failed!');
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
    
    // Check for common Gmail errors
    if (error.code === 'EAUTH') {
      console.error('');
      console.error('🔴 AUTHENTICATION FAILED!');
      console.error('   Possible reasons:');
      console.error('   1. Wrong EMAIL_USER or EMAIL_PASS in .env');
      console.error('   2. Not using Gmail App Password (using normal password)');
      console.error('   3. 2-Step Verification not enabled in Gmail');
      console.error('   4. App Password not generated correctly');
      console.error('');
    }
    
    throw new Error('Failed to send registration OTP email');
  }
};


// Send email verification email
const sendVerificationEmail = async (email, token, firstName) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `http://localhost:3000/verify-email/${token}`;

    const mailOptions = {
      from: `"AlumniAI Portal" <${process.env.EMAIL_USER || 'noreply@alumniai.com'}>`,
      to: email,
      subject: 'Verify Your Institutional Email - AlumniAI Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
            .button {
              display: inline-block;
              padding: 15px 40px;
              background-color: #2563eb;
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              margin: 30px 0;
              font-weight: bold;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
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
            .link-box {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              word-break: break-all;
              margin: 20px 0;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎓 AlumniAI Portal</div>
              <h2 style="color: #333; margin: 0;">Verify Your Institutional Email</h2>
            </div>
            
            <p>Hello ${firstName || 'User'},</p>
            
            <p>Thank you for registering with AlumniAI Portal! To complete your registration and access your account, please verify your institutional email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✉️ Verify Email Address
              </a>
            </div>
            
            <div class="info">
              <strong>📧 Why verify your email?</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ensures you're using a valid institutional email</li>
                <li>Protects your account security</li>
                <li>Enables you to receive important notifications</li>
                <li>Connects you with verified alumni and students</li>
              </ul>
            </div>
            
            <p><strong>⏰ This verification link will expire in 1 hour.</strong></p>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            
            <div class="link-box">
              ${verificationUrl}
            </div>
            
            <p>If you didn't create an account with AlumniAI Portal, please ignore this email.</p>
            
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Verification email sent successfully');
    console.log('Message ID:', info.messageId);
    
    // For development with ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Verification email sending failed:', error);
    throw new Error('Failed to send verification email');
  }
};


module.exports = {
  sendOTPEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendRegistrationOTPEmail
};

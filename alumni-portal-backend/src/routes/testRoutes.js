const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Test email endpoint
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔑 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    
    // Check if configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      return res.status(400).json({
        success: false,
        message: 'Email not configured. Please set EMAIL_USER and EMAIL_PASS in .env file',
        instructions: {
          step1: 'Go to Google Account Settings',
          step2: 'Security → 2-Step Verification → Enable it',
          step3: 'App Passwords → Generate new password',
          step4: 'Copy 16-digit password',
          step5: 'Update .env file with EMAIL_USER and EMAIL_PASS',
          step6: 'Restart backend server'
        }
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Test email
    const testEmail = req.query.to || process.env.EMAIL_USER;
    
    console.log('📧 Sending test email to:', testEmail);

    const info = await transporter.sendMail({
      from: `"AlumniAI Portal" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Test Email - AlumniAI Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Email Configuration Test</h2>
          <p>This is a test email from AlumniAI Portal.</p>
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: ${process.env.EMAIL_USER}
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);

    res.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      details: {
        from: process.env.EMAIL_USER,
        to: testEmail,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    let errorMessage = 'Failed to send test email';
    let troubleshooting = [];

    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed';
      troubleshooting = [
        'Check EMAIL_USER is correct Gmail address',
        'Check EMAIL_PASS is 16-digit App Password (not normal password)',
        'Ensure 2-Step Verification is enabled in Gmail',
        'Generate new App Password if needed',
        'Restart backend after updating .env'
      ];
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Cannot connect to Gmail SMTP server';
      troubleshooting = [
        'Check internet connection',
        'Check firewall settings',
        'Verify port 587 is not blocked'
      ];
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code,
      troubleshooting
    });
  }
});

module.exports = router;

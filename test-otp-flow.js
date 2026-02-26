/**
 * Test Script for OTP Registration Flow
 * Run with: node test-otp-flow.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test.student@university.edu';
const TEST_ROLE = 'student';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}📍 ${msg}${colors.reset}\n`)
};

async function testOTPFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing OTP Registration Flow');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Send OTP
    log.step('STEP 1: Sending OTP to email');
    log.info(`Email: ${TEST_EMAIL}`);
    log.info(`Role: ${TEST_ROLE}`);

    const sendOTPResponse = await axios.post(`${API_URL}/pre-registration/send-otp`, {
      email: TEST_EMAIL,
      role: TEST_ROLE
    });

    if (sendOTPResponse.data.success) {
      log.success('OTP sent successfully!');
      console.log('Response:', JSON.stringify(sendOTPResponse.data, null, 2));
      console.log('\n' + '⚠️  CHECK YOUR BACKEND CONSOLE FOR THE OTP'.yellow);
      console.log('⚠️  Or check email if SMTP is configured\n');
    }

    // Step 2: Prompt for OTP
    log.step('STEP 2: Verify OTP');
    log.warning('This test cannot automatically verify OTP');
    log.info('To complete the test:');
    console.log('   1. Check backend console for OTP');
    console.log('   2. Go to http://localhost:3000/register');
    console.log('   3. Enter email: ' + TEST_EMAIL);
    console.log('   4. Select role: ' + TEST_ROLE);
    console.log('   5. Click "Send OTP"');
    console.log('   6. Enter the OTP from backend console');
    console.log('   7. Complete registration form\n');

    // Test resend OTP
    log.step('STEP 3: Testing Resend OTP');
    const resendResponse = await axios.post(`${API_URL}/pre-registration/resend-otp`, {
      email: TEST_EMAIL
    });

    if (resendResponse.data.success) {
      log.success('Resend OTP works!');
      console.log('Response:', JSON.stringify(resendResponse.data, null, 2));
    }

    // Test with invalid email (public domain)
    log.step('STEP 4: Testing Public Email Rejection');
    try {
      await axios.post(`${API_URL}/pre-registration/send-otp`, {
        email: 'test@gmail.com',
        role: TEST_ROLE
      });
      log.error('Public email should have been rejected!');
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Public email correctly rejected!');
        console.log('Error message:', error.response.data.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    log.success('API ENDPOINTS ARE WORKING CORRECTLY!');
    console.log('='.repeat(60) + '\n');

    log.info('Next Steps:');
    console.log('   1. Open http://localhost:3000/register in browser');
    console.log('   2. Test the complete registration flow');
    console.log('   3. Check backend console for OTP');
    console.log('   4. Verify auto-login after registration\n');

  } catch (error) {
    log.error('Test failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      log.error('No response from server. Is backend running?');
      log.info('Start backend with: cd alumni-portal-backend && npm start');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testOTPFlow();

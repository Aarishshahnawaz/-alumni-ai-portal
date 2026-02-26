import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  // Refs for OTP inputs
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error('Please enter your email first');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error('Please paste only numbers');
      return;
    }

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify-otp`,
        { email, otp: otpString }
      );

      if (response.data.success) {
        toast.success('OTP verified successfully!');
        // Navigate to reset password page
        navigate('/reset-password', { state: { email, otp: otpString } });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      toast.error(message);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      setResending(true);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`,
        { email }
      );

      if (response.data.success) {
        toast.success('New OTP sent to your email!');
        setTimer(600); // Reset timer
        setOtp(['', '', '', '', '', '']); // Clear OTP
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">AlumniAI</span>
          </Link>
          <div className="mt-6 flex justify-center">
            <div className="bg-primary-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Verify OTP
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-sm font-medium text-gray-900">{email}</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white py-8 px-6 shadow-lg rounded-lg"
        >
          {/* OTP Input */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-4">
                Enter OTP
              </label>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {timer > 0 ? (
                  <>
                    OTP expires in{' '}
                    <span className="font-semibold text-primary-600">
                      {formatTime(timer)}
                    </span>
                  </>
                ) : (
                  <span className="text-red-600 font-semibold">OTP expired</span>
                )}
              </p>
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={resending || timer > 540} // Can resend after 1 minute
                className="text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
              {timer > 540 && (
                <p className="text-xs text-gray-500 mt-1">
                  Available in {formatTime(timer - 540)}
                </p>
              )}
            </div>
          </div>

          {/* Back to forgot password */}
          <div className="mt-6">
            <Link
              to="/forgot-password"
              className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to forgot password
            </Link>
          </div>
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            Didn't receive the code? Check your spam folder or{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              resend
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyOTPPage;

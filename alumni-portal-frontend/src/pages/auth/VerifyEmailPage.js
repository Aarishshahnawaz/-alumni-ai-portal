import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import axios from 'axios';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Email verification failed. The link may be invalid or expired.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
          </div>

          {/* Status Content */}
          <div className="text-center">
            {status === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Loader className="h-16 w-16 text-primary-600 animate-spin mx-auto" />
                <p className="text-gray-600">Verifying your email address...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="space-y-4"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  Redirecting to login page...
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Go to Login
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="space-y-4"
              >
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Verification Failed
                </h2>
                <p className="text-gray-600">{message}</p>
                <div className="space-y-2 mt-6">
                  <Link
                    to="/resend-verification"
                    className="block w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Request New Verification Link
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help?{' '}
          <a href="mailto:support@alumniai.com" className="text-primary-600 hover:text-primary-700">
            Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;

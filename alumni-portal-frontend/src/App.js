import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { checkAuthStatus } from './store/slices/authSlice';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import MultiStepRegisterPage from './pages/auth/MultiStepRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResendVerificationPage from './pages/auth/ResendVerificationPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AlumniDashboard from './pages/dashboard/AlumniDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import AlumniDirectory from './pages/AlumniDirectory';
import ResumeUpload from './pages/ResumeUpload';
import MentorshipPage from './pages/MentorshipPage';
import JobListings from './pages/JobListings';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <MultiStepRegisterPage />
            )
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <ForgotPasswordPage />
            )
          } 
        />
        <Route 
          path="/verify-otp" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <VerifyOTPPage />
            )
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <ResetPasswordPage />
            )
          } 
        />
        <Route 
          path="/verify-email/:token" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <VerifyEmailPage />
            )
          } 
        />
        <Route 
          path="/resend-verification" 
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(user?.role)} replace />
            ) : (
              <ResendVerificationPage />
            )
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/alumni"
          element={
            <ProtectedRoute allowedRoles={['alumni']}>
              <AlumniDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Shared Protected Routes */}
        <Route
          path="/alumni"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <AlumniDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni']}>
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentorship"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni']}>
              <MentorshipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <JobListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

// Helper function to get dashboard route based on user role
function getDashboardRoute(role) {
  switch (role) {
    case 'student':
      return '/dashboard/student';
    case 'alumni':
      return '/dashboard/alumni';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/';
  }
}

export default App;
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  LogOut,
  User,
  Check,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { changePassword, logoutUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  // Theme state (controlled by context)
  const darkMode = theme === 'dark';

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences?.emailNotifications ?? true
  );
  const [mentorshipAlerts, setMentorshipAlerts] = useState(
    user?.preferences?.mentorshipAlerts ?? true
  );
  const [jobAlerts, setJobAlerts] = useState(
    user?.preferences?.jobAlerts ?? true
  );

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState(
    user?.preferences?.profileVisibility ?? 'public'
  );
  const [allowMentorRequests, setAllowMentorRequests] = useState(
    user?.preferences?.allowMentorRequests ?? true
  );

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Loading states
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingStates, setSavingStates] = useState({});

  // Auto-save function with debounce
  const autoSavePreference = useCallback(
    debounce(async (field, value) => {
      const toastId = `saving-${field}`;
      
      try {
        setSavingStates(prev => ({ ...prev, [field]: true }));

        const settingsData = {
          preferences: {
            [field]: value,
          },
        };

        console.log('🔄 Auto-saving preference:', field, '=', value);
        const response = await authAPI.updateProfile(settingsData);
        console.log('✅ Auto-save response:', response);
        
        // Check if response is successful
        if (response && response.success) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
          toast.success(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} updated`, {
            id: toastId,
            duration: 2000,
            icon: '✓',
          });
        } else {
          // Response received but not successful
          console.error('❌ Auto-save failed - response not successful:', response);
          throw new Error(response?.message || 'Update failed');
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Only show error toast once
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        toast.error(`Failed to update ${fieldName}`, {
          id: toastId,
          duration: 3000,
        });
      } finally {
        setSavingStates(prev => ({ ...prev, [field]: false }));
      }
    }, 300),
    []
  );

  const handleToggleDarkMode = () => {
    toggleTheme();
    // Auto-save theme preference
    autoSavePreference('theme', theme === 'light' ? 'dark' : 'light');
  };

  const handleEmailNotificationsChange = (value) => {
    setEmailNotifications(value);
    autoSavePreference('emailNotifications', value);
  };

  const handleMentorshipAlertsChange = (value) => {
    setMentorshipAlerts(value);
    autoSavePreference('mentorshipAlerts', value);
  };

  const handleJobAlertsChange = (value) => {
    setJobAlerts(value);
    autoSavePreference('jobAlerts', value);
  };

  const handleProfileVisibilityChange = (value) => {
    setProfileVisibility(value);
    autoSavePreference('profileVisibility', value);
  };

  const handleAllowMentorRequestsChange = (value) => {
    setAllowMentorRequests(value);
    autoSavePreference('allowMentorRequests', value);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error) {
      // Error toast is shown by the thunk
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (
      window.confirm(
        'This will log you out from all devices. Continue?'
      )
    ) {
      try {
        await dispatch(logoutUser()).unwrap();
        navigate('/login');
      } catch (error) {
        toast.error('Failed to logout');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      const confirmation = window.prompt(
        'Type "DELETE" to confirm account deletion:'
      );
      if (confirmation === 'DELETE') {
        try {
          // TODO: Implement delete account API
          toast.error('Account deletion is not yet implemented');
        } catch (error) {
          toast.error('Failed to delete account');
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              {darkMode ? (
                <Moon className="h-5 w-5 mr-2 text-primary-600" />
              ) : (
                <Sun className="h-5 w-5 mr-2 text-primary-600" />
              )}
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">
                  Toggle between light and dark theme
                </p>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Account Settings
            </h2>

            <div className="space-y-4">
              {/* Email Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {/* Change Password */}
              <div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>

                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          minLength={6}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary-600" />
              Notifications
            </h2>
            <div className="space-y-4">
              <ToggleSetting
                label="Email Notifications"
                description="Receive email updates about your account"
                checked={emailNotifications}
                onChange={handleEmailNotificationsChange}
                saving={savingStates.emailNotifications}
              />
              <ToggleSetting
                label="Mentorship Alerts"
                description="Get notified about mentorship requests and updates"
                checked={mentorshipAlerts}
                onChange={handleMentorshipAlertsChange}
                saving={savingStates.mentorshipAlerts}
              />
              <ToggleSetting
                label="Job Alerts"
                description="Receive notifications about new job postings"
                checked={jobAlerts}
                onChange={handleJobAlertsChange}
                saving={savingStates.jobAlerts}
              />
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary-600" />
              Privacy
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={profileVisibility}
                  onChange={(e) => handleProfileVisibilityChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  disabled={savingStates.profileVisibility}
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="alumni">Alumni Only - Visible to alumni</option>
                  <option value="private">Private - Only visible to you</option>
                </select>
                {savingStates.profileVisibility && (
                  <p className="mt-1 text-xs text-primary-600 flex items-center">
                    <span className="animate-spin mr-1">⟳</span> Saving...
                  </p>
                )}
              </div>
              <ToggleSetting
                label="Allow Mentor Requests"
                description="Allow students to send you mentorship requests"
                checked={allowMentorRequests}
                onChange={handleAllowMentorRequestsChange}
                saving={savingStates.allowMentorRequests}
              />
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary-600" />
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Login</p>
                <p className="text-sm text-gray-500">
                  {user?.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Active Sessions
                </p>
                <button
                  onClick={handleLogoutAllDevices}
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout from all devices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Danger Zone
            </h2>
            <div>
              <p className="text-sm text-red-700 mb-3">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Toggle Setting Component with saving indicator
const ToggleSetting = ({ label, description, checked, onChange, saving }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center space-x-2">
        {saving && (
          <span className="text-xs text-primary-600 animate-pulse">
            <Check className="h-4 w-4" />
          </span>
        )}
        <button
          onClick={() => onChange(!checked)}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-primary-600' : 'bg-gray-200'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

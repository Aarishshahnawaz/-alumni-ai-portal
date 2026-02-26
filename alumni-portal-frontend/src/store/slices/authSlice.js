import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { removeAuthToken, getStoredToken, getStoredRefreshToken } from '../../utils/auth';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import toast from 'react-hot-toast';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token, refreshToken } = response;
      
      toast.success(`Welcome back, ${user.profile.firstName}!`);
      return { user, token, refreshToken };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const { user } = response;
      
      // Don't show toast here - let the component handle it
      // Don't return tokens - we don't want to auto-login
      return { user };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      removeAuthToken();
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      removeAuthToken();
      toast.success('Logged out successfully');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = getStoredToken();
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await authAPI.getProfile();
      return response.user; // authAPI.getProfile() already returns response.data.data
    } catch (error) {
      removeAuthToken();
      return rejectWithValue('Authentication failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux thunk - Updating profile with:', JSON.stringify(profileData, null, 2));
      const response = await authAPI.updateProfile(profileData);
      console.log('✅ Redux thunk - Update successful:', response);
      // Don't show toast here - let the component handle it
      return response.data.user;
    } catch (error) {
      console.error('❌ Redux thunk - Update failed:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error message:', error.message);
      console.error('Validation errors:', error.errors || error.response?.data?.errors || []);
      
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      const errors = error.errors || error.response?.data?.errors || [];
      
      // Show first validation error if available
      if (errors.length > 0) {
        console.error('❗ First validation error:', errors[0]);
        console.error('❗ Field:', errors[0].field);
        console.error('❗ Message:', errors[0].message);
        console.error('❗ Value:', errors[0].value);
      }
      
      // Return just the message string for compatibility
      return rejectWithValue(message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        // Tokens are already stored in localStorage by api.js authAPI.login
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Don't set user, token, or isAuthenticated
        // User must login after registration
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = getStoredToken(); // Restore token from localStorage
        state.refreshToken = getStoredRefreshToken(); // Restore refresh token
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectProfileCompletion = (state) => calculateProfileCompletion(state.auth.user);

export default authSlice.reducer;
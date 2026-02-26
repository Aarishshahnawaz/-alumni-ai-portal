/**
 * Enhanced API Service with Security, Performance, and Error Handling
 * Centralized HTTP client with authentication, retry logic, and comprehensive error handling
 */

import axios from 'axios';
import { parseApiError, retryWithBackoff, logError } from '../utils/errorHandler';
import { getStoredToken, getStoredRefreshToken, setAuthToken, removeAuthToken } from '../utils/auth';
import toast from 'react-hot-toast';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000,
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request ID generator for tracing
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Token management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Add authentication token
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    logError(error, { context: 'request_interceptor' });
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh logic
apiClient.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        responseTime: `${responseTime}ms`,
        data: response.data,
      });
    }
    
    // Log slow requests
    if (responseTime > 5000) {
      console.warn(`🐌 Slow API Request: ${response.config.url} took ${responseTime}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh for 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh-token', {
            refreshToken: refreshToken,
          });
          
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          // Update tokens
          setAuthToken(token, newRefreshToken);
          
          // Process queued requests
          processQueue(null, token);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        removeAuthToken();
        toast.error('Session expired. Please log in again.');
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other error types with user-friendly messages
    // Only show generic toasts for critical errors, let components handle specific errors
    if (error.response?.status >= 500) {
      // Don't show toast here - let component handle it
      console.error('Server error:', error);
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your internet connection.');
    }
    // Note: 400 errors (validation) are handled by components, not here
    
    // Log error
    const responseTime = error.config?.metadata ? 
      Date.now() - error.config.metadata.startTime : 0;
    
    logError(error, {
      context: 'response_interceptor',
      url: error.config?.url,
      method: error.config?.method,
      responseTime,
    });
    
    return Promise.reject(parseApiError(error));
  }
);

// Enhanced API methods with retry logic
const apiWithRetry = async (requestFn, retries = API_CONFIG.retries) => {
  return retryWithBackoff(requestFn, retries, API_CONFIG.retryDelay);
};

// Auth API with enhanced error handling
export const authAPI = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    const { token, refreshToken, user } = response.data.data;
    
    // Store tokens
    setAuthToken(token, refreshToken);
    
    return { user, token, refreshToken };
  },

  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    const { user } = response.data.data;
    
    // Don't store tokens - user must login after registration
    // This prevents automatic login after registration
    
    return { user };
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      removeAuthToken();
    }
  },

  async getProfile() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data.data;
    });
  },

  async updateProfile(profileData) {
    try {
      console.log('📤 API Service - Sending to backend:', JSON.stringify(profileData, null, 2));
      const response = await apiClient.put('/auth/profile', profileData);
      console.log('📥 API Service - Backend response:', response.data);
      return response.data; // Return full response with success, message, and data
    } catch (error) {
      console.error('❌ API Service - Request failed');
      console.error('Raw error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  },

  async uploadProfileImage(formData) {
    const response = await apiClient.put('/auth/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await apiClient.put('/auth/change-password', passwordData);
    return response.data.data;
  },

  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },
};

// Alumni API with retry logic
export const alumniAPI = {
  async getDirectory(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/alumni/directory', { params });
      return response.data.data;
    });
  },

  async getProfile(userId) {
    return apiWithRetry(async () => {
      const response = await apiClient.get(`/alumni/profile/${userId}`);
      return response.data.data;
    });
  },

  async getStatistics() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/alumni/statistics');
      return response.data.data;
    });
  },

  async getSuggestions(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/alumni/suggestions', { params });
      return response.data.data;
    });
  },
};

// Jobs API with enhanced functionality
export const jobsAPI = {
  async getJobs(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/jobs', { params });
      return response.data.data;
    });
  },

  async getJob(jobId) {
    return apiWithRetry(async () => {
      const response = await apiClient.get(`/jobs/${jobId}`);
      return response.data.data;
    });
  },

  async createJob(jobData) {
    const response = await apiClient.post('/jobs', jobData);
    return response.data.data;
  },

  async updateJob(jobId, jobData) {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data.data;
  },

  async deleteJob(jobId) {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data.data;
  },

  async applyToJob(jobId) {
    const response = await apiClient.post(`/jobs/${jobId}/apply`);
    return response.data.data;
  },

  async getMyApplications(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/jobs/applications/my', { params });
      return response.data.data;
    });
  },

  async getJobApplications(jobId) {
    return apiWithRetry(async () => {
      const response = await apiClient.get(`/jobs/${jobId}/applications`);
      return response.data.data;
    });
  },

  async updateApplicationStatus(jobId, applicationId, status) {
    const response = await apiClient.put(`/jobs/${jobId}/applications/${applicationId}`, { status });
    return response.data.data;
  },
};

// Mentorship API with comprehensive features
export const mentorshipAPI = {
  async createRequest(requestData) {
    const response = await apiClient.post('/mentorship', requestData);
    return response.data.data;
  },

  async getMyRequests(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/mentorship/my-requests', { params });
      return response.data.data;
    });
  },

  async getPendingRequests() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/mentorship/pending');
      return response.data.data;
    });
  },

  async respondToRequest(requestId, responseData) {
    const response = await apiClient.put(`/mentorship/${requestId}/respond`, responseData);
    return response.data.data;
  },

  async updateStatus(requestId, status) {
    const response = await apiClient.put(`/mentorship/${requestId}/status`, { status });
    return response.data.data;
  },

  async addMeeting(requestId, meetingData) {
    const response = await apiClient.post(`/mentorship/${requestId}/meetings`, meetingData);
    return response.data.data;
  },

  async submitFeedback(requestId, feedbackData) {
    const response = await apiClient.post(`/mentorship/${requestId}/feedback`, feedbackData);
    return response.data.data;
  },
};

// Resume API with file upload progress
export const resumeAPI = {
  async uploadResume(formData, onUploadProgress) {
    const response = await apiClient.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      timeout: 60000, // 60 seconds for file uploads
    });
    return response.data.data;
  },

  async getMyResume() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/resumes/my');
      return response.data.data;
    });
  },

  async downloadResume(resumeId) {
    const response = await apiClient.get(`/resumes/${resumeId}/download`, { 
      responseType: 'blob' 
    });
    return response.data;
  },

  async deleteResume() {
    const response = await apiClient.delete('/resumes/my');
    return response.data.data;
  },

  async searchResumes(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/resumes/search', { params });
      return response.data.data;
    });
  },
};

// Admin API with comprehensive dashboard features
export const adminAPI = {
  async getDashboardStats() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/dashboard');
      return response.data.data;
    });
  },

  async getUserStats(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/users/stats', { params });
      return response.data.data;
    });
  },

  async getMentorshipStats(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/mentorship/stats', { params });
      return response.data.data;
    });
  },

  async getSkillsDistribution(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/skills/distribution', { params });
      return response.data.data;
    });
  },

  async getActivityLogs(params = {}) {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/activity-logs', { params });
      return response.data.data;
    });
  },

  async getSystemHealth() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/system/health');
      return response.data.data;
    });
  },

  async getMentorCount() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/mentor-count');
      return response.data.data;
    });
  },

  async getTotalEarnings() {
    return apiWithRetry(async () => {
      const response = await apiClient.get('/admin/total-earnings');
      return response.data.data;
    });
  },

  async manageUser(userId, action, data = {}) {
    const response = await apiClient.post(`/admin/users/${userId}/manage`, {
      action,
      ...data,
    });
    return response.data.data;
  },
};

// AI Service API with enhanced error handling
export const aiAPI = {
  async predictCareer(predictionData) {
    const AI_BASE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8001/api/v1';
    
    return apiWithRetry(async () => {
      const response = await axios.post(`${AI_BASE_URL}/career/predict`, predictionData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
        },
      });
      return response.data.data;
    });
  },

  async calculateCompatibility(compatibilityData) {
    const AI_BASE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8001/api/v1';
    
    return apiWithRetry(async () => {
      const response = await axios.post(`${AI_BASE_URL}/compatibility/calculate`, compatibilityData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
        },
      });
      return response.data.data;
    });
  },

  async analyzeResume(formData) {
    const AI_BASE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8001/api/v1';
    
    return apiWithRetry(async () => {
      const response = await axios.post(`${AI_BASE_URL}/resume/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data.data;
    });
  },

  async analyzeSentiment(sentimentData) {
    const AI_BASE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8001/api/v1';
    
    return apiWithRetry(async () => {
      const response = await axios.post(`${AI_BASE_URL}/sentiment/analyze`, sentimentData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
        },
      });
      return response.data.data;
    });
  },
};

// Health check utility
export const healthCheck = async () => {
  const response = await axios.get(`${API_CONFIG.baseURL.replace('/api', '')}/health`, {
    timeout: 5000,
  });
  return response.data;
};

export default apiClient;
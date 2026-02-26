import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboardStats();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard stats';
      return rejectWithValue(message);
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'admin/fetchUserStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUserStats(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user stats';
      return rejectWithValue(message);
    }
  }
);

export const fetchMentorshipStats = createAsyncThunk(
  'admin/fetchMentorshipStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getMentorshipStats(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mentorship stats';
      return rejectWithValue(message);
    }
  }
);

export const fetchSkillsDistribution = createAsyncThunk(
  'admin/fetchSkillsDistribution',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getSkillsDistribution(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch skills distribution';
      return rejectWithValue(message);
    }
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'admin/fetchActivityLogs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getActivityLogs(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch activity logs';
      return rejectWithValue(message);
    }
  }
);

export const fetchSystemHealth = createAsyncThunk(
  'admin/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getSystemHealth();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch system health';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  dashboard: {
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalJobs: 0,
      mentorshipMatches: 0,
      aiPredictions: 0,
      userGrowth: 0,
      activeGrowth: 0,
      jobGrowth: 0,
      mentorshipGrowth: 0,
      aiGrowth: 0,
    },
    loading: false,
    error: null,
  },
  userStats: {
    growth: [],
    demographics: [],
    engagement: [],
    loading: false,
    error: null,
  },
  mentorshipStats: {
    trends: [],
    success_rates: [],
    popular_skills: [],
    loading: false,
    error: null,
  },
  skillsDistribution: {
    skills: [],
    categories: [],
    trends: [],
    loading: false,
    error: null,
  },
  activityLogs: {
    logs: [],
    totalCount: 0,
    loading: false,
    error: null,
  },
  systemHealth: {
    status: 'unknown',
    uptime: 0,
    memory_usage: 0,
    cpu_usage: 0,
    disk_usage: 0,
    active_connections: 0,
    response_time: 0,
    error_rate: 0,
    loading: false,
    error: null,
  },
  filters: {
    timeRange: '30d',
    userType: 'all',
    status: 'all',
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state, action) => {
      const section = action.payload;
      if (section && state[section]) {
        state[section].error = null;
      }
    },
    resetDashboard: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.stats = action.payload;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      })
      
      // User Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.userStats.loading = true;
        state.userStats.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStats.loading = false;
        state.userStats.growth = action.payload.growth || [];
        state.userStats.demographics = action.payload.demographics || [];
        state.userStats.engagement = action.payload.engagement || [];
        state.userStats.error = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.userStats.loading = false;
        state.userStats.error = action.payload;
      })
      
      // Mentorship Stats
      .addCase(fetchMentorshipStats.pending, (state) => {
        state.mentorshipStats.loading = true;
        state.mentorshipStats.error = null;
      })
      .addCase(fetchMentorshipStats.fulfilled, (state, action) => {
        state.mentorshipStats.loading = false;
        state.mentorshipStats.trends = action.payload.trends || [];
        state.mentorshipStats.success_rates = action.payload.success_rates || [];
        state.mentorshipStats.popular_skills = action.payload.popular_skills || [];
        state.mentorshipStats.error = null;
      })
      .addCase(fetchMentorshipStats.rejected, (state, action) => {
        state.mentorshipStats.loading = false;
        state.mentorshipStats.error = action.payload;
      })
      
      // Skills Distribution
      .addCase(fetchSkillsDistribution.pending, (state) => {
        state.skillsDistribution.loading = true;
        state.skillsDistribution.error = null;
      })
      .addCase(fetchSkillsDistribution.fulfilled, (state, action) => {
        state.skillsDistribution.loading = false;
        state.skillsDistribution.skills = action.payload.skills || [];
        state.skillsDistribution.categories = action.payload.categories || [];
        state.skillsDistribution.trends = action.payload.trends || [];
        state.skillsDistribution.error = null;
      })
      .addCase(fetchSkillsDistribution.rejected, (state, action) => {
        state.skillsDistribution.loading = false;
        state.skillsDistribution.error = action.payload;
      })
      
      // Activity Logs
      .addCase(fetchActivityLogs.pending, (state) => {
        state.activityLogs.loading = true;
        state.activityLogs.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.activityLogs.loading = false;
        state.activityLogs.logs = action.payload.logs || [];
        state.activityLogs.totalCount = action.payload.totalCount || 0;
        state.activityLogs.error = null;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.activityLogs.loading = false;
        state.activityLogs.error = action.payload;
      })
      
      // System Health
      .addCase(fetchSystemHealth.pending, (state) => {
        state.systemHealth.loading = true;
        state.systemHealth.error = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.systemHealth.loading = false;
        state.systemHealth = { ...state.systemHealth, ...action.payload, loading: false, error: null };
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.systemHealth.loading = false;
        state.systemHealth.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearError, resetDashboard } = adminSlice.actions;
export default adminSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { alumniAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchAlumniDirectory = createAsyncThunk(
  'alumni/fetchDirectory',
  async (params, { rejectWithValue }) => {
    try {
      const data = await alumniAPI.getDirectory(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch alumni directory';
      return rejectWithValue(message);
    }
  }
);

export const fetchAlumniProfile = createAsyncThunk(
  'alumni/fetchProfile',
  async (id, { rejectWithValue }) => {
    try {
      const data = await alumniAPI.getProfile(id);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch alumni profile';
      return rejectWithValue(message);
    }
  }
);

export const fetchAlumniStatistics = createAsyncThunk(
  'alumni/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alumniAPI.getStatistics();
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch statistics';
      return rejectWithValue(message);
    }
  }
);

export const fetchAlumniSuggestions = createAsyncThunk(
  'alumni/fetchSuggestions',
  async (params, { rejectWithValue }) => {
    try {
      const data = await alumniAPI.getSuggestions(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch suggestions';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  directory: {
    alumni: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  selectedProfile: null,
  statistics: {
    totalAlumni: 0,
    companiesCount: 0,
    skillsCount: 0,
    topCompanies: [],
    topSkills: [],
    graduationYears: [],
    loading: false,
    error: null,
  },
  suggestions: {
    mentors: [],
    connections: [],
    loading: false,
    error: null,
  },
  filters: {
    search: '',
    skills: [],
    companies: [],
    graduationYear: '',
    location: '',
    industry: '',
  },
};

const alumniSlice = createSlice({
  name: 'alumni',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedProfile: (state) => {
      state.selectedProfile = null;
    },
    clearError: (state, action) => {
      const section = action.payload;
      if (section && state[section]) {
        state[section].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Directory
      .addCase(fetchAlumniDirectory.pending, (state) => {
        state.directory.loading = true;
        state.directory.error = null;
      })
      .addCase(fetchAlumniDirectory.fulfilled, (state, action) => {
        state.directory.loading = false;
        state.directory.alumni = action.payload?.alumni || [];
        state.directory.totalCount = action.payload?.totalCount || 0;
        state.directory.currentPage = action.payload?.currentPage || 1;
        state.directory.totalPages = action.payload?.totalPages || 1;
        state.directory.error = null;
      })
      .addCase(fetchAlumniDirectory.rejected, (state, action) => {
        state.directory.loading = false;
        state.directory.error = action.payload;
      })
      
      // Fetch Profile
      .addCase(fetchAlumniProfile.pending, (state) => {
        state.selectedProfile = null;
      })
      .addCase(fetchAlumniProfile.fulfilled, (state, action) => {
        state.selectedProfile = action.payload?.alumni || action.payload || null;
      })
      .addCase(fetchAlumniProfile.rejected, (state, action) => {
        toast.error(action.payload);
      })
      
      // Fetch Statistics
      .addCase(fetchAlumniStatistics.pending, (state) => {
        state.statistics.loading = true;
        state.statistics.error = null;
      })
      .addCase(fetchAlumniStatistics.fulfilled, (state, action) => {
        state.statistics.loading = false;
        state.statistics = { ...state.statistics, ...action.payload, loading: false, error: null };
      })
      .addCase(fetchAlumniStatistics.rejected, (state, action) => {
        state.statistics.loading = false;
        state.statistics.error = action.payload;
      })
      
      // Fetch Suggestions
      .addCase(fetchAlumniSuggestions.pending, (state) => {
        if (!state.suggestions) {
          state.suggestions = { mentors: [], connections: [], loading: false, error: null };
        }
        state.suggestions.loading = true;
        state.suggestions.error = null;
      })
      .addCase(fetchAlumniSuggestions.fulfilled, (state, action) => {
        if (!state.suggestions) {
          state.suggestions = { mentors: [], connections: [], loading: false, error: null };
        }
        state.suggestions.loading = false;
        state.suggestions.mentors = action.payload.mentors || [];
        state.suggestions.connections = action.payload.connections || [];
        state.suggestions.error = null;
      })
      .addCase(fetchAlumniSuggestions.rejected, (state, action) => {
        if (!state.suggestions) {
          state.suggestions = { mentors: [], connections: [], loading: false, error: null };
        }
        state.suggestions.loading = false;
        state.suggestions.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedProfile, clearError } = alumniSlice.actions;
export default alumniSlice.reducer;
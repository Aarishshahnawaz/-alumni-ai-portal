import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jobsAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.getJobs(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch jobs';
      return rejectWithValue(message);
    }
  }
);

export const fetchJobDetails = createAsyncThunk(
  'jobs/fetchJobDetails',
  async (id, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.getJob(id);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch job details';
      return rejectWithValue(message);
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.createJob(jobData);
      toast.success('Job posted successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create job';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, jobData }, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.updateJob(id, jobData);
      toast.success('Job updated successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update job';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (id, { rejectWithValue }) => {
    try {
      await jobsAPI.deleteJob(id);
      toast.success('Job deleted successfully!');
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete job';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const applyToJob = createAsyncThunk(
  'jobs/applyToJob',
  async (id, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.applyToJob(id);
      toast.success('Application submitted successfully!');
      return { jobId: id, application: data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to apply to job';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'jobs/fetchMyApplications',
  async (params, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.getMyApplications(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch applications';
      return rejectWithValue(message);
    }
  }
);

export const fetchJobApplications = createAsyncThunk(
  'jobs/fetchJobApplications',
  async (id, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.getJobApplications(id);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch job applications';
      return rejectWithValue(message);
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'jobs/updateApplicationStatus',
  async ({ jobId, applicationId, status }, { rejectWithValue }) => {
    try {
      const data = await jobsAPI.updateApplicationStatus(jobId, applicationId, status);
      toast.success(`Application ${status.toLowerCase()} successfully!`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update application status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  jobs: {
    list: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  selectedJob: null,
  myApplications: {
    list: [],
    totalCount: 0,
    loading: false,
    error: null,
  },
  jobApplications: {
    list: [],
    loading: false,
    error: null,
  },
  filters: {
    search: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    skills: [],
    company: '',
    salaryRange: '',
    remote: false,
  },
  creating: false,
  updating: false,
  deleting: false,
  applying: false,
};

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedJob: (state) => {
      state.selectedJob = null;
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
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        if (!state.jobs) {
          state.jobs = { list: [], totalCount: 0, currentPage: 1, totalPages: 1, loading: false, error: null };
        }
        state.jobs.loading = true;
        state.jobs.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        if (!state.jobs) {
          state.jobs = { list: [], totalCount: 0, currentPage: 1, totalPages: 1, loading: false, error: null };
        }
        state.jobs.loading = false;
        state.jobs.list = action.payload.jobs || [];
        state.jobs.totalCount = action.payload.totalCount || 0;
        state.jobs.currentPage = action.payload.currentPage || 1;
        state.jobs.totalPages = action.payload.totalPages || 1;
        state.jobs.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        if (!state.jobs) {
          state.jobs = { list: [], totalCount: 0, currentPage: 1, totalPages: 1, loading: false, error: null };
        }
        state.jobs.loading = false;
        state.jobs.error = action.payload;
      })
      
      // Fetch Job Details
      .addCase(fetchJobDetails.pending, (state) => {
        state.selectedJob = null;
      })
      .addCase(fetchJobDetails.fulfilled, (state, action) => {
        state.selectedJob = action.payload?.job || action.payload || null;
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        toast.error(action.payload);
      })
      
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.creating = true;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.creating = false;
        const job = action.payload?.job || action.payload;
        if (job) {
          state.jobs.list.unshift(job);
          state.jobs.totalCount += 1;
        }
      })
      .addCase(createJob.rejected, (state) => {
        state.creating = false;
      })
      
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.updating = false;
        const job = action.payload?.job || action.payload;
        if (job) {
          const index = state.jobs.list.findIndex(j => j._id === job._id);
          if (index !== -1) {
            state.jobs.list[index] = job;
          }
          if (state.selectedJob && state.selectedJob._id === job._id) {
            state.selectedJob = job;
          }
        }
      })
      .addCase(updateJob.rejected, (state) => {
        state.updating = false;
      })
      
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.deleting = false;
        state.jobs.list = state.jobs.list.filter(job => job._id !== action.payload);
        state.jobs.totalCount -= 1;
        if (state.selectedJob && state.selectedJob._id === action.payload) {
          state.selectedJob = null;
        }
      })
      .addCase(deleteJob.rejected, (state) => {
        state.deleting = false;
      })
      
      // Apply to Job
      .addCase(applyToJob.pending, (state) => {
        state.applying = true;
      })
      .addCase(applyToJob.fulfilled, (state, action) => {
        state.applying = false;
        // Update job in list to reflect application
        const jobIndex = state.jobs.list.findIndex(job => job._id === action.payload.jobId);
        if (jobIndex !== -1) {
          state.jobs.list[jobIndex].hasApplied = true;
        }
        if (state.selectedJob && state.selectedJob._id === action.payload.jobId) {
          state.selectedJob.hasApplied = true;
        }
      })
      .addCase(applyToJob.rejected, (state) => {
        state.applying = false;
      })
      
      // Fetch My Applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.myApplications.loading = true;
        state.myApplications.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.myApplications.loading = false;
        state.myApplications.list = action.payload?.applications || action.payload || [];
        state.myApplications.totalCount = action.payload?.totalCount || 0;
        state.myApplications.error = null;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.myApplications.loading = false;
        state.myApplications.error = action.payload;
      })
      
      // Fetch Job Applications
      .addCase(fetchJobApplications.pending, (state) => {
        state.jobApplications.loading = true;
        state.jobApplications.error = null;
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.jobApplications.loading = false;
        state.jobApplications.list = action.payload?.applications || action.payload || [];
        state.jobApplications.error = null;
      })
      .addCase(fetchJobApplications.rejected, (state, action) => {
        state.jobApplications.loading = false;
        state.jobApplications.error = action.payload;
      })
      
      // Update Application Status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const application = action.payload?.application || action.payload;
        if (application) {
          const applicationIndex = state.jobApplications.list.findIndex(
            app => app._id === application._id
          );
          if (applicationIndex !== -1) {
            state.jobApplications.list[applicationIndex] = application;
          }
        }
      });
  },
});

export const { setFilters, clearFilters, clearSelectedJob, clearError } = jobSlice.actions;
export default jobSlice.reducer;
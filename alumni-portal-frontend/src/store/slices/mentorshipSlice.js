import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mentorshipAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const createMentorshipRequest = createAsyncThunk(
  'mentorship/createRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.createRequest(requestData);
      toast.success('Mentorship request sent successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create mentorship request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchMyRequests = createAsyncThunk(
  'mentorship/fetchMyRequests',
  async (params, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.getMyRequests(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mentorship requests';
      return rejectWithValue(message);
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'mentorship/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.getPendingRequests();
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch pending requests';
      return rejectWithValue(message);
    }
  }
);

export const respondToRequest = createAsyncThunk(
  'mentorship/respondToRequest',
  async ({ requestId, responseData }, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.respondToRequest(requestId, responseData);
      const action = responseData.status === 'accepted' ? 'accepted' : 'declined';
      toast.success(`Mentorship request ${action} successfully!`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to respond to request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'mentorship/updateStatus',
  async ({ requestId, status }, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.updateStatus(requestId, status);
      toast.success(`Mentorship status updated to ${status}!`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const addMeeting = createAsyncThunk(
  'mentorship/addMeeting',
  async ({ requestId, meetingData }, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.addMeeting(requestId, meetingData);
      toast.success('Meeting scheduled successfully!');
      return { requestId, meeting: data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to schedule meeting';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'mentorship/submitFeedback',
  async ({ requestId, feedbackData }, { rejectWithValue }) => {
    try {
      const data = await mentorshipAPI.submitFeedback(requestId, feedbackData);
      toast.success('Feedback submitted successfully!');
      return { requestId, feedback: data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  myRequests: {
    sent: [],
    received: [],
    totalCount: 0,
    loading: false,
    error: null,
  },
  pendingRequests: {
    list: [],
    loading: false,
    error: null,
  },
  activeConnections: {
    list: [],
    loading: false,
    error: null,
  },
  selectedRequest: null,
  filters: {
    status: 'all',
    type: 'all', // sent, received
    search: '',
  },
  creating: false,
  responding: false,
  updating: false,
};

const mentorshipSlice = createSlice({
  name: 'mentorship',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedRequest: (state, action) => {
      state.selectedRequest = action.payload;
    },
    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
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
      // Create Request
      .addCase(createMentorshipRequest.pending, (state) => {
        state.creating = true;
      })
      .addCase(createMentorshipRequest.fulfilled, (state, action) => {
        state.creating = false;
        const request = action.payload?.request || action.payload;
        if (request) {
          state.myRequests.sent.unshift(request);
          state.myRequests.totalCount += 1;
        }
      })
      .addCase(createMentorshipRequest.rejected, (state) => {
        state.creating = false;
      })
      
      // Fetch My Requests
      .addCase(fetchMyRequests.pending, (state) => {
        if (!state.myRequests) {
          state.myRequests = { sent: [], received: [], totalCount: 0, loading: false, error: null };
        }
        state.myRequests.loading = true;
        state.myRequests.error = null;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        if (!state.myRequests) {
          state.myRequests = { sent: [], received: [], totalCount: 0, loading: false, error: null };
        }
        state.myRequests.loading = false;
        state.myRequests.sent = action.payload.sent || [];
        state.myRequests.received = action.payload.received || [];
        state.myRequests.totalCount = action.payload.totalCount || 0;
        state.myRequests.error = null;
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        if (!state.myRequests) {
          state.myRequests = { sent: [], received: [], totalCount: 0, loading: false, error: null };
        }
        state.myRequests.loading = false;
        state.myRequests.error = action.payload;
      })
      
      // Fetch Pending Requests
      .addCase(fetchPendingRequests.pending, (state) => {
        state.pendingRequests.loading = true;
        state.pendingRequests.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests.loading = false;
        state.pendingRequests.list = action.payload?.requests || action.payload || [];
        state.pendingRequests.error = null;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.pendingRequests.loading = false;
        state.pendingRequests.error = action.payload;
      })
      
      // Respond to Request
      .addCase(respondToRequest.pending, (state) => {
        state.responding = true;
      })
      .addCase(respondToRequest.fulfilled, (state, action) => {
        state.responding = false;
        const updatedRequest = action.payload?.request || action.payload;
        
        if (!updatedRequest) return;
        
        // Update in pending requests
        const pendingIndex = state.pendingRequests.list.findIndex(
          req => req._id === updatedRequest._id
        );
        if (pendingIndex !== -1) {
          state.pendingRequests.list[pendingIndex] = updatedRequest;
        }
        
        // Update in my requests
        const receivedIndex = state.myRequests.received.findIndex(
          req => req._id === updatedRequest._id
        );
        if (receivedIndex !== -1) {
          state.myRequests.received[receivedIndex] = updatedRequest;
        }
        
        // Update selected request
        if (state.selectedRequest && state.selectedRequest._id === updatedRequest._id) {
          state.selectedRequest = updatedRequest;
        }
      })
      .addCase(respondToRequest.rejected, (state) => {
        state.responding = false;
      })
      
      // Update Status
      .addCase(updateRequestStatus.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.updating = false;
        const updatedRequest = action.payload?.request || action.payload;
        
        if (!updatedRequest) return;
        
        // Update in sent requests
        const sentIndex = state.myRequests.sent.findIndex(
          req => req._id === updatedRequest._id
        );
        if (sentIndex !== -1) {
          state.myRequests.sent[sentIndex] = updatedRequest;
        }
        
        // Update in received requests
        const receivedIndex = state.myRequests.received.findIndex(
          req => req._id === updatedRequest._id
        );
        if (receivedIndex !== -1) {
          state.myRequests.received[receivedIndex] = updatedRequest;
        }
        
        // Update selected request
        if (state.selectedRequest && state.selectedRequest._id === updatedRequest._id) {
          state.selectedRequest = updatedRequest;
        }
      })
      .addCase(updateRequestStatus.rejected, (state) => {
        state.updating = false;
      })
      
      // Add Meeting
      .addCase(addMeeting.fulfilled, (state, action) => {
        const { requestId, meeting } = action.payload;
        
        // Update request with new meeting
        const updateRequestWithMeeting = (request) => {
          if (request._id === requestId) {
            return {
              ...request,
              meetings: [...(request.meetings || []), meeting.meeting]
            };
          }
          return request;
        };
        
        state.myRequests.sent = state.myRequests.sent.map(updateRequestWithMeeting);
        state.myRequests.received = state.myRequests.received.map(updateRequestWithMeeting);
        
        if (state.selectedRequest && state.selectedRequest._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            meetings: [...(state.selectedRequest.meetings || []), meeting.meeting]
          };
        }
      })
      
      // Submit Feedback
      .addCase(submitFeedback.fulfilled, (state, action) => {
        const { requestId, feedback } = action.payload;
        
        // Update request with new feedback
        const updateRequestWithFeedback = (request) => {
          if (request._id === requestId) {
            return {
              ...request,
              feedback: [...(request.feedback || []), feedback.feedback]
            };
          }
          return request;
        };
        
        state.myRequests.sent = state.myRequests.sent.map(updateRequestWithFeedback);
        state.myRequests.received = state.myRequests.received.map(updateRequestWithFeedback);
        
        if (state.selectedRequest && state.selectedRequest._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            feedback: [...(state.selectedRequest.feedback || []), feedback.feedback]
          };
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setSelectedRequest,
  clearSelectedRequest,
  clearError,
} = mentorshipSlice.actions;

export default mentorshipSlice.reducer;
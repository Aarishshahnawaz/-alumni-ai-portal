import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import alumniSlice from './slices/alumniSlice';
import jobSlice from './slices/jobSlice';
import mentorshipSlice from './slices/mentorshipSlice';
import adminSlice from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    alumni: alumniSlice,
    jobs: jobSlice,
    mentorship: mentorshipSlice,
    admin: adminSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});
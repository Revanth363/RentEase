import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// Configure Redux Store
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Load persisted auth state from localStorage
const loadPersistedAuth = () => {
  try {
    const serializedAuth = localStorage.getItem('authState');
    if (serializedAuth) {
      return JSON.parse(serializedAuth);
    }
  } catch (err) {
    console.error('Failed to load auth state:', err);
  }
  return { user: null, token: null };
};

// Save auth state to localStorage
const persistAuth = (state) => {
  try {
    const serializedAuth = JSON.stringify({
      user: state.user,
      token: state.token,
    });
    localStorage.setItem('authState', serializedAuth);
  } catch (err) {
    console.error('Failed to persist auth state:', err);
  }
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ userType, email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/login', {
        userType,
        email,
        password,
      }, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        const userData = {
          email,
          userType,
          redirectUrl: response.data.redirectUrl,
          rememberMe,
        };
        return userData;
      } else {
        return rejectWithValue(response.data.error || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Network error. Please try again.'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/register', formData, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.error || 'Registration failed');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Network error. Please try again.'
      );
    }
  }
);

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post('/forgot-password', 
        { email },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return { email, otp: response.data.otp, message: response.data.message };
      } else {
        return rejectWithValue(response.data.error || 'Failed to send OTP');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Network error. Please try again.'
      );
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/verify-otp',
        { email, otp },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.error || 'Invalid OTP');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Network error. Please try again.'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/reset-password',
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.error || 'Failed to reset password');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Network error. Please try again.'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/logout', {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

const persistedAuth = loadPersistedAuth();

const initialState = {
  user: persistedAuth.user,
  token: persistedAuth.token,
  isAuthenticated: !!persistedAuth.user,
  loading: false,
  error: null,
  success: null,
  otpSent: false,
  otpVerified: false,
  resetEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = null;
      state.otpSent = false;
      state.otpVerified = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      persistAuth(state);
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.success = 'Login successful!';
        if (action.payload.rememberMe) {
          persistAuth(state);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Registration successful! Please login.';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.resetEmail = action.payload.email;
        state.success = action.payload.message || 'OTP sent successfully!';
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.otpSent = false;
      })

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpVerified = true;
        state.success = 'OTP verified successfully!';
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.otpVerified = false;
      })

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Password reset successful!';
        state.otpSent = false;
        state.otpVerified = false;
        state.resetEmail = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('authState');
      });
  },
});

export const { clearError, clearSuccess, resetAuthState, setUser } = authSlice.actions;
export default authSlice.reducer;

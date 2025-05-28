import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ============ ASYNC THUNKS (API Calls) ============

// Login Thunk
// Login thunk – don't expect token
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    const res = await fetch("/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return rejectWithValue(data.error || "Login failed");
    }

    // After login → fetch current user
    const meRes = await fetch("/api/me", { credentials: "include" });
    if (!meRes.ok) throw new Error("Failed to get user");

    const meData = await meRes.json();

    return {
      user: meData.user,
      redirectUrl: data.redirectUrl,
    };
  }
);

// Signup/Register Thunk
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || 'Registration failed' };
      }

      if (res.ok && data.success) {
        // Store token in localStorage for persistence
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('user', JSON.stringify(data.user || userData));
        localStorage.setItem('isAuthenticated', 'true');

        return {
          user: data.user || userData,
          token: data.token,
          redirectUrl: data.redirectUrl || '/login',
        };
      } else {
        return rejectWithValue(data.error || 'Registration failed');
      }
    } catch (error) {
      return rejectWithValue('Network error. Please check if the server is running on port 5000.');
    }
  }
);

// Logout Thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

// ============ INITIAL STATE ============
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    isAuthenticated,
    loading: false,
    error: null,
    redirectUrl: null,
  };
};

// ============ AUTH SLICE ============
const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    // Clear error messages
    clearError: (state) => {
      state.error = null;
    },
    // Clear redirect URL after navigation
    clearRedirectUrl: (state) => {
      state.redirectUrl = null;
    },
    // Reset auth state
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.redirectUrl = null;
    },
  },
  extraReducers: (builder) => {
    // ===== LOGIN =====
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.redirectUrl = action.payload.redirectUrl;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

    // ===== SIGNUP =====
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.redirectUrl = action.payload.redirectUrl;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

    // ===== LOGOUT =====
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.redirectUrl = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearError, clearRedirectUrl, resetAuthState } = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectRedirectUrl = (state) => state.auth.redirectUrl;

// Export reducer
export default authSlice.reducer;

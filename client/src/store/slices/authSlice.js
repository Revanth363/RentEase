import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ============ ASYNC THUNKS ============

// Login Thunk
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
      token: data.token || null,
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
      // inform server so cookie is cleared
      await fetch('/api/logout', { method: 'GET', credentials: 'include' });

      // clear any persisted state locally
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      return null;
    } catch (error) {
      // even if server call fails, still clear client state
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      } catch (_e) {}
      return rejectWithValue('Logout failed');
    }
  }
);

// Check Current User (restore session on page load / after login)
export const checkCurrentUser = createAsyncThunk(
  "auth/checkCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
      });

      if (!res.ok) {
        return rejectWithValue("No active session");
      }

      const data = await res.json();
      return {
        user: data.user || null,
      };
    } catch (err) {
      return rejectWithValue("Failed to check current user");
    }
  }
);

// ============ INITIAL STATE ============
// NOTE: we deliberately read from localStorage so that a page refresh
// doesn't briefly show unauthenticated UI before the session check runs.
// however, stale values can cause a flash ('Hi, Platform') when the
// token has expired or was cleared by logout. checkCurrentUser will always
// clear localStorage on failure, ensuring the problem doesn't recur.
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    isAuthenticated,
    loading: true,          // start in loading so header doesn't flash stale data
    error: null,
    redirectUrl: null,
  };
};

// ============ AUTH SLICE ============
const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRedirectUrl: (state) => {
      state.redirectUrl = null;
    },
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
        state.token = action.payload.token || null;
        state.redirectUrl = action.payload.redirectUrl;
        state.error = null;

        // keep a copy in localStorage so a page refresh doesn't show
        // "logged out" until the checkCurrentUser thunk completes
        try {
          if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
          }
          if (state.token) {
            localStorage.setItem('token', state.token);
          }
          localStorage.setItem('isAuthenticated', 'true');
        } catch (_err) {
          // ignore
        }
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

        // signup thunk already persisted but we double check here
        try {
          if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
          }
          if (state.token) {
            localStorage.setItem('token', state.token);
          }
          localStorage.setItem('isAuthenticated', 'true');
        } catch (_err) {}
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

    // ===== LOGOUT =====
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        // immediately clear persistent data so UI flips fast
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
        } catch (_err) {}
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.redirectUrl = null;
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
        } catch (_err) {}
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // ===== CHECK CURRENT USER =====
      .addCase(checkCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload.user;
        state.user = action.payload.user || null;
        state.error = null;

        // persist again in case cookie was restored
        try {
          if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
          }
          localStorage.setItem('isAuthenticated', state.isAuthenticated ? 'true' : 'false');
        } catch (_err) {}
      })
      .addCase(checkCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || "Session check failed";

        // remove anything left in localStorage so we don't rehydrate stale user
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
        } catch (_err) {}
      });
  },
});

// Export actions
export const { clearError, clearRedirectUrl, resetAuthState } = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectUserType = (state) => state.auth.user?.userType;
export const selectIsSuperAdmin = (state) => state.auth.user?.isSuperAdmin === true;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectRedirectUrl = (state) => state.auth.redirectUrl;

// Export reducer
export default authSlice.reducer;
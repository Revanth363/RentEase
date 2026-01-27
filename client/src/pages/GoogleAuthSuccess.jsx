import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from '../services/axiosConfig';
import { checkCurrentUser } from "../store/slices/authSlice";

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      try {
        // Get token from URL (passed by backend redirect)
        const token = searchParams.get('token');
        console.log('[GoogleAuthSuccess] Token from redirect:', token ? 'exists' : 'missing');

        if (token) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('isAuthenticated', 'true');

          // Set token in axios headers for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('[GoogleAuthSuccess] Token stored and set in axios headers');

          // Dispatch checkCurrentUser to update Redux auth state
          // This will fetch user data and update the header
          try {
            const result = await dispatch(checkCurrentUser());
            console.log('[GoogleAuthSuccess] Auth state updated:', result.payload);

            if (result.payload) {
              // Redirect to appropriate dashboard based on userType
              const userType = result.payload.userType || 'tenant';
              const redirectMap = {
                admin: '/admin',
                superadmin: '/superadmin/overview',
                tenant: '/dashboard',
                owner: '/owner-dashboard',
                worker: '/worker-dashboard'
              };
              const redirectPath = redirectMap[userType] || '/dashboard';
              
              console.log('[GoogleAuthSuccess] Redirecting to:', redirectPath);
              setTimeout(() => navigate(redirectPath), 500);
            } else {
              console.error('[GoogleAuthSuccess] Failed to get user from checkCurrentUser');
              setTimeout(() => navigate('/'), 1000);
            }
          } catch (err) {
            console.error('[GoogleAuthSuccess] checkCurrentUser failed:', err);
            // Even if fetch fails, user has token so redirect to home
            setTimeout(() => navigate('/'), 1000);
          }
        } else {
          console.error('[GoogleAuthSuccess] No token in redirect');
          setTimeout(() => navigate('/login?error=No token received'), 1000);
        }
      } catch (err) {
        console.error('[GoogleAuthSuccess] Error:', err);
        setTimeout(() => navigate('/login?error=Auth failed'), 1000);
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Completing Google Sign-In...</h2>
      <p>Please wait while we verify your account.</p>
    </div>
  );
}

import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from '../services/axiosConfig';

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

          // Fetch user data to confirm login and get userType for redirection
          try {
            // Pass token directly in request headers (more reliable than global defaults)
            const meRes = await axios.get('/me', { 
              headers: {
                'Authorization': `Bearer ${token}`
              },
              withCredentials: true 
            });
            console.log('[GoogleAuthSuccess] User fetched:', meRes.data.user);

            if (meRes.data.user) {
              localStorage.setItem('user', JSON.stringify(meRes.data.user));
              
              // Redirect to appropriate dashboard based on userType
              const userType = meRes.data.user.userType || 'tenant';
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
            }
          } catch (err) {
            console.error('[GoogleAuthSuccess] Failed to fetch user:', err);
            // Token exists but user fetch failed, redirect to home
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

import React from 'react';

// Simple AuthContext stub used by components that expect authentication context.
// Replace with your full implementation if you have one.
export const AuthContext = React.createContext({ auth: null, setAuth: () => {} });

export function AuthProvider({ children }) {
  const [auth, setAuth] = React.useState(null);
  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

import React from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [auth, setAuth] = React.useState(null);
  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

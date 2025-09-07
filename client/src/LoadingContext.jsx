// client/src/LoadingContext.jsx
import { useState } from 'react';
import LoadingContext from './context/LoadingContext';

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
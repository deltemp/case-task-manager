'use client';

import { ReactNode } from 'react';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
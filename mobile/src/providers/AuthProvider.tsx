import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useAuthState } from '../hooks/useAuth';
import { queryClient } from '../lib/queryClient';

type AuthStateApi = ReturnType<typeof useAuthState>;

const AuthContext = createContext<AuthStateApi | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const state = useAuthState();

  const value = useMemo<AuthStateApi>(() => ({
    ...state,
    login(nextAuth) {
      queryClient.clear();
      state.login(nextAuth);
    },
    logout() {
      queryClient.clear();
      state.logout();
    }
  }), [state]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

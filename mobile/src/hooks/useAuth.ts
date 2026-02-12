import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'moneta.auth.state';

interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  sessionId: string;
}

async function persistAuth(auth: AuthState | null): Promise<void> {
  if (!auth) {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function useAuthState() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(AUTH_STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as AuthState;
        if (parsed.accessToken && parsed.refreshToken && parsed.userId && parsed.sessionId) {
          setAuth(parsed);
        }
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []);

  useEffect(() => {
    if (bootstrapping) {
      return;
    }

    persistAuth(auth).catch(() => undefined);
  }, [auth, bootstrapping]);

  const actions = useMemo(() => ({
    login(nextAuth: AuthState) {
      setAuth(nextAuth);
    },
    updateTokens(nextTokens: { accessToken: string; refreshToken: string; sessionId: string }) {
      setAuth((current) => {
        if (!current) {
          return null;
        }

        return {
          ...current,
          accessToken: nextTokens.accessToken,
          refreshToken: nextTokens.refreshToken,
          sessionId: nextTokens.sessionId
        };
      });
    },
    logout() {
      setAuth(null);
    }
  }), []);

  return { auth, bootstrapping, ...actions };
}

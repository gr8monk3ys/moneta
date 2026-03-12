import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'moneta.auth.state';

interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  sessionId: string;
}

function readWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return globalThis.localStorage;
}

async function getStoredAuth(): Promise<string | null> {
  const storage = readWebStorage();
  if (storage) {
    try {
      return storage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(AUTH_STORAGE_KEY);
}

async function setStoredAuth(value: string): Promise<void> {
  const storage = readWebStorage();
  if (storage) {
    storage.setItem(AUTH_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value);
}

async function clearStoredAuth(): Promise<void> {
  const storage = readWebStorage();
  if (storage) {
    storage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}

async function persistAuth(auth: AuthState | null): Promise<void> {
  if (!auth) {
    await clearStoredAuth();
    return;
  }

  await setStoredAuth(JSON.stringify(auth));
}

export function useAuthState() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    getStoredAuth()
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

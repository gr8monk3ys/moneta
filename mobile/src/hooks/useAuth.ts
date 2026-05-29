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
    // Web has no secure keystore; tokens live in localStorage and are therefore
    // readable by any script running in the page (XSS). This is the standard Expo
    // web limitation — treat web sessions as lower-trust accordingly.
    storage.setItem(AUTH_STORAGE_KEY, value);
    return;
  }

  // Keep credentials on-device only (no iCloud Keychain sync / encrypted backups)
  // and require the device to be unlocked to read them.
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
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

        let parsed: AuthState | null = null;
        try {
          parsed = JSON.parse(raw) as AuthState;
        } catch {
          // Corrupted stored credentials would otherwise throw on every launch and
          // never recover. Drop them and start unauthenticated.
          void clearStoredAuth();
          return;
        }

        if (parsed.accessToken && parsed.refreshToken && parsed.userId && parsed.sessionId) {
          setAuth(parsed);
        } else {
          void clearStoredAuth();
        }
      })
      .catch(() => undefined)
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

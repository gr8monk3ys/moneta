import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthState } from '../src/hooks/useAuth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

describe('useAuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates persisted auth and updates tokens', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify({
      accessToken: 'a1',
      refreshToken: 'r1',
      userId: 'u1',
      sessionId: 's1'
    }));

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.bootstrapping).toBe(false);
    });

    expect(result.current.auth?.userId).toBe('u1');

    act(() => {
      result.current.updateTokens({ accessToken: 'a2', refreshToken: 'r2', sessionId: 's2' });
    });

    expect(result.current.auth).toMatchObject({
      accessToken: 'a2',
      refreshToken: 'r2',
      sessionId: 's2',
      userId: 'u1'
    });
  });

  it('logs in then logs out and clears storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.bootstrapping).toBe(false);
    });

    act(() => {
      result.current.login({
        accessToken: 'ax',
        refreshToken: 'rx',
        userId: 'ux',
        sessionId: 'sx'
      });
    });

    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });
});

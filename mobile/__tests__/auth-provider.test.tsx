import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { queryClient } from '../src/lib/queryClient';

const mockState = {
  auth: null as null | { accessToken: string; refreshToken: string; userId: string; sessionId: string },
  bootstrapping: false,
  login: jest.fn(),
  updateTokens: jest.fn(),
  logout: jest.fn()
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuthState: () => mockState
}));

function AuthConsumer() {
  const auth = useAuth();
  return (
    <>
      <Pressable
        onPress={() => auth.login({
          accessToken: 'a',
          refreshToken: 'r',
          userId: 'u1',
          sessionId: 's1'
        })}
      >
        <Text>Login Action</Text>
      </Pressable>
      <Pressable onPress={() => auth.logout()}>
        <Text>Logout Action</Text>
      </Pressable>
    </>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when useAuth is used outside the provider', () => {
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
  });

  it('clears cached queries before login and logout', () => {
    const clearSpy = jest.spyOn(queryClient, 'clear');
    const screen = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.press(screen.getByText('Login Action'));
    fireEvent.press(screen.getByText('Logout Action'));

    expect(clearSpy).toHaveBeenCalledTimes(2);
    expect(mockState.login).toHaveBeenCalledWith({
      accessToken: 'a',
      refreshToken: 'r',
      userId: 'u1',
      sessionId: 's1'
    });
    expect(mockState.logout).toHaveBeenCalled();
  });
});

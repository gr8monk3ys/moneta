import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from '../src/navigation/AuthNavigator';

const mockUseAuth = jest.fn();

jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../src/screens/LoginScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    LoginScreen: ({ onForgotPassword }: { onForgotPassword: (email: string) => void }) => (
      <View>
        <Text>Login Mock</Text>
        <Pressable onPress={() => onForgotPassword('reset@example.com')}>
          <Text>Forgot Password</Text>
        </Pressable>
      </View>
    )
  };
});

jest.mock('../src/screens/PasswordResetRequestScreen', () => {
  const { Text } = require('react-native');
  return {
    PasswordResetRequestScreen: () => <Text>Password Reset Request Mock</Text>
  };
});

jest.mock('../src/screens/PasswordResetConfirmScreen', () => {
  const { Text } = require('react-native');
  return {
    PasswordResetConfirmScreen: () => <Text>Password Reset Confirm Mock</Text>
  };
});

describe('AuthNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ login: jest.fn() });
  });

  it('navigates from login to password reset request', async () => {
    const screen = render(
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText('Login Mock')).toBeTruthy();

    fireEvent.press(screen.getByText('Forgot Password'));

    await waitFor(() => {
      expect(screen.getByText('Password Reset Request Mock')).toBeTruthy();
    });
  });
});

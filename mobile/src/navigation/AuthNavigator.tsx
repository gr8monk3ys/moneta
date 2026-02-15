import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PasswordResetConfirmScreen } from '../screens/PasswordResetConfirmScreen';
import { PasswordResetRequestScreen } from '../screens/PasswordResetRequestScreen';
import { useAuth } from '../providers/AuthProvider';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type LoginRouteProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function LoginRoute(props: LoginRouteProps) {
  const auth = useAuth();
  return (
    <LoginScreen
      onAuthenticated={auth.login}
      onForgotPassword={(email) => props.navigation.navigate('PasswordResetRequest', { email })}
    />
  );
}

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="PasswordResetRequest" component={PasswordResetRequestScreen} />
      <Stack.Screen name="PasswordResetConfirm" component={PasswordResetConfirmScreen} />
    </Stack.Navigator>
  );
}

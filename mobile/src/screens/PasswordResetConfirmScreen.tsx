import { useReducer } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { confirmPasswordReset } from '../lib/api';
import { font, surface, theme } from '../lib/theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PasswordResetConfirm'>;

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function PasswordResetConfirmScreen(props: Props) {
  const initialEmail = props.route.params?.email ?? '';
  const [state, setState] = useReducer((
    previous: {
      email: string;
      code: string;
      newPassword: string;
      status: string | null;
      error: string | null;
      loading: boolean;
    },
    patch: Partial<{
      email: string;
      code: string;
      newPassword: string;
      status: string | null;
      error: string | null;
      loading: boolean;
    }>
  ) => ({ ...previous, ...patch }), {
    email: initialEmail,
    code: '',
    newPassword: '',
    status: null,
    error: null,
    loading: false
  });

  async function resetPassword() {
    setState({ loading: true, error: null, status: null });

    try {
      await confirmPasswordReset({ email: state.email, code: state.code, newPassword: state.newPassword });
      setState({ status: 'Password updated. You can sign in now.' });
    } catch (reason) {
      setState({ error: formatError(reason) });
    } finally {
      setState({ loading: false });
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => props.navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Enter Reset Code</Text>
      <Text style={styles.subtitle}>Paste the 8-digit code from your email and choose a new password.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        accessibilityLabel="Email"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        spellCheck={false}
        textContentType="emailAddress"
        value={state.email}
        onChangeText={(email) => setState({ email })}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
      />

      <Text style={styles.label}>8-digit code</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="8-digit code"
        autoComplete="one-time-code"
        autoCorrect={false}
        keyboardType="number-pad"
        maxLength={8}
        textContentType="oneTimeCode"
        value={state.code}
        onChangeText={(code) => setState({ code })}
        placeholder="8-digit code"
        placeholderTextColor={theme.textMuted}
      />

      <Text style={styles.label}>New password</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="New password"
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        secureTextEntry
        textContentType="newPassword"
        value={state.newPassword}
        onChangeText={(newPassword) => setState({ newPassword })}
        placeholder="New password"
        placeholderTextColor={theme.textMuted}
      />

      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      {state.status ? <Text style={styles.status}>{state.status}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={resetPassword} disabled={state.loading}>
        <Text style={styles.primaryText}>{state.loading ? 'Updating…' : 'Reset Password'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => props.navigation.popToTop()} disabled={state.loading}>
        <Text style={styles.secondaryText}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center', gap: 12 },
  backLink: { color: theme.textMuted, textDecorationLine: 'underline', marginBottom: 8 },
  title: { fontFamily: font.display, color: theme.textPrimary, fontSize: 26, fontWeight: '700' },
  subtitle: { color: theme.textSecondary, marginBottom: 12, lineHeight: 20 },
  label: { color: theme.textPrimary, fontWeight: '600' },
  input: surface.input,
  error: { color: theme.danger },
  status: { color: theme.success },
  primaryButton: { ...surface.buttonPrimary, marginTop: 8 },
  primaryText: { textAlign: 'center', color: theme.onAccent, fontWeight: '700' },
  secondaryButton: surface.buttonSecondary,
  secondaryText: { textAlign: 'center', color: theme.textPrimary, fontWeight: '700' }
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { confirmPasswordReset } from '../lib/api';
import { theme } from '../lib/theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PasswordResetConfirm'>;

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function PasswordResetConfirmScreen(props: Props) {
  const initialEmail = props.route.params?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      await confirmPasswordReset({ email, code, newPassword });
      setStatus('Password updated. You can sign in now.');
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => props.navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Enter Reset Code</Text>
      <Text style={styles.subtitle}>Paste the 8-digit code from your email and choose a new password.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
      />

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        placeholder="8-digit code"
        placeholderTextColor={theme.textMuted}
      />

      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        placeholderTextColor={theme.textMuted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={resetPassword} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Updating…' : 'Reset Password'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => props.navigation.popToTop()} disabled={loading}>
        <Text style={styles.secondaryText}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center', gap: 12 },
  backLink: { color: theme.textMuted, textDecorationLine: 'underline', marginBottom: 8 },
  title: { color: theme.textPrimary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: theme.textMuted, marginBottom: 12 },
  input: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f3440',
    color: theme.textPrimary,
    padding: 12
  },
  error: { color: theme.danger },
  status: { color: theme.success },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, padding: 14, marginTop: 8 },
  primaryText: { textAlign: 'center', color: '#1a1d24', fontWeight: '700' },
  secondaryButton: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2f3440' },
  secondaryText: { textAlign: 'center', color: theme.textPrimary, fontWeight: '700' }
});


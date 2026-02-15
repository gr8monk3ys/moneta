import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { requestPasswordReset } from '../lib/api';
import { theme } from '../lib/theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PasswordResetRequest'>;

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function PasswordResetRequestScreen(props: Props) {
  const initialEmail = props.route.params?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      await requestPasswordReset({ email });
      setStatus('If an account exists for this email, we sent an 8-digit reset code.');
      props.navigation.navigate('PasswordResetConfirm', { email });
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

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>We’ll email you an 8-digit code.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={sendCode} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send Reset Code'}</Text>
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
  status: { color: theme.textMuted },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, padding: 14, marginTop: 8 },
  primaryText: { textAlign: 'center', color: '#1a1d24', fontWeight: '700' }
});


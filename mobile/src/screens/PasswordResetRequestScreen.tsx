import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { requestPasswordReset } from '../lib/api';
import { font, surface, theme } from '../lib/theme';
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
      <Text style={styles.subtitle}>We’ll email you an 8-digit code so you can create a new password.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="Email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        spellCheck={false}
        textContentType="emailAddress"
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
  title: { fontFamily: font.display, color: theme.textPrimary, fontSize: 26, fontWeight: '700' },
  subtitle: { color: theme.textSecondary, marginBottom: 12, lineHeight: 20 },
  label: { color: theme.textPrimary, fontWeight: '600' },
  input: surface.input,
  error: { color: theme.danger },
  status: { color: theme.textMuted },
  primaryButton: { ...surface.buttonPrimary, marginTop: 8 },
  primaryText: { textAlign: 'center', color: theme.onAccent, fontWeight: '700' }
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login, register } from '../lib/api';
import { theme } from '../lib/theme';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  sessionId: string;
}

export function LoginScreen(props: { onAuthenticated: (auth: AuthResult) => void }) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(null);

    try {
      const result = await login({ email, password });
      if (!result.userId) {
        throw new Error('Login response did not include a userId');
      }

      props.onAuthenticated({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        userId: result.userId,
        sessionId: result.sessionId
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function quickCreateDemo() {
    setLoading(true);
    setError(null);

    try {
      await register({ userId: 'demo-user', email, password });
      await signIn();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💰 Moneta</Text>
      <Text style={styles.title}>Duolingo for Finance</Text>
      <Text style={styles.subtitle}>5 minutes today. Better money decisions tomorrow.</Text>

      <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={theme.textMuted} />
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={theme.textMuted} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={signIn} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Loading…' : 'Start Learning'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={quickCreateDemo} disabled={loading}>
        <Text style={styles.secondaryText}>Create Demo User</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center', gap: 12 },
  logo: { color: theme.accent, fontSize: 28, fontWeight: '700' },
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
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, padding: 14, marginTop: 8 },
  primaryText: { textAlign: 'center', color: '#1a1d24', fontWeight: '700' },
  secondaryButton: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2f3440' },
  secondaryText: { textAlign: 'center', color: theme.textPrimary, fontWeight: '600' }
});

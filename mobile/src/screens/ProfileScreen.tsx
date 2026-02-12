import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { logout, logoutAll, type AuthContext } from '../lib/api';
import { theme } from '../lib/theme';

interface ProfileProps {
  onLogout: () => void;
  userId: string;
  auth: AuthContext;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function ProfileScreen(props: ProfileProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function signOutCurrentSession() {
    try {
      await logout(props.auth.refreshToken);
      props.onLogout();
    } catch (error) {
      setMessage(formatError(error));
    }
  }

  async function signOutEverywhere() {
    try {
      await logoutAll(props.auth);
      props.onLogout();
    } catch (error) {
      setMessage(formatError(error));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>👤 {props.userId}</Text>
      <Text style={styles.description}>Your account is connected to live backend endpoints.</Text>

      <Pressable style={styles.button} onPress={signOutCurrentSession}>
        <Text style={styles.buttonText}>Sign out this device</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={signOutEverywhere}>
        <Text style={styles.secondaryText}>Sign out all devices</Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16, gap: 12 },
  name: { color: theme.textPrimary, fontSize: 20, fontWeight: '700' },
  description: { color: theme.textMuted },
  button: { backgroundColor: theme.card, borderColor: '#2f3440', borderWidth: 1, borderRadius: 12, padding: 12 },
  buttonText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' },
  secondaryButton: { borderColor: theme.accent, borderWidth: 1, borderRadius: 12, padding: 12 },
  secondaryText: { color: theme.accent, textAlign: 'center', fontWeight: '700' },
  message: { color: theme.danger }
});

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchEntitlement, logout, logoutAll, syncEntitlement, type AuthContext, type Entitlement } from '../lib/api';
import { disconnectStoreBilling, restoreLatestSubscription } from '../lib/storeBilling';
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
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setLoadingEntitlement(true);
    fetchEntitlement(props.userId, props.auth)
      .then((response) => {
        setEntitlement(response.entitlement);
      })
      .catch((error: unknown) => {
        setMessage(formatError(error));
      })
      .finally(() => {
        setLoadingEntitlement(false);
      });

    return () => {
      disconnectStoreBilling().catch(() => undefined);
    };
  }, [props.auth, props.userId]);

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

  async function restorePurchase() {
    try {
      setRestoring(true);
      setMessage(null);

      const restoredPurchase = await restoreLatestSubscription();
      if (!restoredPurchase) {
        setMessage('No active subscription was found to restore.');
        return;
      }

      const response = await syncEntitlement(props.auth, {
        platform: restoredPurchase.platform,
        productId: restoredPurchase.productId,
        purchaseToken: restoredPurchase.purchaseToken
      });

      setEntitlement(response.entitlement);
      if (response.entitlement.plan === 'pro') {
        setMessage(restoredPurchase.sandbox ? 'Pro access restored (sandbox).' : 'Pro access restored.');
      } else {
        setMessage('Subscription restored, but no active Pro entitlement was found.');
      }
    } catch (error) {
      setMessage(formatError(error));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>👤 {props.userId}</Text>
      <Text style={styles.description}>Your account is connected to live backend endpoints.</Text>
      <Text style={styles.plan}>
        Plan: {loadingEntitlement ? 'Loading…' : entitlement?.plan === 'pro' ? 'Pro' : 'Free'}
      </Text>
      {!loadingEntitlement && entitlement?.plan !== 'pro' ? (
        <Pressable style={styles.button} onPress={restorePurchase} disabled={restoring}>
          <Text style={styles.buttonText}>{restoring ? 'Restoring…' : 'Restore Pro Access'}</Text>
        </Pressable>
      ) : null}

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
  plan: { color: theme.accent, fontWeight: '600' },
  button: { backgroundColor: theme.card, borderColor: '#2f3440', borderWidth: 1, borderRadius: 12, padding: 12 },
  buttonText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' },
  secondaryButton: { borderColor: theme.accent, borderWidth: 1, borderRadius: 12, padding: 12 },
  secondaryText: { color: theme.accent, textAlign: 'center', fontWeight: '700' },
  message: { color: theme.danger }
});

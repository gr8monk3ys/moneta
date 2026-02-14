import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAccount as deleteAccountApi,
  exportAccountData,
  fetchEntitlement,
  logout,
  logoutAll,
  syncEntitlement,
  type AuthContext,
  type Entitlement,
  type EntitlementResponse
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { openLegalDoc, type LegalDocKey } from '../lib/legal';
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
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  useEffect(() => {
    return () => {
      disconnectStoreBilling().catch(() => undefined);
    };
  }, []);

  const entitlementQuery = useQuery<EntitlementResponse>({
    queryKey: queryKeys.entitlement(props.userId),
    queryFn: () => fetchEntitlement(props.userId, props.auth)
  });

  const entitlement: Entitlement | null = entitlementQuery.data?.entitlement ?? null;
  const loadingEntitlement = entitlementQuery.isPending;
  const visibleMessage = message ?? (entitlementQuery.error ? formatError(entitlementQuery.error) : null);

  async function signOutCurrentSession() {
    try {
      setDeleteArmed(false);
      await logout(props.auth.refreshToken);
      props.onLogout();
    } catch (error) {
      setMessage(formatError(error));
    }
  }

  async function signOutEverywhere() {
    try {
      setDeleteArmed(false);
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
      setDeleteArmed(false);

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

      queryClient.setQueryData(queryKeys.entitlement(props.userId), response);
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

  async function handleOpenLegal(doc: LegalDocKey) {
    try {
      setMessage(null);
      const result = await openLegalDoc(doc);
      if (!result.opened) {
        setMessage(result.error ?? 'Unable to open legal document.');
      }
    } catch (error) {
      setMessage(formatError(error));
    }
  }

  async function exportAccountSnapshot() {
    try {
      setExporting(true);
      setMessage(null);
      setDeleteArmed(false);

      const snapshot = await exportAccountData(props.auth);
      setMessage(
        `Export ready: ${snapshot.sessions.total} sessions, ${snapshot.billing.webhookEventsProcessed} billing events.`
      );
    } catch (error) {
      setMessage(formatError(error));
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage('Tap "Delete Account" again to confirm permanent deletion.');
      return;
    }

    try {
      setDeleting(true);
      setMessage(null);
      await deleteAccountApi(props.auth);
      setMessage('Account deleted.');
      props.onLogout();
    } catch (error) {
      setMessage(formatError(error));
    } finally {
      setDeleting(false);
      setDeleteArmed(false);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <Pressable style={styles.secondaryButton} onPress={() => handleOpenLegal('privacy')}>
          <Text style={styles.secondaryText}>Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => handleOpenLegal('terms')}>
          <Text style={styles.secondaryText}>Terms of Service</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => handleOpenLegal('subscription')}>
          <Text style={styles.secondaryText}>Subscription Terms</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => handleOpenLegal('disclaimer')}>
          <Text style={styles.secondaryText}>Financial Education Disclaimer</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => handleOpenLegal('deletion')}>
          <Text style={styles.secondaryText}>Account Deletion Policy</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Educational only. Not financial advice.</Text>
      </View>

      <Pressable style={styles.button} onPress={signOutCurrentSession}>
        <Text style={styles.buttonText}>Sign out this device</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={signOutEverywhere}>
        <Text style={styles.secondaryText}>Sign out all devices</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={exportAccountSnapshot} disabled={exporting}>
        <Text style={styles.secondaryText}>{exporting ? 'Exporting…' : 'Export Account Data'}</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={deleteAccount} disabled={deleting}>
        <Text style={styles.dangerText}>{deleting ? 'Deleting…' : 'Delete Account'}</Text>
      </Pressable>

      {visibleMessage ? <Text style={styles.message}>{visibleMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16, gap: 12 },
  name: { color: theme.textPrimary, fontSize: 20, fontWeight: '700' },
  description: { color: theme.textMuted },
  plan: { color: theme.accent, fontWeight: '600' },
  section: { gap: 10, paddingTop: 6 },
  sectionTitle: { color: theme.textPrimary, fontWeight: '700' },
  button: { backgroundColor: theme.card, borderColor: '#2f3440', borderWidth: 1, borderRadius: 12, padding: 12 },
  buttonText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' },
  secondaryButton: { borderColor: theme.accent, borderWidth: 1, borderRadius: 12, padding: 12 },
  secondaryText: { color: theme.accent, textAlign: 'center', fontWeight: '700' },
  dangerButton: { borderColor: theme.danger, borderWidth: 1, borderRadius: 12, padding: 12 },
  dangerText: { color: theme.danger, textAlign: 'center', fontWeight: '700' },
  message: { color: theme.danger },
  disclaimer: { color: theme.textMuted, textAlign: 'center', fontSize: 12 }
});

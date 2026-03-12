import { useEffect, useReducer } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type MessageTone = 'neutral' | 'success' | 'error';

export function ProfileScreen(props: ProfileProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useReducer((
    previous: {
      message: { text: string; tone: MessageTone } | null;
      restoring: boolean;
      exporting: boolean;
      deleting: boolean;
      showDeleteModal: boolean;
    },
    patch: Partial<{
      message: { text: string; tone: MessageTone } | null;
      restoring: boolean;
      exporting: boolean;
      deleting: boolean;
      showDeleteModal: boolean;
    }>
  ) => ({ ...previous, ...patch }), {
    message: null,
    restoring: false,
    exporting: false,
    deleting: false,
    showDeleteModal: false
  });

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
  const visibleMessage = state.message ?? (entitlementQuery.error
    ? { text: formatError(entitlementQuery.error), tone: 'error' as const }
    : null);
  const memberIdSuffix = props.userId.slice(-8);

  function showMessage(text: string, tone: MessageTone) {
    setState({ message: { text, tone } });
  }

  async function signOutCurrentSession() {
    try {
      setState({ showDeleteModal: false });
      await logout(props.auth.refreshToken);
      props.onLogout();
    } catch (error) {
      showMessage(formatError(error), 'error');
    }
  }

  async function signOutEverywhere() {
    try {
      setState({ showDeleteModal: false });
      await logoutAll(props.auth);
      props.onLogout();
    } catch (error) {
      showMessage(formatError(error), 'error');
    }
  }

  async function restorePurchase() {
    try {
      setState({ restoring: true, message: null, showDeleteModal: false });

      const restoredPurchase = await restoreLatestSubscription();
      if (!restoredPurchase) {
        showMessage('No active subscription was found to restore.', 'neutral');
        return;
      }

      const response = await syncEntitlement(props.auth, {
        platform: restoredPurchase.platform,
        productId: restoredPurchase.productId,
        purchaseToken: restoredPurchase.purchaseToken
      });

      queryClient.setQueryData(queryKeys.entitlement(props.userId), response);
      if (response.entitlement.plan === 'pro') {
        showMessage(restoredPurchase.sandbox ? 'Pro access restored (sandbox).' : 'Pro access restored.', 'success');
      } else {
        showMessage('Subscription restored, but no active Pro entitlement was found.', 'neutral');
      }
    } catch (error) {
      showMessage(formatError(error), 'error');
    } finally {
      setState({ restoring: false });
    }
  }

  async function handleOpenLegal(doc: LegalDocKey) {
    try {
      setState({ message: null });
      const result = await openLegalDoc(doc);
      if (!result.opened) {
        showMessage(result.error ?? 'Unable to open legal document.', 'error');
      }
    } catch (error) {
      showMessage(formatError(error), 'error');
    }
  }

  async function exportAccountSnapshot() {
    try {
      setState({ exporting: true, message: null, showDeleteModal: false });

      const snapshot = await exportAccountData(props.auth);
      showMessage(`Export ready: ${snapshot.sessions.total} sessions, ${snapshot.billing.webhookEventsProcessed} billing events.`, 'success');
    } catch (error) {
      showMessage(formatError(error), 'error');
    } finally {
      setState({ exporting: false });
    }
  }

  async function confirmDeleteAccount() {
    try {
      setState({ deleting: true, message: null });
      await deleteAccountApi(props.auth);
      setState({ showDeleteModal: false });
      props.onLogout();
    } catch (error) {
      showMessage(formatError(error), 'error');
    } finally {
      setState({ deleting: false });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>Your Account</Text>
      <Text style={styles.description}>Manage your plan, privacy links, and account data export.</Text>
      <Text style={styles.memberId}>Member ID ending in {memberIdSuffix}</Text>
      <Text style={styles.plan}>
        Plan: {loadingEntitlement ? 'Loading…' : entitlement?.plan === 'pro' ? 'Pro' : 'Free'}
      </Text>
      {!loadingEntitlement && entitlement?.plan !== 'pro' ? (
        <Pressable style={styles.button} onPress={restorePurchase} disabled={state.restoring}>
          <Text style={styles.buttonText}>{state.restoring ? 'Restoring…' : 'Restore Subscription'}</Text>
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

      <Pressable style={styles.secondaryButton} onPress={exportAccountSnapshot} disabled={state.exporting}>
        <Text style={styles.secondaryText}>{state.exporting ? 'Exporting…' : 'Export Account Data'}</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={() => setState({ showDeleteModal: true })} disabled={state.deleting}>
        <Text style={styles.dangerText}>Delete Account</Text>
      </Pressable>

      {visibleMessage ? (
        <Text
          style={[
            styles.message,
            visibleMessage.tone === 'success' ? styles.successMessage : null,
            visibleMessage.tone === 'error' ? styles.errorMessage : null
          ]}
        >
          {visibleMessage.text}
        </Text>
      ) : null}

      <Modal
        transparent
        animationType="fade"
        visible={state.showDeleteModal}
        onRequestClose={() => {
          if (!state.deleting) {
            setState({ showDeleteModal: false });
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account?</Text>
            <Text style={styles.modalBody}>This permanently removes your progress, billing history, and active sessions.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.paywallSecondaryButton} onPress={() => setState({ showDeleteModal: false })} disabled={state.deleting}>
                <Text style={styles.paywallSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDangerButton} onPress={confirmDeleteAccount} disabled={state.deleting}>
                <Text style={styles.modalDangerText}>{state.deleting ? 'Deleting…' : 'Confirm Deletion'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  name: { color: theme.textPrimary, fontSize: 20, fontWeight: '700' },
  description: { color: theme.textMuted },
  memberId: { color: theme.textMuted, fontSize: 12 },
  plan: { color: theme.accent, fontWeight: '600' },
  section: { gap: 10, paddingTop: 6 },
  sectionTitle: { color: theme.textPrimary, fontWeight: '700' },
  button: { backgroundColor: theme.card, borderColor: '#2f3440', borderWidth: 1, borderRadius: 12, padding: 12 },
  buttonText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' },
  secondaryButton: { borderColor: theme.accent, borderWidth: 1, borderRadius: 12, padding: 12 },
  secondaryText: { color: theme.accent, textAlign: 'center', fontWeight: '700' },
  dangerButton: { borderColor: theme.danger, borderWidth: 1, borderRadius: 12, padding: 12 },
  dangerText: { color: theme.danger, textAlign: 'center', fontWeight: '700' },
  message: { textAlign: 'center' },
  successMessage: { color: theme.success },
  errorMessage: { color: theme.danger },
  disclaimer: { color: theme.textMuted, textAlign: 'center', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(7, 9, 13, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: theme.card, borderRadius: 18, padding: 18, gap: 12, borderWidth: 1, borderColor: '#2f3440' },
  modalTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
  modalBody: { color: theme.textMuted, lineHeight: 20 },
  modalActions: { gap: 10 },
  modalDangerButton: { backgroundColor: theme.danger, borderRadius: 12, padding: 12 },
  modalDangerText: { color: '#1a1d24', textAlign: 'center', fontWeight: '700' },
  paywallSecondaryButton: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2f3440' },
  paywallSecondaryText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' }
});

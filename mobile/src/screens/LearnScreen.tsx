import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchToday, syncEntitlement, type AuthContext } from '../lib/api';
import { theme } from '../lib/theme';

interface LearnScreenProps {
  userId: string;
  auth: AuthContext;
}

const path = ['Money Basics', 'Credit & Debt', 'Saving Safety', 'Investing Basics', 'Retirement', 'Taxes'];

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function LearnScreen(props: LearnScreenProps) {
  const [nextLesson, setNextLesson] = useState<string | null>(null);
  const [advancedTracksUnlocked, setAdvancedTracksUnlocked] = useState(false);
  const [planLabel, setPlanLabel] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = await fetchToday(props.userId, props.auth);
      setNextLesson(today.nextLesson?.title ?? null);
      setAdvancedTracksUnlocked(today.features.advancedTracks);
      setPlanLabel(today.entitlement.plan === 'pro' ? 'Pro' : 'Free');
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [props.auth, props.userId]);

  useEffect(() => {
    loadToday().catch(() => undefined);
  }, [loadToday]);

  async function upgradeToPro() {
    setStatus(null);
    setLoading(true);

    try {
      await syncEntitlement(props.auth, {
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: `sandbox-${Date.now()}`,
        isActive: true,
        currentPeriodEndsAt: new Date(Date.now() + 30 * 86_400_000).toISOString()
      });
      setStatus('Moneta Pro unlocked');
      await loadToday();
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learning Path</Text>
      <Text style={styles.plan}>Plan: {planLabel}</Text>
      {loading ? <ActivityIndicator color={theme.accent} /> : null}
      {nextLesson ? <Text style={styles.subtitle}>Up next: {nextLesson}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.success}>{status}</Text> : null}

      {!advancedTracksUnlocked ? (
        <View style={styles.paywall}>
          <Text style={styles.paywallTitle}>Unlock Pro to access advanced tracks</Text>
          <Text style={styles.paywallBody}>Includes investing, retirement, and certificates.</Text>
          <Pressable style={styles.paywallButton} onPress={upgradeToPro} disabled={loading}>
            <Text style={styles.paywallButtonText}>Upgrade to Pro</Text>
          </Pressable>
        </View>
      ) : null}

      {path.map((item, index) => {
        const locked = !advancedTracksUnlocked && index >= 3;
        return (
          <View key={item} style={[styles.node, index === 0 && styles.activeNode, locked && styles.lockedNode]}>
            <Text style={[styles.nodeText, index === 0 && styles.activeNodeText, locked && styles.lockedNodeText]}>
              {index + 1}. {item}{locked ? ' (Pro)' : ''}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 10 },
  title: { color: theme.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  plan: { color: theme.textMuted, marginBottom: 4 },
  subtitle: { color: theme.textMuted },
  error: { color: theme.danger },
  success: { color: theme.success },
  paywall: { borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.cardElevated, borderRadius: 14, padding: 14, gap: 8 },
  paywallTitle: { color: theme.textPrimary, fontWeight: '700' },
  paywallBody: { color: theme.textMuted },
  paywallButton: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  paywallButtonText: { color: '#1a1d24', textAlign: 'center', fontWeight: '700' },
  node: { backgroundColor: theme.card, borderRadius: 14, padding: 14 },
  activeNode: { borderColor: theme.accent, borderWidth: 1, backgroundColor: '#2d2620' },
  lockedNode: { opacity: 0.65 },
  nodeText: { color: theme.textPrimary, fontWeight: '600' },
  activeNodeText: { color: theme.accent },
  lockedNodeText: { color: theme.textMuted }
});

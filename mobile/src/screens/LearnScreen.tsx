import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchLearningPath, fetchToday, syncEntitlement, type AuthContext, type PathLesson } from '../lib/api';
import { disconnectStoreBilling, listSubscriptionProducts, purchasePrimarySubscription } from '../lib/storeBilling';
import { theme } from '../lib/theme';

interface LearnScreenProps {
  userId: string;
  auth: AuthContext;
  onOpenLesson: (lessonId: string) => void;
  refreshNonce?: number;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function LearnScreen(props: LearnScreenProps) {
  const [nextLesson, setNextLesson] = useState<string | null>(null);
  const [advancedTracksUnlocked, setAdvancedTracksUnlocked] = useState(false);
  const [planLabel, setPlanLabel] = useState('Free');
  const [priceLabel, setPriceLabel] = useState<string | null>(null);
  const [lessons, setLessons] = useState<PathLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [today, path] = await Promise.all([
        fetchToday(props.userId, props.auth),
        fetchLearningPath(props.userId, props.auth)
      ]);
      setNextLesson(today.nextLesson?.title ?? null);
      setAdvancedTracksUnlocked(today.features.advancedTracks);
      setPlanLabel(today.entitlement.plan === 'pro' ? 'Pro' : 'Free');
      setLessons(path.lessons);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [props.auth, props.userId]);

  const loadCatalog = useCallback(async () => {
    try {
      const products = await listSubscriptionProducts();
      setPriceLabel(products[0]?.displayPrice ?? null);
    } catch (reason) {
      setError(formatError(reason));
    }
  }, []);

  useEffect(() => {
    loadToday().catch(() => undefined);
    loadCatalog().catch(() => undefined);

    return () => {
      disconnectStoreBilling().catch(() => undefined);
    };
  }, [loadCatalog, loadToday, props.refreshNonce]);

  async function upgradeToPro() {
    setStatus(null);
    setError(null);
    setLoading(true);

    try {
      const purchase = await purchasePrimarySubscription(props.userId);
      await syncEntitlement(props.auth, {
        platform: purchase.platform,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken
      });
      setStatus(purchase.sandbox ? 'Moneta Pro unlocked in sandbox mode.' : 'Moneta Pro unlocked.');
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
          <Text style={styles.paywallBody}>
            Includes investing, retirement, and certificates.
            {priceLabel ? ` Current plan: ${priceLabel}.` : ''}
          </Text>
          <Pressable style={styles.paywallButton} onPress={upgradeToPro} disabled={loading}>
            <Text style={styles.paywallButtonText}>Upgrade to Pro</Text>
          </Pressable>
        </View>
      ) : null}

      {lessons.length === 0 ? (
        <Text style={styles.subtitle}>No lessons published yet.</Text>
      ) : lessons.map((lesson, index) => {
        const locked = lesson.locked;
        const completed = lesson.completed;
        return (
          <Pressable
            key={lesson.lessonId}
            style={[styles.node, index === 0 && styles.activeNode, locked && styles.lockedNode, completed && styles.completedNode]}
            onPress={() => {
              if (locked) {
                setError('Upgrade to Pro to access this lesson.');
                return;
              }
              props.onOpenLesson(lesson.lessonId);
            }}
          >
            <Text style={[styles.nodeText, index === 0 && styles.activeNodeText, locked && styles.lockedNodeText]}>
              {index + 1}. {completed ? '✓ ' : ''}{lesson.title}{locked ? ' (Pro)' : ''}
            </Text>
            <Text style={styles.nodeMeta}>{lesson.level} • {lesson.track} • {lesson.estimatedMinutes} min</Text>
          </Pressable>
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
  completedNode: { borderWidth: 1, borderColor: theme.success },
  lockedNode: { opacity: 0.65 },
  nodeText: { color: theme.textPrimary, fontWeight: '600' },
  nodeMeta: { color: theme.textMuted, marginTop: 4, fontSize: 12 },
  activeNodeText: { color: theme.accent },
  lockedNodeText: { color: theme.textMuted }
});

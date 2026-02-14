import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLearningPath, fetchToday, syncEntitlement, type AuthContext, type PathLesson } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { disconnectStoreBilling, listSubscriptionProducts, purchasePrimarySubscription } from '../lib/storeBilling';
import { theme } from '../lib/theme';

interface LearnScreenProps {
  userId: string;
  auth: AuthContext;
  onOpenLesson: (lessonId: string) => void;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function LearnScreen(props: LearnScreenProps) {
  const queryClient = useQueryClient();
  const [priceLabel, setPriceLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const todayQuery = useQuery({
    queryKey: queryKeys.today(props.userId),
    queryFn: () => fetchToday(props.userId, props.auth)
  });

  const pathQuery = useQuery({
    queryKey: queryKeys.learningPath(props.userId),
    queryFn: () => fetchLearningPath(props.userId, props.auth)
  });

  const loadCatalog = useCallback(async () => {
    try {
      const products = await listSubscriptionProducts();
      setPriceLabel(products[0]?.displayPrice ?? null);
    } catch (reason) {
      setError(formatError(reason));
    }
  }, []);

  useEffect(() => {
    loadCatalog().catch(() => undefined);

    return () => {
      disconnectStoreBilling().catch(() => undefined);
    };
  }, [loadCatalog]);

  async function upgradeToPro() {
    setStatus(null);
    setError(null);

    try {
      const purchase = await purchasePrimarySubscription(props.userId);
      await syncEntitlement(props.auth, {
        platform: purchase.platform,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken
      });
      setStatus(purchase.sandbox ? 'Moneta Pro unlocked in sandbox mode.' : 'Moneta Pro unlocked.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.today(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(props.userId) })
      ]);
    } catch (reason) {
      setError(formatError(reason));
    }
  }

  const today = todayQuery.data;
  const path = pathQuery.data;
  const lessons: PathLesson[] = path?.lessons ?? [];
  const nextLesson = today?.nextLesson?.title ?? null;
  const advancedTracksUnlocked = Boolean(today?.features?.advancedTracks);
  const planLabel = today?.entitlement?.plan === 'pro' ? 'Pro' : 'Free';
  const loading = todayQuery.isPending || pathQuery.isPending;

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

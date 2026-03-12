import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLearningPath, fetchToday, syncEntitlement, type AuthContext, type PathLesson } from '../lib/api';
import { formatTrackLabel, getLevelMeta } from '../lib/learningMetadata';
import { openLegalDoc, type LegalDocKey } from '../lib/legal';
import { queryKeys } from '../lib/queryKeys';
import { disconnectStoreBilling, listSubscriptionProducts, purchasePrimarySubscription, restoreLatestSubscription } from '../lib/storeBilling';
import { theme } from '../lib/theme';

interface LearnScreenProps {
  userId: string;
  auth: AuthContext;
  onOpenLesson: (lessonId: string) => void;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

interface LessonSection {
  level: string;
  title: string;
  description: string;
  data: PathLesson[];
}

interface LessonRowProps {
  item: PathLesson;
  nextLessonId: string | null;
  onLocked: (message: string) => void;
  onOpenLesson: (lessonId: string) => void;
}

function LessonRow(props: LessonRowProps) {
  const { item, nextLessonId, onLocked, onOpenLesson } = props;
  const locked = item.locked;
  const completed = item.completed;
  const isNext = item.lessonId === nextLessonId;
  const statusLabel = completed ? 'Completed' : locked ? 'Pro' : isNext ? 'Up Next' : formatTrackLabel(item.track, item.premium);

  return (
    <Pressable
      style={[styles.node, isNext && styles.activeNode, locked && styles.lockedNode, completed && styles.completedNode]}
      onPress={() => {
        if (locked) {
          onLocked('Unlock Pro to open this lesson.');
          return;
        }
        onOpenLesson(item.lessonId);
      }}
    >
      <View style={styles.nodeTopRow}>
        <Text style={[styles.nodeText, isNext && styles.activeNodeText, locked && styles.lockedNodeText]}>
          {item.title}
        </Text>
        <View style={[styles.pill, completed && styles.completedPill, locked && styles.lockedPill, isNext && styles.activePill]}>
          <Text style={[styles.pillText, completed && styles.completedPillText, locked && styles.lockedPillText, isNext && styles.activePillText]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.nodeMeta}>{item.estimatedMinutes} min • {formatTrackLabel(item.track, item.premium)}</Text>
    </Pressable>
  );
}

export function LearnScreen(props: LearnScreenProps) {
  const queryClient = useQueryClient();
  const [priceLabel, setPriceLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

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

  async function handleOpenLegal(doc: LegalDocKey) {
    const result = await openLegalDoc(doc);
    if (!result.opened && result.error) {
      setError(result.error);
    }
  }

  async function openManageSubscriptions() {
    setStatus(null);
    setError(null);

    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setError('This device cannot open subscription settings.');
      return;
    }

    await Linking.openURL(url);
  }

  async function upgradeToPro() {
    setStatus(null);
    setError(null);

    try {
      setBillingBusy(true);
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
    } finally {
      setBillingBusy(false);
    }
  }

  async function restorePurchases() {
    setStatus(null);
    setError(null);

    try {
      setBillingBusy(true);
      const restored = await restoreLatestSubscription();
      if (!restored) {
        setStatus('No active subscription was found to restore.');
        return;
      }

      await syncEntitlement(props.auth, {
        platform: restored.platform,
        productId: restored.productId,
        purchaseToken: restored.purchaseToken
      });
      setStatus(restored.sandbox ? 'Moneta Pro restored (sandbox mode).' : 'Moneta Pro restored.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.today(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(props.userId) })
      ]);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBillingBusy(false);
    }
  }

  const today = todayQuery.data;
  const path = pathQuery.data;
  const nextLesson = today?.nextLesson?.title ?? null;
  const nextLessonId = today?.nextLesson?.lessonId ?? null;
  const advancedTracksUnlocked = Boolean(today?.features?.advancedTracks);
  const planLabel = today?.entitlement?.plan === 'pro' ? 'Pro' : 'Free';
  const loading = billingBusy || todayQuery.isPending || pathQuery.isPending;
  const priceCopy = priceLabel === 'Sandbox'
    ? 'Sandbox billing is enabled in this build.'
    : priceLabel
      ? `Plans start at ${priceLabel}.`
      : 'Pricing appears in your store checkout.';
  const sections = useMemo<LessonSection[]>(() => {
    const lessons: PathLesson[] = path?.lessons ?? [];
    const levelOrder = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
    const grouped = new Map<string, PathLesson[]>();

    for (const lesson of lessons) {
      const existing = grouped.get(lesson.level) ?? [];
      existing.push(lesson);
      grouped.set(lesson.level, existing);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => {
        const leftIndex = levelOrder.indexOf(left);
        const rightIndex = levelOrder.indexOf(right);
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
          - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
      })
      .map(([level, data]) => {
        const meta = getLevelMeta(level);
        return {
          level,
          title: meta.title,
          description: meta.description,
          data
        };
      });
  }, [path?.lessons]);
  const renderLesson = useCallback(({ item }: { item: PathLesson }) => (
    <LessonRow
      item={item}
      nextLessonId={nextLessonId}
      onLocked={setError}
      onOpenLesson={props.onOpenLesson}
    />
  ), [nextLessonId, props.onOpenLesson]);

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.lessonId}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={(
        <View style={styles.header}>
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
                Unlock investing, retirement, and full review access. {priceCopy}
              </Text>
              <Text style={styles.paywallFinePrint}>
                Auto-renewing subscription. Cancel anytime in your App Store / Google Play settings.
              </Text>
              <View style={styles.paywallLinks}>
                <Pressable onPress={() => handleOpenLegal('subscription')}>
                  <Text style={styles.paywallLink}>Subscription Terms</Text>
                </Pressable>
                <Text style={styles.paywallLinkDivider}>•</Text>
                <Pressable onPress={() => handleOpenLegal('privacy')}>
                  <Text style={styles.paywallLink}>Privacy</Text>
                </Pressable>
                <Text style={styles.paywallLinkDivider}>•</Text>
                <Pressable onPress={() => handleOpenLegal('terms')}>
                  <Text style={styles.paywallLink}>Terms</Text>
                </Pressable>
              </View>
              <Pressable style={styles.paywallButton} onPress={upgradeToPro} disabled={loading}>
                <Text style={styles.paywallButtonText}>Upgrade to Pro</Text>
              </Pressable>
              <Pressable style={styles.paywallSecondaryButton} onPress={restorePurchases} disabled={loading}>
                <Text style={styles.paywallSecondaryText}>Restore Purchases</Text>
              </Pressable>
              <Pressable style={styles.paywallSecondaryButton} onPress={openManageSubscriptions} disabled={loading}>
                <Text style={styles.paywallSecondaryText}>Manage Subscription</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.subtitle}>No lessons published yet.</Text>}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>{section.level}</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>
        </View>
      )}
      renderItem={renderLesson}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 10, marginBottom: 8 },
  title: { color: theme.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  plan: { color: theme.textMuted, marginBottom: 4 },
  subtitle: { color: theme.textMuted },
  error: { color: theme.danger },
  success: { color: theme.success },
  paywall: { borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.cardElevated, borderRadius: 14, padding: 14, gap: 8 },
  paywallTitle: { color: theme.textPrimary, fontWeight: '700' },
  paywallBody: { color: theme.textMuted },
  paywallFinePrint: { color: theme.textMuted, fontSize: 12 },
  paywallLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  paywallLink: { color: theme.textMuted, textDecorationLine: 'underline', fontSize: 12 },
  paywallLinkDivider: { color: theme.textMuted, fontSize: 12 },
  paywallButton: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  paywallButtonText: { color: '#1a1d24', textAlign: 'center', fontWeight: '700' },
  paywallSecondaryButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2f3440' },
  paywallSecondaryText: { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' },
  sectionHeader: { marginTop: 16, marginBottom: 10, gap: 4 },
  sectionEyebrow: { color: theme.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  sectionTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
  sectionDescription: { color: theme.textMuted },
  node: { backgroundColor: theme.card, borderRadius: 14, padding: 14 },
  activeNode: { borderColor: theme.accent, borderWidth: 1, backgroundColor: '#2d2620' },
  completedNode: { borderWidth: 1, borderColor: theme.success },
  lockedNode: { opacity: 0.65 },
  nodeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  nodeText: { color: theme.textPrimary, fontWeight: '600' },
  nodeMeta: { color: theme.textMuted, marginTop: 4, fontSize: 12 },
  activeNodeText: { color: theme.accent },
  lockedNodeText: { color: theme.textMuted },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#1f2430' },
  pillText: { color: theme.textMuted, fontSize: 11, fontWeight: '700' },
  activePill: { backgroundColor: '#3a3026' },
  activePillText: { color: theme.accent },
  completedPill: { backgroundColor: '#143021' },
  completedPillText: { color: theme.success },
  lockedPill: { backgroundColor: '#242933' },
  lockedPillText: { color: theme.textMuted }
});

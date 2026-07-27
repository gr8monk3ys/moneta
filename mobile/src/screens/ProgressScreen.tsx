import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchProgress, type AuthContext } from '../lib/api';
import { getLevelMeta } from '../lib/learningMetadata';
import { queryKeys } from '../lib/queryKeys';
import { font, surface, theme } from '../lib/theme';

interface ProgressScreenProps {
  userId: string;
  auth: AuthContext;
}

interface ProgressViewModel {
  level: string;
  skills: string;
  mastery: string;
  streak: string;
  plan: string;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function ProgressScreen(props: ProgressScreenProps) {
  const progressQuery = useQuery({
    queryKey: queryKeys.progress(props.userId),
    queryFn: () => fetchProgress(props.userId, props.auth)
  });

  if (progressQuery.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!progressQuery.data) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{progressQuery.error ? formatError(progressQuery.error) : 'Unable to load progress'}</Text>
      </View>
    );
  }

  const progress = progressQuery.data;
  const levelMeta = getLevelMeta(progress.currentLevel);
  const masteryValue = progress.totalSkills === 0 ? 0 : Math.round((progress.masteredSkills / progress.totalSkills) * 100);
  const hasStarted = progress.totalSkills > 0;
  const viewModel: ProgressViewModel = {
    level: levelMeta.title,
    skills: hasStarted ? `${progress.masteredSkills}/${progress.totalSkills}` : 'Ready',
    mastery: hasStarted ? `${masteryValue}%` : 'Start',
    streak: `${progress.streakDays}`,
    plan: progress.plan === 'pro' && progress.premiumActive ? 'Pro' : 'Free'
  };

  return (
    <View style={styles.container}>
      <View style={styles.ringCard}>
        <Text style={styles.level}>{viewModel.level}</Text>
        <Text style={styles.plan}>Plan: {viewModel.plan}</Text>
        <Text style={styles.subtitle}>
          {hasStarted ? levelMeta.description : 'Complete your first lesson to unlock progress stats.'}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>{viewModel.skills}</Text><Text style={styles.statLabel}>{hasStarted ? 'Concepts' : 'First Lesson'}</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{viewModel.mastery}</Text><Text style={styles.statLabel}>Mastery</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{viewModel.streak}</Text><Text style={styles.statLabel}>Streak</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16, gap: 14 },
  loadingContainer: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  error: { color: theme.danger, textAlign: 'center' },
  ringCard: { ...surface.cardElevated, padding: 24, alignItems: 'center' },
  level: { fontFamily: font.display, color: theme.accent, fontSize: 38, lineHeight: 46, fontWeight: '700', textAlign: 'center' },
  plan: { color: theme.textPrimary, fontWeight: '700', marginTop: 4 },
  subtitle: { color: theme.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { ...surface.card, flex: 1, padding: 14, alignItems: 'center' },
  statValue: { fontFamily: font.display, color: theme.textPrimary, fontWeight: '700', fontSize: 20 },
  statLabel: { color: theme.textMuted, marginTop: 4, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }
});

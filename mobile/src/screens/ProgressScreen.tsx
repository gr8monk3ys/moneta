import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fetchProgress, type AuthContext } from '../lib/api';
import { theme } from '../lib/theme';

interface ProgressScreenProps {
  userId: string;
  auth: AuthContext;
}

interface ProgressViewModel {
  level: string;
  skills: string;
  mastery: string;
  streak: string;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function ProgressScreen(props: ProgressScreenProps) {
  const [viewModel, setViewModel] = useState<ProgressViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress(props.userId, props.auth)
      .then((progress) => {
        const masteryValue = progress.totalSkills === 0 ? 0 : Math.round((progress.masteredSkills / progress.totalSkills) * 100);
        setViewModel({
          level: progress.currentLevel,
          skills: `${progress.masteredSkills}/${progress.totalSkills}`,
          mastery: `${masteryValue}%`,
          streak: `${progress.streakDays}`
        });
      })
      .catch((reason) => {
        setError(formatError(reason));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.auth, props.userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!viewModel) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error ?? 'Unable to load progress'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ringCard}>
        <Text style={styles.level}>{viewModel.level}</Text>
        <Text style={styles.subtitle}>Everyday Decision-Making</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>{viewModel.skills}</Text><Text style={styles.statLabel}>Skills</Text></View>
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
  ringCard: { backgroundColor: theme.cardElevated, borderRadius: 18, padding: 24, alignItems: 'center' },
  level: { color: theme.accent, fontSize: 40, fontWeight: '800' },
  subtitle: { color: theme.textMuted, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { color: theme.textPrimary, fontWeight: '800', fontSize: 18 },
  statLabel: { color: theme.textMuted, marginTop: 4 }
});

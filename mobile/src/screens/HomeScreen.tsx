import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { completeSession, fetchLessonDetails, fetchProgress, fetchToday, refresh, submitPlacement, type AuthContext } from '../lib/api';
import { theme } from '../lib/theme';

interface HomeProps {
  userId: string;
  auth: AuthContext;
}

interface DashboardState {
  progress: string;
  reviews: string[];
  streak: string;
  nextLesson: string;
  nextLessonId?: string;
  planBadge: string;
  dueLimitNote: string | null;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function HomeScreen(props: HomeProps) {
  const [dashboard, setDashboard] = useState<DashboardState>({
    progress: 'Loading progress…',
    reviews: [],
    streak: '—',
    nextLesson: 'Loading lesson…',
    nextLessonId: undefined,
    planBadge: 'Free',
    dueLimitNote: null
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [progress, today] = await Promise.all([
        fetchProgress(props.userId, props.auth),
        fetchToday(props.userId, props.auth)
      ]);

      setDashboard({
        progress: `Level ${progress.currentLevel} • ${progress.masteredSkills}/${progress.totalSkills} mastered`,
        reviews: today.dueReviews.map((item) => item.skillId),
        streak: `${progress.streakDays}`,
        nextLesson: today.nextLesson?.title ?? 'No lesson available',
        nextLessonId: today.nextLesson?.lessonId,
        planBadge: progress.plan === 'pro' && progress.premiumActive ? 'Pro' : 'Free',
        dueLimitNote: typeof today.features.maxDueReviews === 'number'
          ? `Free plan shows up to ${today.features.maxDueReviews} due reviews/day.`
          : null
      });
    } catch (error) {
      setStatus(formatError(error));
    }
  }, [props.auth, props.userId]);

  useEffect(() => {
    loadDashboard().catch(() => undefined);
  }, [loadDashboard]);

  async function handlePlacement() {
    setLoading(true);
    setStatus(null);

    try {
      const placement = await submitPlacement(props.auth, { correctAnswers: 7, totalQuestions: 10 });
      setStatus(`Placed at ${placement.level}`);
      await loadDashboard();
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handlePractice() {
    setLoading(true);
    setStatus(null);

    try {
      const session = await completeSession(props.auth, [
        { skillId: 'apr-vs-apy', isCorrect: true },
        { skillId: 'basic-budgeting', isCorrect: true }
      ]);
      setStatus(`Session complete • streak ${session.streakDays}`);
      await loadDashboard();
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteNextLessonDemo() {
    setLoading(true);
    setStatus(null);

    try {
      if (!dashboard.nextLessonId) {
        setStatus('No lesson available to complete.');
        return;
      }

      const lesson = await fetchLessonDetails(dashboard.nextLessonId, props.auth);
      const targetCoverage = Math.max(1, Math.ceil(lesson.lesson.items.length * 0.75));
      const simulatedResults = lesson.lesson.items.slice(0, targetCoverage).map((item, index) => ({
        skillId: item.skillId,
        isCorrect: index % 5 !== 0
      }));

      const session = await completeSession(props.auth, simulatedResults, {
        lessonId: lesson.lesson.lessonId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (session.lessonProgress?.completed) {
        setStatus(`Completed lesson: ${lesson.lesson.title}`);
      } else {
        setStatus(`Lesson attempt recorded (${lesson.lesson.title}). Keep practicing to complete.`);
      }

      await loadDashboard();
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setStatus(null);

    try {
      const tokens = await refresh(props.auth.refreshToken);
      props.auth.onTokensUpdated({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: tokens.sessionId
      });
      setStatus('Session refreshed');
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Daily Goal: 10 min</Text>
        <Text style={styles.planBadge}>Plan: {dashboard.planBadge}</Text>
        <Text style={styles.heroSubtitle}>{dashboard.progress}</Text>
        <Text style={styles.heroSubtitle}>Next: {dashboard.nextLesson}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s Reviews</Text>
        {dashboard.reviews.length === 0 ? (
          <Text style={styles.cardLine}>No reviews due.</Text>
        ) : (
          dashboard.reviews.map((review) => <Text key={review} style={styles.cardLine}>• {review}</Text>)
        )}
        {dashboard.dueLimitNote ? <Text style={styles.limitNote}>{dashboard.dueLimitNote}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Streak</Text>
        <Text style={styles.streak}>🔥 {dashboard.streak} days</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={handlePlacement} disabled={loading}>
          <Text style={styles.buttonText}>Run Placement</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handlePractice} disabled={loading}>
          <Text style={styles.buttonText}>Submit Practice Session</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleCompleteNextLessonDemo} disabled={loading}>
          <Text style={styles.buttonText}>Complete Next Lesson (Demo)</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleRefresh} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Refresh Session</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={theme.accent} /> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 14 },
  hero: { backgroundColor: theme.cardElevated, borderRadius: 18, padding: 18, gap: 8 },
  heroTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '700' },
  planBadge: { color: theme.accent, fontWeight: '700' },
  heroSubtitle: { color: theme.textMuted },
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 6 },
  cardTitle: { color: theme.textPrimary, fontWeight: '700' },
  cardLine: { color: theme.textMuted },
  limitNote: { color: theme.accent, fontSize: 12, marginTop: 6 },
  streak: { color: theme.success, fontWeight: '700', fontSize: 18 },
  actions: { gap: 10 },
  button: { backgroundColor: theme.accent, borderRadius: 12, padding: 12 },
  buttonText: { textAlign: 'center', color: '#1a1d24', fontWeight: '700' },
  secondaryButton: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2f3440' },
  secondaryButtonText: { textAlign: 'center', color: theme.textPrimary, fontWeight: '700' },
  status: { color: theme.textMuted, textAlign: 'center' }
});

import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { completeSession, fetchLessonDetails, fetchProgress, fetchToday, refreshSession, submitPlacement, type AuthContext } from '../lib/api';
import { getLevelMeta } from '../lib/learningMetadata';
import { queryKeys } from '../lib/queryKeys';
import { theme } from '../lib/theme';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

interface HomeProps {
  userId: string;
  auth: AuthContext;
  onOpenLesson: (lessonId: string) => void;
  onStartReviews: () => void;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function formatSkillId(skillId: string): string {
  return skillId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getReviewPreview(review: { prompt?: string; skillId: string }): string {
  const prompt = review.prompt?.trim();
  return prompt && prompt.length > 0 ? prompt : formatSkillId(review.skillId);
}

export function HomeScreen(props: HomeProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const progressQuery = useQuery({
    queryKey: queryKeys.progress(props.userId),
    queryFn: () => fetchProgress(props.userId, props.auth)
  });

  const todayQuery = useQuery({
    queryKey: queryKeys.today(props.userId),
    queryFn: () => fetchToday(props.userId, props.auth)
  });

  const progress = progressQuery.data;
  const today = todayQuery.data;
  const levelMeta = getLevelMeta(progress?.currentLevel ?? 'F1');

  const nextLessonId = today?.nextLesson?.lessonId;
  const dueReviews = today?.dueReviews ?? [];
  const practiceReviews = today?.practiceReviews ?? [];
  const planBadge = progress?.plan === 'pro' && progress.premiumActive ? 'Pro' : 'Free';
  const dueLimitNote = today && typeof today.features.maxDueReviews === 'number'
    ? `Free plan shows up to ${today.features.maxDueReviews} due reviews/day.`
    : null;
  const initialLoad = progressQuery.isPending || todayQuery.isPending;
  const loadError = progressQuery.error ?? todayQuery.error;

  async function handleStartNextLesson() {
    setStatus(null);
    setLoading(true);

    try {
      if (!nextLessonId) {
        setStatus('No lesson available to start.');
        return;
      }

      props.onOpenLesson(nextLessonId);
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleStartReviews() {
    setStatus(null);
    setLoading(true);

    try {
      if (dueReviews.length === 0 && practiceReviews.length === 0) {
        setStatus('No reviews available yet. Complete a lesson to generate reviews.');
        return;
      }

      props.onStartReviews();
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handlePlacement() {
    setLoading(true);
    setStatus(null);

    try {
      const placement = await submitPlacement(props.auth, { correctAnswers: 7, totalQuestions: 10 });
      setStatus(`Placed in ${getLevelMeta(placement.level).title}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.today(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(props.userId) })
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.today(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(props.userId) })
      ]);
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
      if (!nextLessonId) {
        setStatus('No lesson available to complete.');
        return;
      }

      const lesson = await fetchLessonDetails(nextLessonId, props.auth);
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.today(props.userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(props.userId) })
      ]);
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
      await refreshSession(props.auth);
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
        <Text style={styles.planBadge}>Plan: {planBadge}</Text>
        <Text style={styles.heroSubtitle}>
          {progress
            ? progress.totalSkills > 0
              ? `${levelMeta.title} • ${progress.masteredSkills} of ${progress.totalSkills} concepts mastered`
              : `${levelMeta.title} • Start your first lesson to unlock progress tracking.`
            : 'Loading progress…'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {today?.nextLesson
            ? `Next ${today.nextLesson.estimatedMinutes} min lesson: ${today.nextLesson.title}`
            : (today ? 'No lesson available right now.' : 'Loading lesson…')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s Reviews</Text>
        {dueReviews.length > 0 ? (
          dueReviews.map((review) => (
            <Text key={review.itemId} style={styles.cardLine} numberOfLines={2}>
              • {getReviewPreview(review)}
            </Text>
          ))
        ) : practiceReviews.length > 0 ? (
          <>
            <Text style={styles.cardLine}>No reviews due yet.</Text>
            <Text style={styles.cardLine}>Practice set available:</Text>
            {practiceReviews.map((review) => (
              <Text key={review.itemId} style={styles.cardLine} numberOfLines={2}>
                • {getReviewPreview(review)}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.cardLine}>Complete a lesson to generate reviews.</Text>
        )}
        {dueLimitNote ? <Text style={styles.limitNote}>{dueLimitNote}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Streak</Text>
        <Text style={styles.streak}>🔥 {progress ? String(progress.streakDays) : '—'} days</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.button}
          onPress={handleStartReviews}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Start Reviews</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleStartNextLesson} disabled={loading}>
          <Text style={styles.buttonText}>Start Next Lesson</Text>
        </Pressable>
        {isDev ? (
          <>
            <Pressable style={styles.button} onPress={handlePlacement} disabled={loading}>
              <Text style={styles.buttonText}>Run Placement (Dev)</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handlePractice} disabled={loading}>
              <Text style={styles.buttonText}>Submit Practice Session (Dev)</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleCompleteNextLessonDemo} disabled={loading}>
              <Text style={styles.buttonText}>Complete Next Lesson (Demo)</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleRefresh} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Refresh Session (Dev)</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {initialLoad || loading ? <ActivityIndicator color={theme.accent} /> : null}
      {!status && loadError ? <Text style={styles.status}>{formatError(loadError)}</Text> : null}
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
  cardLine: { color: theme.textMuted, lineHeight: 20 },
  limitNote: { color: theme.accent, fontSize: 12, marginTop: 6 },
  streak: { color: theme.success, fontWeight: '700', fontSize: 18 },
  actions: { gap: 10 },
  button: { backgroundColor: theme.accent, borderRadius: 12, padding: 12 },
  buttonText: { textAlign: 'center', color: '#1a1d24', fontWeight: '700' },
  secondaryButton: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2f3440' },
  secondaryButtonText: { textAlign: 'center', color: theme.textPrimary, fontWeight: '700' },
  status: { color: theme.textMuted, textAlign: 'center' }
});

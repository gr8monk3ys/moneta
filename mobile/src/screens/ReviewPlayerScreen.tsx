import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeSession, fetchToday, type AuthContext, type SessionItemResult, type TodayResponse } from '../lib/api';
import { theme } from '../lib/theme';

interface ReviewPlayerProps {
  userId: string;
  auth: AuthContext;
  onExit: (updated: boolean) => void;
}

type DueReview = TodayResponse['dueReviews'][number];

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function resolveFormat(item: DueReview): NonNullable<DueReview['format']> {
  return item.format ?? (item.choices && item.choices.length > 0 ? 'mcq' : 'scenario');
}

export function ReviewPlayerScreen(props: ReviewPlayerProps) {
  const [mode, setMode] = useState<'due' | 'practice'>('due');
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [practiceReviews, setPracticeReviews] = useState<DueReview[]>([]);
  const [dueLockedCount, setDueLockedCount] = useState(0);
  const [dueUnavailableCount, setDueUnavailableCount] = useState(0);
  const [practiceLockedCount, setPracticeLockedCount] = useState(0);
  const [practiceUnavailableCount, setPracticeUnavailableCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Awaited<ReturnType<typeof completeSession>> | null>(null);

  const reviews = mode === 'practice' ? practiceReviews : dueReviews;
  const lockedCount = mode === 'practice' ? practiceLockedCount : dueLockedCount;
  const unavailableCount = mode === 'practice' ? practiceUnavailableCount : dueUnavailableCount;
  const title = mode === 'practice' ? 'Practice Reviews' : 'Daily Reviews';

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = await fetchToday(props.userId, props.auth);
      const dueAll = today.dueReviews ?? [];
      const dueLocked = dueAll.filter((item) => item.locked).length;
      const duePlayable = dueAll.filter((item) => !item.locked && item.contentItemId && item.prompt);
      const dueUnavailable = dueAll.length - dueLocked - duePlayable.length;

      const practiceAll = today.practiceReviews ?? [];
      const practiceLocked = practiceAll.filter((item) => item.locked).length;
      const practicePlayable = practiceAll.filter((item) => !item.locked && item.contentItemId && item.prompt);
      const practiceUnavailable = practiceAll.length - practiceLocked - practicePlayable.length;

      setMode('due');
      setDueLockedCount(dueLocked);
      setDueUnavailableCount(dueUnavailable);
      setDueReviews(duePlayable);
      setPracticeLockedCount(practiceLocked);
      setPracticeUnavailableCount(practiceUnavailable);
      setPracticeReviews(practicePlayable);
      setAnswers({});
      setCurrentIndex(0);
      setSubmitted(null);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [props.auth, props.userId]);

  useEffect(() => {
    loadReviews().catch(() => undefined);
  }, [loadReviews]);

  const item = reviews[currentIndex];
  const answeredCount = reviews.filter((entry) => Boolean(answers[String(entry.contentItemId)]?.trim())).length;

  const gradedByItemId = useMemo(() => {
    const graded = submitted?.gradedItems ?? [];
    return new Map(graded.filter((entry) => entry.itemId).map((entry) => [String(entry.itemId), entry] as const));
  }, [submitted]);

  function setAnswer(contentItemId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [contentItemId]: value }));
  }

  function handleStartPractice() {
    setMode('practice');
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(null);
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const missing = reviews.find((entry) => !answers[String(entry.contentItemId)]?.trim());
      if (missing) {
        setError('Answer all reviews before submitting.');
        return;
      }

      const itemResults: SessionItemResult[] = reviews.map((entry) => ({
        itemId: String(entry.contentItemId),
        skillId: entry.skillId,
        answer: String(answers[String(entry.contentItemId)] ?? '')
      }));

      const response = await completeSession(props.auth, itemResults, {
        timeZone: getTimeZone()
      });

      setSubmitted(response);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (error && dueReviews.length === 0 && practiceReviews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (reviews.length === 0) {
    if (mode === 'due' && practiceReviews.length > 0) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>No playable reviews due right now.</Text>
            {dueLockedCount > 0 ? <Text style={styles.heroSubtitle}>{dueLockedCount} reviews locked (Pro).</Text> : null}
            {dueUnavailableCount > 0 ? <Text style={styles.heroSubtitle}>{dueUnavailableCount} reviews missing content.</Text> : null}
            <Text style={styles.heroSubtitle}>Practice set available: {practiceReviews.length} skills.</Text>
          </View>
          <Pressable style={styles.button} onPress={handleStartPractice} disabled={submitting}>
            <Text style={styles.buttonText}>Practice Now</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={submitting}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>
            {mode === 'practice' ? 'No practice reviews available right now.' : 'No playable reviews due right now.'}
          </Text>
          {lockedCount > 0 ? <Text style={styles.heroSubtitle}>{lockedCount} reviews locked (Pro).</Text> : null}
          {unavailableCount > 0 ? <Text style={styles.heroSubtitle}>{unavailableCount} reviews missing content.</Text> : null}
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable style={styles.secondaryButton} onPress={() => props.onExit(true)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={loadReviews} disabled={submitting}>
            <Text style={styles.secondaryButtonText}>Reload</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{mode === 'practice' ? 'Practice Submitted' : 'Reviews Submitted'}</Text>
          <Text style={styles.heroSubtitle}>Streak: {submitted.streakDays} days</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Results</Text>
          {reviews.map((entry, index) => {
            const itemId = String(entry.contentItemId);
            const graded = gradedByItemId.get(itemId);
            const isCorrect = graded?.isCorrect;
            const prefix = typeof isCorrect === 'boolean' ? (isCorrect ? '[OK]' : '[X]') : '-';
            return (
              <View key={itemId} style={styles.resultItem}>
                <Text style={styles.prompt}>{prefix} {index + 1}. {entry.prompt}</Text>
                <Text style={styles.meta}>Skill: {entry.skillId}</Text>
                <Text style={styles.meta}>Your answer: {answers[itemId]}</Text>
                {entry.explanation ? <Text style={styles.explanationBody}>{entry.explanation}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (!item || !item.contentItemId || !item.prompt) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Review item is unavailable.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const contentItemId = String(item.contentItemId);
  const format = resolveFormat(item);
  const currentAnswer = answers[contentItemId] ?? '';
  const canGoNext = Boolean(currentAnswer.trim());
  const isLast = currentIndex >= reviews.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={submitting}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.progress}>{currentIndex + 1}/{reviews.length} • answered {answeredCount}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>Skill: {item.skillId}</Text>
        {lockedCount > 0 ? <Text style={styles.heroSubtitle}>{lockedCount} locked reviews (Pro).</Text> : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Question</Text>
        <Text style={styles.prompt}>{item.prompt}</Text>

        {format === 'mcq' ? (
          <View style={styles.choices}>
            {(item.choices ?? []).map((choice) => {
              const selected = currentAnswer === choice;
              return (
                <Pressable
                  key={choice}
                  style={[styles.choice, selected && styles.choiceSelected]}
                  onPress={() => setAnswer(contentItemId, choice)}
                  disabled={submitting}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            value={currentAnswer}
            onChangeText={(text) => setAnswer(contentItemId, text)}
            placeholder={format === 'numeric' ? 'Type a number…' : 'Type your answer…'}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, format === 'scenario' && styles.inputMultiline]}
            multiline={format === 'scenario'}
            numberOfLines={format === 'scenario' ? 4 : 1}
            keyboardType={format === 'numeric' ? (Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric') : 'default'}
            editable={!submitting}
          />
        )}

        {currentAnswer.trim() && item.explanation ? (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Why it matters</Text>
            <Text style={styles.explanationBody}>{item.explanation}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.secondaryButton, currentIndex === 0 && styles.disabledButton]}
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={submitting || currentIndex === 0}
        >
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </Pressable>

        {!isLast ? (
          <Pressable
            style={[styles.button, (!canGoNext || submitting) && styles.disabledButton]}
            onPress={() => setCurrentIndex((prev) => Math.min(reviews.length - 1, prev + 1))}
            disabled={!canGoNext || submitting}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, (submitting || answeredCount !== reviews.length) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting || answeredCount !== reviews.length}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit Reviews'}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progress: { color: theme.textMuted },
  hero: { backgroundColor: theme.cardElevated, borderRadius: 18, padding: 18, gap: 8 },
  heroTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '800' },
  heroSubtitle: { color: theme.textMuted },
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { color: theme.textPrimary, fontWeight: '800' },
  prompt: { color: theme.textPrimary, fontSize: 16, lineHeight: 22 },
  meta: { color: theme.textMuted, fontSize: 12 },
  choices: { gap: 10 },
  choice: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2f3440', backgroundColor: theme.cardElevated },
  choiceSelected: { borderColor: theme.accent, backgroundColor: '#2d2620' },
  choiceText: { color: theme.textPrimary, fontWeight: '700' },
  choiceTextSelected: { color: theme.accent },
  input: { backgroundColor: theme.cardElevated, borderRadius: 12, padding: 12, color: theme.textPrimary, borderWidth: 1, borderColor: '#2f3440' },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  explanation: { marginTop: 4, backgroundColor: '#141820', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#243043', gap: 6 },
  explanationTitle: { color: theme.accent, fontWeight: '800' },
  explanationBody: { color: theme.textMuted },
  navRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  button: { flex: 1, backgroundColor: theme.accent, borderRadius: 12, padding: 12 },
  buttonText: { textAlign: 'center', color: '#1a1d24', fontWeight: '800' },
  secondaryButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2f3440' },
  secondaryButtonText: { color: theme.textPrimary, fontWeight: '800', textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
  error: { color: theme.danger, textAlign: 'center' },
  resultItem: { marginTop: 12, gap: 6 }
});

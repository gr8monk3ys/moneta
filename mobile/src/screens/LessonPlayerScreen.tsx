import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeSession, fetchLessonDetails, type AuthContext, type LessonDetailsResponse, type SessionItemResult } from '../lib/api';
import { theme } from '../lib/theme';

interface LessonPlayerProps {
  userId: string;
  lessonId: string;
  auth: AuthContext;
  onExit: (updated: boolean) => void;
}

type Lesson = LessonDetailsResponse['lesson'];
type LessonItem = Lesson['items'][number];

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function resolveFormat(item: LessonItem): NonNullable<LessonItem['format']> {
  return item.format ?? (item.choices && item.choices.length > 0 ? 'mcq' : 'scenario');
}

export function LessonPlayerScreen(props: LessonPlayerProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Awaited<ReturnType<typeof completeSession>> | null>(null);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await fetchLessonDetails(props.lessonId, props.auth);
      setLesson(details.lesson);
      setAnswers({});
      setCurrentIndex(0);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [props.auth, props.lessonId]);

  useEffect(() => {
    loadLesson().catch(() => undefined);
  }, [loadLesson]);

  const items = lesson?.items ?? [];
  const item = items[currentIndex];
  const answeredCount = items.filter((entry) => Boolean(answers[entry.itemId]?.trim())).length;

  const gradedByItemId = useMemo(() => {
    const graded = submitted?.gradedItems ?? [];
    return new Map(graded.filter((entry) => entry.itemId).map((entry) => [String(entry.itemId), entry] as const));
  }, [submitted]);

  const completedLabel = submitted?.lessonProgress?.completed ? 'Lesson completed' : 'Lesson submitted';

  function setAnswer(itemId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleSubmit() {
    if (!lesson) {
      return;
    }

    const missing = lesson.items.find((entry) => !answers[entry.itemId]?.trim());
    if (missing) {
      setError('Answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const itemResults: SessionItemResult[] = lesson.items.map((entry) => ({
        itemId: entry.itemId,
        skillId: entry.skillId,
        answer: String(answers[entry.itemId] ?? '')
      }));

      const response = await completeSession(props.auth, itemResults, {
        lessonId: lesson.lessonId,
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

  if (error && !lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load lesson.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable style={styles.secondaryButton} onPress={() => props.onExit(true)}>
            <Text style={styles.secondaryButtonText}>Back to Path</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{completedLabel}</Text>
          <Text style={styles.heroSubtitle}>{lesson.title}</Text>
          {submitted.lessonProgress ? (
            <Text style={styles.heroSubtitle}>
              Score {Math.round(submitted.lessonProgress.score * 100)}% • {submitted.lessonProgress.correctCount}/{submitted.lessonProgress.totalItems} correct • coverage {Math.round(submitted.lessonProgress.coverage * 100)}%
            </Text>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review</Text>
          {lesson.items.map((entry, index) => {
            const graded = gradedByItemId.get(entry.itemId);
            const isCorrect = graded?.isCorrect;
            const prefix = typeof isCorrect === 'boolean' ? (isCorrect ? '[OK]' : '[X]') : '-';
            return (
              <View key={entry.itemId} style={styles.reviewItem}>
                <Text style={styles.reviewPrompt}>{prefix} {index + 1}. {entry.prompt}</Text>
                <Text style={styles.reviewAnswer}>Your answer: {answers[entry.itemId]}</Text>
                {entry.explanation ? <Text style={styles.reviewExplanation}>{entry.explanation}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Lesson has no items.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const format = resolveFormat(item);
  const currentAnswer = answers[item.itemId] ?? '';
  const canGoNext = Boolean(currentAnswer.trim());
  const isLast = currentIndex >= items.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={submitting}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.progress}>{currentIndex + 1}/{items.length} • answered {answeredCount}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{lesson.title}</Text>
        <Text style={styles.heroSubtitle}>{lesson.summary}</Text>
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
                  onPress={() => setAnswer(item.itemId, choice)}
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
            onChangeText={(text) => setAnswer(item.itemId, text)}
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
            onPress={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            disabled={!canGoNext || submitting}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, (submitting || answeredCount !== items.length) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting || answeredCount !== items.length}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit Lesson'}</Text>
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
  reviewItem: { marginTop: 12, gap: 6 },
  reviewPrompt: { color: theme.textPrimary, fontWeight: '700' },
  reviewAnswer: { color: theme.textMuted },
  reviewExplanation: { color: theme.textMuted }
});

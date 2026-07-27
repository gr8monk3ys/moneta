import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeSession, fetchLessonDetails, type AuthContext, type LessonDetailsResponse, type SessionItemResult } from '../lib/api';
import { font, surface, theme } from '../lib/theme';

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
  const [state, setState] = useReducer((
    previous: {
      lesson: Lesson | null;
      answers: Record<string, string>;
      currentIndex: number;
      loading: boolean;
      submitting: boolean;
      error: string | null;
      submitted: Awaited<ReturnType<typeof completeSession>> | null;
    },
    patch: Partial<{
      lesson: Lesson | null;
      answers: Record<string, string>;
      currentIndex: number;
      loading: boolean;
      submitting: boolean;
      error: string | null;
      submitted: Awaited<ReturnType<typeof completeSession>> | null;
    }>
  ) => ({ ...previous, ...patch }), {
    lesson: null,
    answers: {},
    currentIndex: 0,
    loading: true,
    submitting: false,
    error: null,
    submitted: null
  });

  const loadLesson = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const details = await fetchLessonDetails(props.lessonId, props.auth);
      setState({
        lesson: details.lesson,
        answers: {},
        currentIndex: 0,
        submitted: null
      });
    } catch (reason) {
      setState({ error: formatError(reason) });
    } finally {
      setState({ loading: false });
    }
  }, [props.auth, props.lessonId]);

  useEffect(() => {
    loadLesson().catch(() => undefined);
  }, [loadLesson]);

  const items = state.lesson?.items ?? [];
  const item = items[state.currentIndex];
  const answeredCount = items.filter((entry) => Boolean(state.answers[entry.itemId]?.trim())).length;

  const gradedByItemId = useMemo(() => {
    const graded = state.submitted?.gradedItems ?? [];
    return new Map(graded.filter((entry) => entry.itemId).map((entry) => [String(entry.itemId), entry] as const));
  }, [state.submitted]);

  const completedLabel = state.submitted?.lessonProgress?.completed ? 'Lesson completed' : 'Lesson submitted';

  function setAnswer(itemId: string, value: string) {
    setState({ answers: { ...state.answers, [itemId]: value } });
  }

  async function handleSubmit() {
    if (!state.lesson) {
      return;
    }

    const missing = state.lesson.items.find((entry) => !state.answers[entry.itemId]?.trim());
    if (missing) {
      setState({ error: 'Answer all questions before submitting.' });
      return;
    }

    setState({ submitting: true, error: null });

    try {
      const itemResults: SessionItemResult[] = state.lesson.items.map((entry) => ({
        itemId: entry.itemId,
        skillId: entry.skillId,
        answer: String(state.answers[entry.itemId] ?? '')
      }));

      const response = await completeSession(props.auth, itemResults, {
        lessonId: state.lesson.lessonId,
        timeZone: getTimeZone()
      });

      setState({ submitted: response });
    } catch (reason) {
      setState({ error: formatError(reason) });
    } finally {
      setState({ submitting: false });
    }
  }

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (state.error && !state.lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{state.error}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load lesson.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (state.submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable style={styles.secondaryButton} onPress={() => props.onExit(true)}>
            <Text style={styles.secondaryButtonText}>Back to Path</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{completedLabel}</Text>
          <Text style={styles.heroSubtitle}>{state.lesson.title}</Text>
          {state.submitted.lessonProgress ? (
            <Text style={styles.heroSubtitle}>
              Score {Math.round(state.submitted.lessonProgress.score * 100)}% • {state.submitted.lessonProgress.correctCount}/{state.submitted.lessonProgress.totalItems} correct • coverage {Math.round(state.submitted.lessonProgress.coverage * 100)}%
            </Text>
          ) : null}
        </View>

        {state.error ? <Text style={styles.error}>{state.error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review</Text>
          {state.lesson.items.map((entry, index) => {
            const graded = gradedByItemId.get(entry.itemId);
            const isCorrect = graded?.isCorrect;
            const prefix = typeof isCorrect === 'boolean' ? (isCorrect ? 'Correct' : 'Review') : 'Answer';
            return (
              <View key={entry.itemId} style={styles.reviewItem}>
                <Text style={styles.reviewPrompt}>{prefix} {index + 1}. {entry.prompt}</Text>
                <Text style={styles.reviewAnswer}>Your answer: {state.answers[entry.itemId]}</Text>
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
  const currentAnswer = state.answers[item.itemId] ?? '';
  const canGoNext = Boolean(currentAnswer.trim());
  const isLast = state.currentIndex >= items.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={state.submitting}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.progress}>{state.currentIndex + 1}/{items.length} • answered {answeredCount}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{state.lesson.title}</Text>
        <Text style={styles.heroSubtitle}>{state.lesson.summary}</Text>
      </View>

      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}

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
                  disabled={state.submitting}
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
            editable={!state.submitting}
          />
        )}

      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.secondaryButton, state.currentIndex === 0 && styles.disabledButton]}
          onPress={() => setState({ currentIndex: Math.max(0, state.currentIndex - 1) })}
          disabled={state.submitting || state.currentIndex === 0}
        >
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </Pressable>

        {!isLast ? (
          <Pressable
            style={[styles.button, (!canGoNext || state.submitting) && styles.disabledButton]}
            onPress={() => setState({ currentIndex: Math.min(items.length - 1, state.currentIndex + 1) })}
            disabled={!canGoNext || state.submitting}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, state.submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={state.submitting}
          >
            <Text style={styles.buttonText}>{state.submitting ? 'Submitting…' : 'Submit Lesson'}</Text>
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
  hero: { ...surface.cardElevated, padding: 18, gap: 8 },
  heroTitle: { fontFamily: font.display, color: theme.textPrimary, fontSize: 22, lineHeight: 27, fontWeight: '700' },
  heroSubtitle: { color: theme.textSecondary, lineHeight: 20 },
  card: { ...surface.card, padding: 16, gap: 10 },
  cardTitle: { fontFamily: font.display, color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  prompt: { color: theme.textPrimary, fontSize: 16, lineHeight: 22 },
  choices: { gap: 10 },
  choice: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.cardElevated },
  choiceSelected: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  choiceText: { color: theme.textPrimary, fontWeight: '700' },
  choiceTextSelected: { color: theme.accentBright },
  input: { ...surface.input, backgroundColor: theme.cardElevated },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  explanation: { marginTop: 4, backgroundColor: theme.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.line, gap: 6 },
  explanationTitle: { color: theme.accent, fontWeight: '700' },
  explanationBody: { color: theme.textMuted },
  navRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  button: { ...surface.buttonPrimary, flex: 1 },
  buttonText: { textAlign: 'center', color: theme.onAccent, fontWeight: '700' },
  secondaryButton: surface.buttonSecondary,
  secondaryButtonText: { color: theme.textPrimary, fontWeight: '700', textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
  error: { color: theme.danger, textAlign: 'center' },
  reviewItem: { marginTop: 12, gap: 6 },
  reviewPrompt: { color: theme.textPrimary, fontWeight: '700' },
  reviewAnswer: { color: theme.textMuted },
  reviewExplanation: { color: theme.textMuted }
});

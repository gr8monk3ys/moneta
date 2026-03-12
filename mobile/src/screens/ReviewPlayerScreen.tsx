import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeSession, fetchToday, type AuthContext, type SessionItemResult, type TodayResponse } from '../lib/api';
import { theme } from '../lib/theme';

interface ReviewPlayerProps {
  userId: string;
  auth: AuthContext;
  onExit: (updated: boolean) => void;
}

type DueReview = TodayResponse['dueReviews'][number];
type Submission = Awaited<ReturnType<typeof completeSession>>;

interface ReviewState {
  mode: 'due' | 'practice';
  dueReviews: DueReview[];
  practiceReviews: DueReview[];
  dueLockedCount: number;
  dueUnavailableCount: number;
  practiceLockedCount: number;
  practiceUnavailableCount: number;
  answers: Record<string, string>;
  currentIndex: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  submitted: Submission | null;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function resolveFormat(item: DueReview): NonNullable<DueReview['format']> {
  return item.format ?? (item.choices && item.choices.length > 0 ? 'mcq' : 'scenario');
}

function ReviewEmptyState(props: {
  mode: 'due' | 'practice';
  title: string;
  dueLockedCount: number;
  dueUnavailableCount: number;
  practiceReviewsCount: number;
  lockedCount: number;
  unavailableCount: number;
  submitting: boolean;
  onStartPractice: () => void;
  onExit: (updated: boolean) => void;
}) {
  if (props.mode === 'due' && props.practiceReviewsCount > 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{props.title}</Text>
          <Text style={styles.heroSubtitle}>No playable reviews due right now.</Text>
          {props.dueLockedCount > 0 ? <Text style={styles.heroSubtitle}>{props.dueLockedCount} reviews locked (Pro).</Text> : null}
          {props.dueUnavailableCount > 0 ? <Text style={styles.heroSubtitle}>{props.dueUnavailableCount} reviews missing content.</Text> : null}
          <Text style={styles.heroSubtitle}>Practice set available: {props.practiceReviewsCount} skills.</Text>
        </View>
        <Pressable style={styles.button} onPress={props.onStartPractice} disabled={props.submitting}>
          <Text style={styles.buttonText}>Practice Now</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={props.submitting}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{props.title}</Text>
        <Text style={styles.heroSubtitle}>
          {props.mode === 'practice' ? 'No practice reviews available right now.' : 'No playable reviews due right now.'}
        </Text>
        {props.lockedCount > 0 ? <Text style={styles.heroSubtitle}>{props.lockedCount} reviews locked (Pro).</Text> : null}
        {props.unavailableCount > 0 ? <Text style={styles.heroSubtitle}>{props.unavailableCount} reviews missing content.</Text> : null}
      </View>
      <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

function ReviewSubmittedView(props: {
  mode: 'due' | 'practice';
  submitting: boolean;
  submitted: Submission;
  reviews: DueReview[];
  answers: Record<string, string>;
  gradedByItemId: Map<string, NonNullable<Submission['gradedItems']>[number]>;
  error: string | null;
  onExit: (updated: boolean) => void;
  onReload: () => void;
}) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(true)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={props.onReload} disabled={props.submitting}>
          <Text style={styles.secondaryButtonText}>Reload</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{props.mode === 'practice' ? 'Practice Submitted' : 'Reviews Submitted'}</Text>
        <Text style={styles.heroSubtitle}>Streak: {props.submitted.streakDays} days</Text>
      </View>

      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Results</Text>
        {props.reviews.map((entry, index) => {
          const itemId = String(entry.contentItemId);
          const graded = props.gradedByItemId.get(itemId);
          const isCorrect = graded?.isCorrect;
          const prefix = typeof isCorrect === 'boolean' ? (isCorrect ? 'Correct' : 'Review') : 'Answer';
          return (
            <View key={itemId} style={styles.resultItem}>
              <Text style={styles.prompt}>{prefix} {index + 1}. {entry.prompt}</Text>
              <Text style={styles.meta}>Skill: {entry.skillId}</Text>
              <Text style={styles.meta}>Your answer: {props.answers[itemId]}</Text>
              {entry.explanation ? <Text style={styles.explanationBody}>{entry.explanation}</Text> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ReviewQuestionCard(props: {
  title: string;
  item: DueReview;
  currentAnswer: string;
  lockedCount: number;
  submitting: boolean;
  onAnswerChange: (value: string) => void;
}) {
  const format = resolveFormat(props.item);

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{props.title}</Text>
        <Text style={styles.heroSubtitle}>Skill: {props.item.skillId}</Text>
        {props.lockedCount > 0 ? <Text style={styles.heroSubtitle}>{props.lockedCount} locked reviews (Pro).</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Question</Text>
        <Text style={styles.prompt}>{props.item.prompt}</Text>

        {format === 'mcq' ? (
          <View style={styles.choices}>
            {(props.item.choices ?? []).map((choice) => {
              const selected = props.currentAnswer === choice;
              return (
                <Pressable
                  key={choice}
                  style={[styles.choice, selected && styles.choiceSelected]}
                  onPress={() => props.onAnswerChange(choice)}
                  disabled={props.submitting}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            value={props.currentAnswer}
            onChangeText={props.onAnswerChange}
            placeholder={format === 'numeric' ? 'Type a number…' : 'Type your answer…'}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, format === 'scenario' && styles.inputMultiline]}
            multiline={format === 'scenario'}
            numberOfLines={format === 'scenario' ? 4 : 1}
            keyboardType={format === 'numeric' ? (Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric') : 'default'}
            editable={!props.submitting}
          />
        )}
      </View>
    </>
  );
}

// Exposed for focused UI tests of branches that are not reachable from normal player state transitions.
export const __testables = {
  formatError,
  getTimeZone,
  resolveFormat,
  ReviewEmptyState
} as const;

export function ReviewPlayerScreen(props: ReviewPlayerProps) {
  const [state, setState] = useReducer((
    previous: ReviewState,
    patch: Partial<ReviewState>
  ) => ({ ...previous, ...patch }), {
    mode: 'due',
    dueReviews: [],
    practiceReviews: [],
    dueLockedCount: 0,
    dueUnavailableCount: 0,
    practiceLockedCount: 0,
    practiceUnavailableCount: 0,
    answers: {},
    currentIndex: 0,
    loading: true,
    submitting: false,
    error: null,
    submitted: null
  });

  const reviews = state.mode === 'practice' ? state.practiceReviews : state.dueReviews;
  const lockedCount = state.mode === 'practice' ? state.practiceLockedCount : state.dueLockedCount;
  const unavailableCount = state.mode === 'practice' ? state.practiceUnavailableCount : state.dueUnavailableCount;
  const title = state.mode === 'practice' ? 'Practice Reviews' : 'Daily Reviews';

  const loadReviews = useCallback(async () => {
    setState({ loading: true, error: null });

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

      setState({
        mode: 'due',
        dueLockedCount: dueLocked,
        dueUnavailableCount: dueUnavailable,
        dueReviews: duePlayable,
        practiceLockedCount: practiceLocked,
        practiceUnavailableCount: practiceUnavailable,
        practiceReviews: practicePlayable,
        answers: {},
        currentIndex: 0,
        submitted: null
      });
    } catch (reason) {
      setState({ error: formatError(reason) });
    } finally {
      setState({ loading: false });
    }
  }, [props.auth, props.userId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const item = reviews[state.currentIndex];
  const answeredCount = reviews.filter((entry) => Boolean(state.answers[String(entry.contentItemId)]?.trim())).length;

  const gradedByItemId = useMemo(() => {
    const graded = state.submitted?.gradedItems ?? [];
    return new Map(graded.filter((entry) => entry.itemId).map((entry) => [String(entry.itemId), entry] as const));
  }, [state.submitted]);

  function setAnswer(contentItemId: string, value: string) {
    setState({ answers: { ...state.answers, [contentItemId]: value } });
  }

  function handleStartPractice() {
    setState({
      mode: 'practice',
      answers: {},
      currentIndex: 0,
      submitted: null,
      error: null
    });
  }

  async function handleSubmit() {
    setState({ submitting: true, error: null });

    try {
      const missing = reviews.find((entry) => !state.answers[String(entry.contentItemId)]?.trim());
      if (missing) {
        setState({ error: 'Answer all reviews before submitting.' });
        return;
      }

      const itemResults: SessionItemResult[] = reviews.map((entry) => ({
        itemId: String(entry.contentItemId),
        skillId: entry.skillId,
        answer: String(state.answers[String(entry.contentItemId)] ?? '')
      }));

      const response = await completeSession(props.auth, itemResults, {
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

  if (state.error && state.dueReviews.length === 0 && state.practiceReviews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{state.error}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <ReviewEmptyState
        mode={state.mode}
        title={title}
        dueLockedCount={state.dueLockedCount}
        dueUnavailableCount={state.dueUnavailableCount}
        practiceReviewsCount={state.practiceReviews.length}
        lockedCount={lockedCount}
        unavailableCount={unavailableCount}
        submitting={state.submitting}
        onStartPractice={handleStartPractice}
        onExit={props.onExit}
      />
    );
  }

  if (state.submitted) {
    return (
      <ReviewSubmittedView
        mode={state.mode}
        submitting={state.submitting}
        submitted={state.submitted}
        reviews={reviews}
        answers={state.answers}
        gradedByItemId={gradedByItemId}
        error={state.error}
        onExit={props.onExit}
        onReload={loadReviews}
      />
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
  const currentAnswer = state.answers[contentItemId] ?? '';
  const canGoNext = Boolean(currentAnswer.trim());
  const isLast = state.currentIndex >= reviews.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => props.onExit(false)} disabled={state.submitting}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.progress}>{state.currentIndex + 1}/{reviews.length} • answered {answeredCount}</Text>
      </View>

      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}

      <ReviewQuestionCard
        title={title}
        item={item}
        currentAnswer={currentAnswer}
        lockedCount={lockedCount}
        submitting={state.submitting}
        onAnswerChange={(value) => setAnswer(contentItemId, value)}
      />

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
            onPress={() => setState({ currentIndex: Math.min(reviews.length - 1, state.currentIndex + 1) })}
            disabled={!canGoNext || state.submitting}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, (state.submitting || answeredCount !== reviews.length) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={state.submitting}
          >
            <Text style={styles.buttonText}>{state.submitting ? 'Submitting…' : 'Submit Reviews'}</Text>
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

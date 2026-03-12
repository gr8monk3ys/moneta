import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LessonPlayerScreen } from '../src/screens/LessonPlayerScreen';
import { ReviewPlayerScreen, __testables as reviewPlayerTestables } from '../src/screens/ReviewPlayerScreen';
import * as api from '../src/lib/api';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  fetchLessonDetails: jest.fn(),
  fetchToday: jest.fn(),
  completeSession: jest.fn()
}));

const auth = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  onTokensUpdated: jest.fn()
};

describe('lesson and review player screens', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('plays a lesson flow and shows submitted results', async () => {
    const onExit = jest.fn();
    (api.fetchLessonDetails as jest.Mock).mockResolvedValue({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-1',
        title: 'Cash Flow Basics',
        summary: 'Understand the money coming in and out.',
        level: 'F1',
        track: 'core',
        premium: false,
        estimatedMinutes: 5,
        items: [
          {
            itemId: 'item-1',
            skillId: 'cash-flow',
            prompt: 'What is cash flow?',
            format: 'mcq',
            choices: ['Money moving in and out', 'A type of tax'],
            explanation: 'Cash flow tracks money entering and leaving.'
          },
          {
            itemId: 'item-2',
            skillId: 'net-income',
            prompt: 'Write one reason a positive cash flow matters.',
            format: 'scenario',
            explanation: 'Positive cash flow gives you room to save and adapt.'
          }
        ]
      }
    });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 12,
      scheduledReviews: [],
      gradedItems: [
        { itemId: 'item-1', skillId: 'cash-flow', answer: 'Money moving in and out', isCorrect: true },
        { itemId: 'item-2', skillId: 'net-income', answer: 'It helps you save.', isCorrect: false }
      ],
      lessonProgress: {
        lessonId: 'lesson-1',
        completed: true,
        score: 0.5,
        correctCount: 1,
        totalItems: 2,
        coverage: 1
      }
    });

    const screen = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Cash Flow Basics')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Money moving in and out'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.changeText(screen.getByPlaceholderText('Type your answer…'), 'It helps you save.');
    fireEvent.press(screen.getByText('Submit Lesson'));

    await waitFor(() => {
      expect(api.completeSession).toHaveBeenCalled();
      expect(screen.getByText('Lesson completed')).toBeTruthy();
      expect(screen.getByText('Score 50% • 1/2 correct • coverage 100%')).toBeTruthy();
      expect(screen.getByText('Correct 1. What is cash flow?')).toBeTruthy();
      expect(screen.getByText('Review 2. Write one reason a positive cash flow matters.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back to Path'));
    expect(onExit).toHaveBeenCalledWith(true);
  });

  it('shows lesson load failures and allows backing out', async () => {
    const onExit = jest.fn();
    (api.fetchLessonDetails as jest.Mock).mockRejectedValue(new Error('lesson failed'));

    const screen = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('lesson failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
  });

  it('supports numeric lesson inputs, previous navigation, and incomplete lesson submissions', async () => {
    const onExit = jest.fn();
    (api.fetchLessonDetails as jest.Mock).mockResolvedValue({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-2',
        title: 'Interest Basics',
        summary: 'Short drills on rates.',
        level: 'F1',
        track: 'core',
        premium: false,
        estimatedMinutes: 4,
        items: [
          {
            itemId: 'item-a',
            skillId: 'interest-rate',
            prompt: 'What is 10% of 500?',
            format: 'numeric',
            explanation: '10% of 500 is 50.'
          },
          {
            itemId: 'item-b',
            skillId: 'savings-rate',
            prompt: 'Saving more generally does what?',
            format: 'mcq',
            choices: ['Builds flexibility', 'Increases overdrafts'],
            explanation: 'Savings add resilience.'
          }
        ]
      }
    });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 3,
      scheduledReviews: [],
      gradedItems: [
        { itemId: 'item-a', skillId: 'interest-rate', answer: '50', isCorrect: true },
        { itemId: 'item-b', skillId: 'savings-rate', answer: 'Builds flexibility', isCorrect: true }
      ]
    });

    const screen = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-2" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Interest Basics')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('Type a number…'), '50');
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Previous'));
    expect(screen.getByText('1/2 • answered 1')).toBeTruthy();

    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Builds flexibility'));
    fireEvent.press(screen.getByText('Submit Lesson'));

    await waitFor(() => {
      expect(screen.getByText('Lesson submitted')).toBeTruthy();
      expect(screen.queryByText(/Score /)).toBeNull();
    });

    fireEvent.press(screen.getByText('Back to Path'));
    expect(onExit).toHaveBeenCalledWith(true);
  });

  it('shows lesson fallbacks when lesson data is incomplete or has no items', async () => {
    const onExit = jest.fn();

    (api.fetchLessonDetails as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      lesson: undefined
    });

    const missingLesson = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-missing" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(missingLesson.getByText('Unable to load lesson.')).toBeTruthy();
    });

    fireEvent.press(missingLesson.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);

    onExit.mockClear();
    (api.fetchLessonDetails as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-empty',
        title: 'Empty Lesson',
        summary: 'No items here.',
        level: 'F1',
        track: 'core',
        premium: false,
        estimatedMinutes: 1,
        items: []
      }
    });

    const emptyLesson = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-empty" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(emptyLesson.getByText('Lesson has no items.')).toBeTruthy();
    });

    fireEvent.press(emptyLesson.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
  });

  it('allows active lesson exit and surfaces lesson submit validation and failures', async () => {
    const onExit = jest.fn();

    (api.fetchLessonDetails as jest.Mock).mockResolvedValue({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-3',
        title: 'Liquidity Basics',
        summary: 'Short scenario practice.',
        level: 'F1',
        track: 'core',
        premium: false,
        estimatedMinutes: 3,
        items: [
          {
            itemId: 'item-liquidity',
            skillId: 'liquidity',
            prompt: 'Why does liquidity matter?',
            format: 'scenario',
            explanation: 'Liquidity helps you cover near-term needs.'
          }
        ]
      }
    });

    const backOut = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-3" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(backOut.getByText('Liquidity Basics')).toBeTruthy();
    });

    fireEvent.press(backOut.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);

    onExit.mockClear();
    (api.completeSession as jest.Mock).mockRejectedValueOnce(new Error('lesson submit failed'));

    const failureFlow = render(
      <LessonPlayerScreen userId="u1" lessonId="lesson-3" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(failureFlow.getByText('Liquidity Basics')).toBeTruthy();
    });

    fireEvent.press(failureFlow.getByText('Submit Lesson'));

    await waitFor(() => {
      expect(failureFlow.getByText('Answer all questions before submitting.')).toBeTruthy();
    });

    fireEvent.changeText(failureFlow.getByPlaceholderText('Type your answer…'), 'To pay short-term obligations.');
    fireEvent.press(failureFlow.getByText('Submit Lesson'));

    await waitFor(() => {
      expect(failureFlow.getByText('lesson submit failed')).toBeTruthy();
    });
  });

  it('runs due-review and practice-review flows', async () => {
    const onExit = jest.fn();
    (api.fetchToday as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'u1',
        dueReviews: [
          { itemId: 'due-locked', skillId: 'locked', dueDate: new Date().toISOString(), locked: true },
          { itemId: 'due-missing', skillId: 'missing', dueDate: new Date().toISOString(), contentItemId: 'missing' }
        ],
        practiceReviews: [
          {
            itemId: 'practice-1',
            contentItemId: 'content-1',
            skillId: 'budgeting',
            dueDate: new Date().toISOString(),
            prompt: 'A budget helps you do what?',
            format: 'mcq',
            choices: ['Plan spending', 'Ignore bills'],
            explanation: 'Budgets make tradeoffs visible.'
          }
        ],
        entitlement: {
          plan: 'free',
          isActive: true,
          source: 'none',
          updatedAt: new Date().toISOString()
        },
        features: {
          advancedTracks: false,
          certificates: false,
          streakRepair: false,
          unlimitedReviews: false,
          maxDueReviews: 3
        }
      })
      .mockResolvedValueOnce({
        userId: 'u1',
        dueReviews: [
          {
            itemId: 'due-1',
            contentItemId: 'content-2',
            skillId: 'credit',
            dueDate: new Date().toISOString(),
            prompt: 'Paying on time helps your credit score.',
            format: 'mcq',
            choices: ['True', 'False'],
            explanation: 'Payment history is a major score factor.'
          }
        ],
        practiceReviews: [],
        entitlement: {
          plan: 'free',
          isActive: true,
          source: 'none',
          updatedAt: new Date().toISOString()
        },
        features: {
          advancedTracks: false,
          certificates: false,
          streakRepair: false,
          unlimitedReviews: false,
          maxDueReviews: 3
        }
      });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 6,
      scheduledReviews: [],
      gradedItems: [{ itemId: 'content-1', skillId: 'budgeting', answer: 'Plan spending', isCorrect: true }]
    });

    const screen = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Practice set available: 1 skills.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Practice Now'));
    fireEvent.press(screen.getByText('Plan spending'));
    fireEvent.press(screen.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(screen.getByText('Practice Submitted')).toBeTruthy();
      expect(screen.getByText('Correct 1. A budget helps you do what?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Reload'));

    await waitFor(() => {
      expect(screen.getByText('Daily Reviews')).toBeTruthy();
      expect(screen.getByText('Paying on time helps your credit score.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('True'));
    fireEvent.press(screen.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(api.completeSession).toHaveBeenCalledTimes(2);
    });

    fireEvent.press(screen.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(true);
  });

  it('covers review empty states, validation, and submit failures', async () => {
    const onExit = jest.fn();

    (api.fetchToday as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      dueReviews: [],
      practiceReviews: [],
      entitlement: {
        plan: 'free',
        isActive: true,
        source: 'none',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: false,
        certificates: false,
        streakRepair: false,
        unlimitedReviews: false,
        maxDueReviews: 3
      }
    });

    const emptyState = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(emptyState.getByText('No playable reviews due right now.')).toBeTruthy();
    });

    fireEvent.press(emptyState.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);

    onExit.mockClear();
    (api.fetchToday as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      dueReviews: [],
      practiceReviews: [
        {
          itemId: 'practice-2',
          contentItemId: 'content-2',
          skillId: 'savings-rate',
          dueDate: new Date().toISOString(),
          prompt: 'Describe one reason to keep cash reserves.',
          format: 'scenario',
          explanation: 'Cash reserves provide flexibility.'
        }
      ],
      entitlement: {
        plan: 'free',
        isActive: true,
        source: 'none',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: false,
        certificates: false,
        streakRepair: false,
        unlimitedReviews: false,
        maxDueReviews: 3
      }
    });
    (api.completeSession as jest.Mock).mockRejectedValueOnce(new Error('submit failed'));

    const failureFlow = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(failureFlow.getByText('Practice set available: 1 skills.')).toBeTruthy();
    });

    fireEvent.press(failureFlow.getByText('Practice Now'));
    expect(failureFlow.getByPlaceholderText('Type your answer…')).toBeTruthy();

    fireEvent.press(failureFlow.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(failureFlow.getByText('Answer all reviews before submitting.')).toBeTruthy();
    });

    fireEvent.changeText(failureFlow.getByPlaceholderText('Type your answer…'), 'Build a safety buffer.');
    fireEvent.press(failureFlow.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(failureFlow.getByText('submit failed')).toBeTruthy();
    });
  });

  it('shows review submitted fallback labels when grading details are absent', async () => {
    const onExit = jest.fn();
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [
        {
          itemId: 'due-1',
          contentItemId: 'content-3',
          skillId: 'cash-buffer',
          dueDate: new Date().toISOString(),
          prompt: 'Why keep an emergency fund?',
          format: 'mcq',
          choices: ['Flexibility', 'Higher taxes']
        }
      ],
      practiceReviews: [],
      entitlement: {
        plan: 'free',
        isActive: true,
        source: 'none',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: false,
        certificates: false,
        streakRepair: false,
        unlimitedReviews: false,
        maxDueReviews: 3
      }
    });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 4,
      scheduledReviews: [],
      gradedItems: []
    });

    const screen = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Why keep an emergency fund?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Flexibility'));
    fireEvent.press(screen.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(screen.getByText('Reviews Submitted')).toBeTruthy();
      expect(screen.getByText('Answer 1. Why keep an emergency fund?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(true);
  });

  it('supports numeric review prompts and allows exiting mid-review', async () => {
    const onExit = jest.fn();
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [
        {
          itemId: 'due-numeric',
          contentItemId: 'content-4',
          skillId: 'savings-rate',
          dueDate: new Date().toISOString(),
          prompt: 'What is 10% of 200?',
          format: 'numeric',
          explanation: 'Ten percent of 200 is 20.'
        }
      ],
      practiceReviews: [],
      entitlement: {
        plan: 'free',
        isActive: true,
        source: 'none',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: false,
        certificates: false,
        streakRepair: false,
        unlimitedReviews: false,
        maxDueReviews: 3
      }
    });

    const screen = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a number…')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
  });

  it('shows review load failures and allows exit', async () => {
    const onExit = jest.fn();
    (api.fetchToday as jest.Mock).mockRejectedValue(new Error('review failed'));

    const screen = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('review failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
  });

  it('renders due and practice empty states directly', () => {
    const onExit = jest.fn();
    const onStartPractice = jest.fn();

    const dueEmpty = render(
      <reviewPlayerTestables.ReviewEmptyState
        mode="due"
        title="Daily Reviews"
        dueLockedCount={1}
        dueUnavailableCount={1}
        practiceReviewsCount={2}
        lockedCount={1}
        unavailableCount={1}
        submitting={false}
        onStartPractice={onStartPractice}
        onExit={onExit}
      />
    );

    expect(dueEmpty.getByText('1 reviews locked (Pro).')).toBeTruthy();
    fireEvent.press(dueEmpty.getByText('Practice Now'));
    expect(onStartPractice).toHaveBeenCalled();
    fireEvent.press(dueEmpty.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
    dueEmpty.unmount();

    onExit.mockClear();

    const practiceEmpty = render(
      <reviewPlayerTestables.ReviewEmptyState
        mode="practice"
        title="Practice Reviews"
        dueLockedCount={0}
        dueUnavailableCount={0}
        practiceReviewsCount={0}
        lockedCount={1}
        unavailableCount={1}
        submitting={false}
        onStartPractice={onStartPractice}
        onExit={onExit}
      />
    );

    expect(practiceEmpty.getByText('No practice reviews available right now.')).toBeTruthy();
    fireEvent.press(practiceEmpty.getByText('Back'));
    expect(onExit).toHaveBeenCalledWith(false);
  });

  it('navigates between due reviews and reloads fresh review content', async () => {
    const onExit = jest.fn();
    (api.fetchToday as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'u1',
        dueReviews: [
          {
            itemId: 'due-1',
            contentItemId: 'content-5',
            skillId: 'budgeting',
            dueDate: new Date().toISOString(),
            prompt: 'A budget helps you do what?',
            format: 'mcq',
            choices: ['Plan spending', 'Ignore bills']
          },
          {
            itemId: 'due-2',
            contentItemId: 'content-6',
            skillId: 'credit',
            dueDate: new Date().toISOString(),
            prompt: 'Payment history matters for credit scores.',
            format: 'mcq',
            choices: ['True', 'False']
          }
        ],
        practiceReviews: [],
        entitlement: {
          plan: 'free',
          isActive: true,
          source: 'none',
          updatedAt: new Date().toISOString()
        },
        features: {
          advancedTracks: false,
          certificates: false,
          streakRepair: false,
          unlimitedReviews: false,
          maxDueReviews: 3
        }
      })
      .mockResolvedValueOnce({
        userId: 'u1',
        dueReviews: [
          {
            itemId: 'due-3',
            contentItemId: 'content-7',
            skillId: 'cash-buffer',
            dueDate: new Date().toISOString(),
            prompt: 'Why keep a starter emergency fund?',
            format: 'mcq',
            choices: ['Flexibility', 'Higher taxes']
          }
        ],
        practiceReviews: [],
        entitlement: {
          plan: 'free',
          isActive: true,
          source: 'none',
          updatedAt: new Date().toISOString()
        },
        features: {
          advancedTracks: false,
          certificates: false,
          streakRepair: false,
          unlimitedReviews: false,
          maxDueReviews: 3
        }
      });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 7,
      scheduledReviews: [],
      gradedItems: [
        { itemId: 'content-5', skillId: 'budgeting', answer: 'Plan spending', isCorrect: true },
        { itemId: 'content-6', skillId: 'credit', answer: 'True', isCorrect: true }
      ]
    });

    const screen = render(
      <ReviewPlayerScreen userId="u1" auth={auth} onExit={onExit} />
    );

    await waitFor(() => {
      expect(screen.getByText('A budget helps you do what?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Plan spending'));
    fireEvent.press(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('2/2 • answered 1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Previous'));
    expect(screen.getByText('1/2 • answered 1')).toBeTruthy();

    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('True'));
    fireEvent.press(screen.getByText('Submit Reviews'));

    await waitFor(() => {
      expect(screen.getByText('Reviews Submitted')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Reload'));

    await waitFor(() => {
      expect(api.fetchToday).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Why keep a starter emergency fund?')).toBeTruthy();
    });
  });
});

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking, Modal } from 'react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { LearnScreen } from '../src/screens/LearnScreen';
import { LoginScreen } from '../src/screens/LoginScreen';
import { PasswordResetConfirmScreen } from '../src/screens/PasswordResetConfirmScreen';
import { PasswordResetRequestScreen } from '../src/screens/PasswordResetRequestScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import * as api from '../src/lib/api';
import * as legal from '../src/lib/legal';
import * as storeBilling from '../src/lib/storeBilling';
import { createTestQueryClient, renderWithQueryClient } from './testUtils';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  confirmPasswordReset: jest.fn(),
  fetchProgress: jest.fn(),
  fetchToday: jest.fn(),
  fetchLearningPath: jest.fn(),
  fetchLessonDetails: jest.fn(),
  submitPlacement: jest.fn(),
  completeSession: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  exportAccountData: jest.fn(),
  deleteAccount: jest.fn(),
  fetchEntitlement: jest.fn(),
  syncEntitlement: jest.fn()
}));

jest.mock('../src/lib/storeBilling', () => ({
  listSubscriptionProducts: jest.fn().mockResolvedValue([]),
  purchasePrimarySubscription: jest.fn().mockResolvedValue(null),
  restoreLatestSubscription: jest.fn().mockResolvedValue(null),
  disconnectStoreBilling: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/lib/legal', () => ({
  openLegalDoc: jest.fn().mockResolvedValue({ opened: true })
}));

describe('mobile auth-driven screens', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    (storeBilling.listSubscriptionProducts as jest.Mock).mockResolvedValue([
      {
        productId: 'moneta.pro.monthly',
        title: 'Moneta Pro',
        description: 'Monthly plan',
        displayPrice: '$7.99'
      }
    ]);
    (storeBilling.purchasePrimarySubscription as jest.Mock).mockResolvedValue({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-ios-12345',
      sandbox: true
    });
    (storeBilling.restoreLatestSubscription as jest.Mock).mockResolvedValue({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-ios-restore-12345',
      sandbox: true
    });
    (storeBilling.disconnectStoreBilling as jest.Mock).mockResolvedValue(undefined);
    (api.syncEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
      entitlement: {
        plan: 'pro',
        isActive: true,
        source: 'ios',
        productId: 'moneta.pro.monthly',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: true,
        certificates: true,
        streakRepair: true,
        unlimitedReviews: true,
        maxDueReviews: null
      }
    });
    (api.fetchLearningPath as jest.Mock).mockResolvedValue({
      userId: 'u1',
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
      },
      lessons: [
        {
          lessonId: 'lesson-cash-flow-f1-001',
          title: 'Money Basics',
          summary: 'Basics',
          level: 'F1',
          track: 'core',
          premium: false,
          estimatedMinutes: 5,
          locked: false,
          completed: false
        },
        {
          lessonId: 'lesson-retirement-income-f4-001',
          title: 'Retirement Income Planning',
          summary: 'Advanced',
          level: 'F4',
          track: 'advanced',
          premium: true,
          estimatedMinutes: 9,
          locked: true,
          completed: true
        }
      ]
    });
    (api.exportAccountData as jest.Mock).mockResolvedValue({
      userId: 'u1',
      email: 'u1@example.com',
      generatedAt: new Date().toISOString(),
      profile: {
        userId: 'u1',
        currentLevel: 'F2',
        streakDays: 3,
        skills: {},
        entitlement: {
          plan: 'free',
          isActive: true,
          source: 'none',
          updatedAt: new Date().toISOString()
        }
      },
      sessions: { total: 2, active: 1, refreshTokens: [] },
      billing: { webhookEventsProcessed: 1, events: [] }
    });
    (api.deleteAccount as jest.Mock).mockResolvedValue({
      userId: 'u1',
      deleted: true,
      deletedAt: new Date().toISOString()
    });
    (api.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true });
    (api.confirmPasswordReset as jest.Mock).mockResolvedValue({ success: true });
    (legal.openLegalDoc as jest.Mock).mockResolvedValue({ opened: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('authenticates from login screen with a valid response', async () => {
    const onAuthenticated = jest.fn();

    (api.login as jest.Mock).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      sessionId: 's',
      userId: 'u1'
    });

    const screen = render(<LoginScreen onAuthenticated={onAuthenticated} />);
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith({
        accessToken: 'a',
        refreshToken: 'r',
        sessionId: 's',
        userId: 'u1'
      });
    }, { timeout: 10000 });
  });

  it('shows an error when login response has no userId', async () => {
    (api.login as jest.Mock).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      sessionId: 's'
    });

    const screen = render(<LoginScreen onAuthenticated={jest.fn()} />);
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Login response did not include a userId')).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('handles account creation failures', async () => {
    const screen = render(<LoginScreen onAuthenticated={jest.fn()} />);
    (api.register as jest.Mock).mockRejectedValue(new Error('register failed'));

    fireEvent.press(screen.getByText('Create Free Account'));

    await waitFor(() => {
      expect(screen.getByText('register failed')).toBeTruthy();
    });
  });

  it('loads dashboard and supports home actions', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F2',
      streakDays: 7,
      masteredSkills: 2,
      totalSkills: 4,
      plan: 'free',
      premiumActive: false
    });
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [{ itemId: '1', skillId: 'budget', dueDate: new Date().toISOString() }],
      nextLesson: { lessonId: 'l1', title: 'Next Up', estimatedMinutes: 5 },
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
    (api.submitPlacement as jest.Mock).mockResolvedValue({ userId: 'u1', level: 'F3' });
    (api.completeSession as jest.Mock).mockResolvedValue({ userId: 'u1', streakDays: 8, scheduledReviews: [] });
    (api.refresh as jest.Mock).mockResolvedValue({ accessToken: 'na', refreshToken: 'nr', sessionId: 'ns' });

    const onTokensUpdated = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated };

    const screen = renderWithQueryClient(
      <HomeScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} onStartReviews={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Next 5 min lesson: Next Up')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Run Placement (Dev)'));
    await waitFor(() => {
      expect(api.submitPlacement).toHaveBeenCalled();
      expect(screen.getByText('Placed in Planning & Stability')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Submit Practice Session (Dev)'));
    await waitFor(() => {
      expect(api.completeSession).toHaveBeenCalled();
      expect(screen.getByText('Session complete • streak 8')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Refresh Session (Dev)'));
    await waitFor(() => {
      expect(onTokensUpdated).toHaveBeenCalledWith({
        accessToken: 'na',
        refreshToken: 'nr',
        sessionId: 'ns'
      });
    });
  });

  it('starts reviews, opens the next lesson, and completes the demo lesson from home', async () => {
    const onOpenLesson = jest.fn();
    const onStartReviews = jest.fn();
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F2',
      streakDays: 3,
      masteredSkills: 2,
      totalSkills: 6,
      plan: 'free',
      premiumActive: false
    });
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [{ itemId: '1', skillId: 'budget', dueDate: new Date().toISOString(), prompt: 'Review budgeting' }],
      practiceReviews: [],
      nextLesson: { lessonId: 'lesson-1', title: 'Compound Growth', estimatedMinutes: 6 },
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
        maxDueReviews: null
      }
    });
    (api.fetchLessonDetails as jest.Mock).mockResolvedValue({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-1',
        title: 'Compound Growth',
        summary: 'Why time matters.',
        level: 'F2',
        track: 'core',
        premium: false,
        estimatedMinutes: 6,
        items: [
          { itemId: 'i1', skillId: 'compound-growth', prompt: 'Question 1' },
          { itemId: 'i2', skillId: 'compound-growth', prompt: 'Question 2' },
          { itemId: 'i3', skillId: 'compound-growth', prompt: 'Question 3' },
          { itemId: 'i4', skillId: 'compound-growth', prompt: 'Question 4' }
        ]
      }
    });
    (api.completeSession as jest.Mock).mockResolvedValue({
      userId: 'u1',
      streakDays: 4,
      scheduledReviews: [],
      lessonProgress: {
        lessonId: 'lesson-1',
        completed: true,
        score: 0.75,
        correctCount: 3,
        totalItems: 4,
        coverage: 0.75
      }
    });

    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = renderWithQueryClient(
      <HomeScreen userId="u1" auth={auth} onOpenLesson={onOpenLesson} onStartReviews={onStartReviews} />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('• Review budgeting')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Reviews'));
    fireEvent.press(screen.getByText('Start Next Lesson'));

    expect(onStartReviews).toHaveBeenCalled();
    expect(onOpenLesson).toHaveBeenCalledWith('lesson-1');

    fireEvent.press(screen.getByText('Complete Next Lesson (Demo)'));

    await waitFor(() => {
      expect(api.fetchLessonDetails).toHaveBeenCalledWith('lesson-1', auth);
      expect(screen.getByText('Completed lesson: Compound Growth')).toBeTruthy();
      expect(invalidateQueries).toHaveBeenCalledTimes(3);
    });
  });

  it('shows home error states', async () => {
    (api.fetchProgress as jest.Mock).mockRejectedValue(new Error('dashboard failed'));
    (api.fetchToday as jest.Mock).mockRejectedValue(new Error('dashboard failed'));
    (api.refresh as jest.Mock).mockRejectedValue(new Error('refresh failed'));

    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = renderWithQueryClient(
      <HomeScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} onStartReviews={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('dashboard failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Refresh Session (Dev)'));
    await waitFor(() => {
      expect(screen.getByText('refresh failed')).toBeTruthy();
    });
  });

  it('shows home fallback copy for missing lessons and practice-only review previews', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F1',
      streakDays: 0,
      masteredSkills: 0,
      totalSkills: 0,
      plan: 'free',
      premiumActive: false
    });
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      practiceReviews: [
        { itemId: '1', skillId: 'cash_buffer', dueDate: new Date().toISOString() }
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
        maxDueReviews: null
      }
    });

    const onOpenLesson = jest.fn();
    const onStartReviews = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };

    const screen = renderWithQueryClient(
      <HomeScreen userId="u1" auth={auth} onOpenLesson={onOpenLesson} onStartReviews={onStartReviews} />
    );

    await waitFor(() => {
      expect(screen.getByText('Foundations • Start your first lesson to unlock progress tracking.')).toBeTruthy();
      expect(screen.getByText('No lesson available right now.')).toBeTruthy();
      expect(screen.getByText('• Cash Buffer')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Reviews'));
    expect(onStartReviews).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Start Next Lesson'));

    await waitFor(() => {
      expect(screen.getByText('No lesson available to start.')).toBeTruthy();
    });
    expect(onOpenLesson).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Complete Next Lesson (Demo)'));
    await waitFor(() => {
      expect(screen.getByText('No lesson available to complete.')).toBeTruthy();
    });
  });

  it('surfaces empty-review and lesson callback failures from home actions', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F2',
      streakDays: 1,
      masteredSkills: 1,
      totalSkills: 3,
      plan: 'free',
      premiumActive: false
    });
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      practiceReviews: [],
      nextLesson: { lessonId: 'lesson-1', title: 'Buffer Basics', estimatedMinutes: 4 },
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

    const screen = renderWithQueryClient(
      <HomeScreen
        userId="u1"
        auth={{ accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() }}
        onOpenLesson={() => {
          throw new Error('open failed');
        }}
        onStartReviews={() => {
          throw new Error('reviews failed');
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Next 4 min lesson: Buffer Basics')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Reviews'));
    await waitFor(() => {
      expect(screen.getByText('No reviews available yet. Complete a lesson to generate reviews.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Next Lesson'));
    await waitFor(() => {
      expect(screen.getByText('open failed')).toBeTruthy();
    });
  });

  it('shows incomplete and failed home demo lesson runs', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F2',
      streakDays: 2,
      masteredSkills: 2,
      totalSkills: 5,
      plan: 'free',
      premiumActive: false
    });
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      practiceReviews: [],
      nextLesson: { lessonId: 'lesson-2', title: 'Emergency Fund Drill', estimatedMinutes: 6 },
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
    (api.fetchLessonDetails as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      lesson: {
        lessonId: 'lesson-2',
        title: 'Emergency Fund Drill',
        summary: 'Practice buffers.',
        level: 'F2',
        track: 'core',
        premium: false,
        estimatedMinutes: 6,
        items: [
          { itemId: 'item-1', skillId: 'cash-buffer', prompt: 'Question 1' },
          { itemId: 'item-2', skillId: 'cash-buffer', prompt: 'Question 2' }
        ]
      }
    });
    (api.completeSession as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      streakDays: 3,
      scheduledReviews: [],
      lessonProgress: {
        lessonId: 'lesson-2',
        completed: false,
        score: 0.5,
        correctCount: 1,
        totalItems: 2,
        coverage: 0.5
      }
    });

    const screen = renderWithQueryClient(
      <HomeScreen
        userId="u1"
        auth={{ accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() }}
        onOpenLesson={jest.fn()}
        onStartReviews={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Next 6 min lesson: Emergency Fund Drill')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Complete Next Lesson (Demo)'));
    await waitFor(() => {
      expect(screen.getByText('Lesson attempt recorded (Emergency Fund Drill). Keep practicing to complete.')).toBeTruthy();
    });

    (api.fetchLessonDetails as jest.Mock).mockRejectedValueOnce(new Error('lesson load failed'));
    fireEvent.press(screen.getByText('Complete Next Lesson (Demo)'));
    await waitFor(() => {
      expect(screen.getByText('lesson load failed')).toBeTruthy();
    });
  });

  it('syncs entitlement after in-app purchase', async () => {
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      nextLesson: { lessonId: 'l1', title: 'Next Up', estimatedMinutes: 5 },
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

    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Up next: Next Up')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upgrade to Pro'));

    await waitFor(() => {
      expect(storeBilling.purchasePrimarySubscription).toHaveBeenCalledWith('u1');
      expect(api.syncEntitlement).toHaveBeenCalledWith(auth, {
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-ios-12345'
      });
      expect(screen.getByText('Moneta Pro unlocked in sandbox mode.')).toBeTruthy();
    });
  });

  it('handles paywall edge cases and lesson interactions in learn', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      nextLesson: { lessonId: 'l1', title: 'Next Up', estimatedMinutes: 5 },
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
    (api.fetchLearningPath as jest.Mock).mockResolvedValue({
      userId: 'u1',
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
      },
      lessons: [
        {
          lessonId: 'locked-lesson',
          title: 'Retirement Income',
          summary: 'Advanced lesson',
          level: 'F4',
          track: 'advanced',
          premium: true,
          estimatedMinutes: 9,
          locked: true,
          completed: false
        },
        {
          lessonId: 'open-lesson',
          title: 'Budget Foundations',
          summary: 'Core lesson',
          level: 'F1',
          track: 'core',
          premium: false,
          estimatedMinutes: 5,
          locked: false,
          completed: false
        }
      ]
    });
    (storeBilling.restoreLatestSubscription as jest.Mock).mockResolvedValue(null);
    (legal.openLegalDoc as jest.Mock).mockResolvedValue({
      opened: false,
      error: 'legal unavailable'
    });

    const onOpenLesson = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={auth} onOpenLesson={onOpenLesson} />);

    await waitFor(() => {
      expect(screen.getByText('Retirement Income')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retirement Income'));
    await waitFor(() => {
      expect(screen.getByText('Unlock Pro to open this lesson.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Budget Foundations'));
    expect(onOpenLesson).toHaveBeenCalledWith('open-lesson');

    fireEvent.press(screen.getByText('Restore Purchases'));
    await waitFor(() => {
      expect(screen.getByText('No active subscription was found to restore.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Manage Subscription'));
    await waitFor(() => {
      expect(screen.getByText('This device cannot open subscription settings.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Subscription Terms'));
    await waitFor(() => {
      expect(screen.getByText('legal unavailable')).toBeTruthy();
    });
  });

  it('opens subscription settings and surfaces purchase failures in learn', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockImplementation(async () => undefined);
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      nextLesson: { lessonId: 'l1', title: 'Next Up', estimatedMinutes: 5 },
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
    (storeBilling.purchasePrimarySubscription as jest.Mock).mockRejectedValue(new Error('purchase failed'));

    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Manage Subscription')).toBeTruthy();
      expect(screen.getByText('Money Basics')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Manage Subscription'));
    });

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('Upgrade to Pro'));
    await waitFor(() => {
      expect(screen.getByText('purchase failed')).toBeTruthy();
    });
  });

  it('shows catalog-load errors and successful purchase restoration in learn', async () => {
    (storeBilling.listSubscriptionProducts as jest.Mock).mockRejectedValue(new Error('catalog failed'));
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
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

    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('catalog failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Purchases'));
    await waitFor(() => {
      expect(api.syncEntitlement).toHaveBeenCalledWith(auth, {
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-ios-restore-12345'
      });
      expect(screen.getByText('Moneta Pro restored (sandbox mode).')).toBeTruthy();
    });
  });

  it('covers learn legal links, restore failures, and cleanup disconnects', async () => {
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
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
    (storeBilling.restoreLatestSubscription as jest.Mock).mockRejectedValue(new Error('restore failed'));
    (storeBilling.disconnectStoreBilling as jest.Mock).mockRejectedValue(new Error('disconnect failed'));
    (legal.openLegalDoc as jest.Mock)
      .mockResolvedValueOnce({ opened: false, error: 'privacy unavailable' })
      .mockResolvedValueOnce({ opened: false, error: 'terms unavailable' });

    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={{ accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() }} onOpenLesson={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Privacy')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Privacy'));
    await waitFor(() => {
      expect(screen.getByText('privacy unavailable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Terms'));
    await waitFor(() => {
      expect(screen.getByText('terms unavailable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Purchases'));
    await waitFor(() => {
      expect(screen.getByText('restore failed')).toBeTruthy();
    });

    screen.unmount();
    expect(storeBilling.disconnectStoreBilling).toHaveBeenCalled();
  });

  it('shows an empty pro learning path without the paywall', async () => {
    (api.fetchToday as jest.Mock).mockResolvedValue({
      userId: 'u1',
      dueReviews: [],
      entitlement: {
        plan: 'pro',
        isActive: true,
        source: 'ios',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: true,
        certificates: true,
        streakRepair: true,
        unlimitedReviews: true,
        maxDueReviews: null
      }
    });
    (api.fetchLearningPath as jest.Mock).mockResolvedValue({
      userId: 'u1',
      entitlement: {
        plan: 'pro',
        isActive: true,
        source: 'ios',
        updatedAt: new Date().toISOString()
      },
      features: {
        advancedTracks: true,
        certificates: true,
        streakRepair: true,
        unlimitedReviews: true,
        maxDueReviews: null
      },
      lessons: []
    });

    const screen = renderWithQueryClient(<LearnScreen userId="u1" auth={{ accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() }} onOpenLesson={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Plan: Pro')).toBeTruthy();
      expect(screen.getByText('No lessons published yet.')).toBeTruthy();
    });

    expect(screen.queryByText('Unlock Pro to access advanced tracks')).toBeNull();
  });

  it('supports profile sign-out actions and errors', async () => {
    const onLogout = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
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

    const screen = renderWithQueryClient(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(api.fetchEntitlement).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('Sign out this device'));
    fireEvent.press(screen.getByText('Sign out all devices'));

    await waitFor(() => {
      expect(api.logout).toHaveBeenCalledWith('r');
      expect(api.logoutAll).toHaveBeenCalledWith(auth);
      expect(onLogout).toHaveBeenCalledTimes(2);
    });

    (api.logout as jest.Mock).mockRejectedValue(new Error('logout failed'));
    fireEvent.press(screen.getByText('Sign out this device'));

    await waitFor(() => {
      expect(screen.getByText('logout failed')).toBeTruthy();
    });
  });

  it('handles profile legal and account-management edge cases', async () => {
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const onLogout = jest.fn();
    (api.fetchEntitlement as jest.Mock).mockRejectedValue(new Error('entitlement failed'));
    (storeBilling.restoreLatestSubscription as jest.Mock).mockResolvedValue(null);
    (api.exportAccountData as jest.Mock).mockRejectedValue(new Error('export failed'));
    (api.deleteAccount as jest.Mock).mockRejectedValue(new Error('delete failed'));
    (legal.openLegalDoc as jest.Mock).mockResolvedValue({
      opened: false,
      error: 'policy unavailable'
    });

    const screen = renderWithQueryClient(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('entitlement failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Privacy Policy'));
    await waitFor(() => {
      expect(screen.getByText('policy unavailable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Subscription'));
    await waitFor(() => {
      expect(screen.getByText('No active subscription was found to restore.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Export Account Data'));
    await waitFor(() => {
      expect(screen.getByText('export failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Delete Account'));
    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete account?')).toBeNull();

    fireEvent.press(screen.getByText('Delete Account'));
    fireEvent.press(screen.getByText('Confirm Deletion'));

    await waitFor(() => {
      expect(screen.getByText('delete failed')).toBeTruthy();
      expect(onLogout).not.toHaveBeenCalled();
    });
  });

  it('restores purchases from store and syncs entitlement', async () => {
    const onLogout = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
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

    const screen = renderWithQueryClient(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('Restore Subscription')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Subscription'));

    await waitFor(() => {
      expect(storeBilling.restoreLatestSubscription).toHaveBeenCalled();
      expect(api.syncEntitlement).toHaveBeenCalledWith(auth, {
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-ios-restore-12345'
      });
      expect(screen.getByText('Pro access restored (sandbox).')).toBeTruthy();
    });
  });

  it('shows neutral restore messaging and logout-all failures in profile', async () => {
    const onLogout = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
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
    (storeBilling.restoreLatestSubscription as jest.Mock).mockResolvedValue({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-ios-restore-67890',
      sandbox: false
    });
    (api.syncEntitlement as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      entitlement: {
        plan: 'free',
        isActive: false,
        source: 'ios',
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
    (api.logoutAll as jest.Mock).mockRejectedValueOnce(new Error('logout-all failed'));

    const screen = renderWithQueryClient(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('Restore Subscription')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Subscription'));
    await waitFor(() => {
      expect(screen.getByText('Subscription restored, but no active Pro entitlement was found.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Sign out all devices'));
    await waitFor(() => {
      expect(screen.getByText('logout-all failed')).toBeTruthy();
    });
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('covers profile legal fallbacks and modal dismissal via request close', async () => {
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
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
    (legal.openLegalDoc as jest.Mock)
      .mockResolvedValueOnce({ opened: false })
      .mockResolvedValueOnce({ opened: true })
      .mockResolvedValueOnce({ opened: true })
      .mockRejectedValueOnce(new Error('disclaimer failed'))
      .mockResolvedValueOnce({ opened: true });

    const screen = renderWithQueryClient(<ProfileScreen onLogout={jest.fn()} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Privacy Policy'));
    await waitFor(() => {
      expect(screen.getByText('Unable to open legal document.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Terms of Service'));
    fireEvent.press(screen.getByText('Subscription Terms'));
    fireEvent.press(screen.getByText('Financial Education Disclaimer'));
    await waitFor(() => {
      expect(screen.getByText('disclaimer failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Account Deletion Policy'));
    expect(legal.openLegalDoc).toHaveBeenCalledTimes(5);

    fireEvent.press(screen.getByText('Delete Account'));
    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeTruthy();
    });

    act(() => {
      screen.UNSAFE_getByType(Modal).props.onRequestClose();
    });

    await waitFor(() => {
      expect(screen.queryByText('Delete account?')).toBeNull();
    });
  });

  it('exports and deletes account from profile', async () => {
    const onLogout = jest.fn();
    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    (api.fetchEntitlement as jest.Mock).mockResolvedValue({
      userId: 'u1',
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

    const screen = renderWithQueryClient(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('Export Account Data')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Export Account Data'));
    await waitFor(() => {
      expect(api.exportAccountData).toHaveBeenCalledWith(auth);
      expect(screen.getByText('Export ready: 2 sessions, 1 billing events.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Delete Account'));
    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Confirm Deletion'));
    await waitFor(() => {
      expect(api.deleteAccount).toHaveBeenCalledWith(auth);
      expect(onLogout).toHaveBeenCalled();
    });
  });

  it('requests password reset code and navigates to confirmation', async () => {
    const navigation = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const route = { key: 'PasswordResetRequest', name: 'PasswordResetRequest', params: { email: 'reset@example.com' } } as any;
    const screen = render(<PasswordResetRequestScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('Send Reset Code'));

    await waitFor(() => {
      expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'reset@example.com' });
      expect(navigation.navigate).toHaveBeenCalledWith('PasswordResetConfirm', { email: 'reset@example.com' });
    });
  });

  it('handles password reset request errors and back navigation', async () => {
    const navigation = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const route = { key: 'PasswordResetRequest', name: 'PasswordResetRequest', params: { email: 'reset@example.com' } } as any;
    (api.requestPasswordReset as jest.Mock).mockRejectedValue(new Error('email failed'));

    const screen = render(<PasswordResetRequestScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('← Back'));
    expect(navigation.goBack).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Send Reset Code'));
    await waitFor(() => {
      expect(screen.getByText('email failed')).toBeTruthy();
    });
  });

  it('confirms password reset code and returns to sign in', async () => {
    const navigation = { goBack: jest.fn(), popToTop: jest.fn() } as any;
    const route = { key: 'PasswordResetConfirm', name: 'PasswordResetConfirm', params: { email: 'reset@example.com' } } as any;
    const screen = render(<PasswordResetConfirmScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'updated@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('8-digit code'), '12345678');
    fireEvent.changeText(screen.getByPlaceholderText('New password'), 'newpassword123');
    fireEvent.press(screen.getByText('Reset Password'));

    await waitFor(() => {
      expect(api.confirmPasswordReset).toHaveBeenCalledWith({
        email: 'updated@example.com',
        code: '12345678',
        newPassword: 'newpassword123'
      });
      expect(screen.getByText('Password updated. You can sign in now.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Back to Sign In'));
    expect(navigation.popToTop).toHaveBeenCalled();
  });

  it('handles password reset confirmation failures and back navigation', async () => {
    const navigation = { goBack: jest.fn(), popToTop: jest.fn() } as any;
    const route = { key: 'PasswordResetConfirm', name: 'PasswordResetConfirm', params: { email: 'reset@example.com' } } as any;
    (api.confirmPasswordReset as jest.Mock).mockRejectedValue(new Error('code invalid'));

    const screen = render(<PasswordResetConfirmScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('← Back'));
    expect(navigation.goBack).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Reset Password'));
    await waitFor(() => {
      expect(screen.getByText('code invalid')).toBeTruthy();
    });
  });

  it('supports forgot-password and legal error flows from login', async () => {
    const onForgotPassword = jest.fn();
    (legal.openLegalDoc as jest.Mock).mockResolvedValue({
      opened: false,
      error: 'legal down'
    });

    const screen = render(<LoginScreen onAuthenticated={jest.fn()} onForgotPassword={onForgotPassword} />);

    fireEvent.press(screen.getByText('Forgot password?'));
    expect(onForgotPassword).toHaveBeenCalledWith('demo@example.com');

    fireEvent.press(screen.getByText('Privacy Policy'));
    await waitFor(() => {
      expect(screen.getByText('legal down')).toBeTruthy();
    });
  });
});

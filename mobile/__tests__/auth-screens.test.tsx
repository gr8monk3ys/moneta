import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { LearnScreen } from '../src/screens/LearnScreen';
import { LoginScreen } from '../src/screens/LoginScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import * as api from '../src/lib/api';
import * as storeBilling from '../src/lib/storeBilling';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  login: jest.fn(),
  register: jest.fn(),
  fetchProgress: jest.fn(),
  fetchToday: jest.fn(),
  fetchLearningPath: jest.fn(),
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

describe('mobile auth-driven screens', () => {
  beforeEach(() => {
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
    fireEvent.press(screen.getByText('Start Learning'));

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
    fireEvent.press(screen.getByText('Start Learning'));

    await waitFor(() => {
      expect(screen.getByText('Login response did not include a userId')).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('handles login quick-create failures', async () => {
    const screen = render(<LoginScreen onAuthenticated={jest.fn()} />);
    (api.register as jest.Mock).mockRejectedValue(new Error('register failed'));

    fireEvent.press(screen.getByText('Create Demo User'));

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

    const screen = render(<HomeScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} onStartReviews={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Next: Next Up')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Run Placement'));
    await waitFor(() => {
      expect(api.submitPlacement).toHaveBeenCalled();
      expect(screen.getByText('Placed at F3')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Submit Practice Session'));
    await waitFor(() => {
      expect(api.completeSession).toHaveBeenCalled();
      expect(screen.getByText('Session complete • streak 8')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Refresh Session'));
    await waitFor(() => {
      expect(onTokensUpdated).toHaveBeenCalledWith({
        accessToken: 'na',
        refreshToken: 'nr',
        sessionId: 'ns'
      });
    });
  });

  it('shows home error states', async () => {
    (api.fetchProgress as jest.Mock).mockRejectedValue(new Error('dashboard failed'));
    (api.fetchToday as jest.Mock).mockRejectedValue(new Error('dashboard failed'));
    (api.refresh as jest.Mock).mockRejectedValue(new Error('refresh failed'));

    const auth = { accessToken: 'a', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const screen = render(<HomeScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} onStartReviews={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('dashboard failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Refresh Session'));
    await waitFor(() => {
      expect(screen.getByText('refresh failed')).toBeTruthy();
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

    const screen = render(<LearnScreen userId="u1" auth={auth} onOpenLesson={jest.fn()} />);

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

    const screen = render(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

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

    const screen = render(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('Restore Pro Access')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Restore Pro Access'));

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

    const screen = render(<ProfileScreen onLogout={onLogout} userId="u1" auth={auth} />);

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
      expect(screen.getByText('Tap \"Delete Account\" again to confirm permanent deletion.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Delete Account'));
    await waitFor(() => {
      expect(api.deleteAccount).toHaveBeenCalledWith(auth);
      expect(onLogout).toHaveBeenCalled();
    });
  });
});

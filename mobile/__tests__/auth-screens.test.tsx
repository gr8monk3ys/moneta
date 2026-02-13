import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { LoginScreen } from '../src/screens/LoginScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import * as api from '../src/lib/api';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  login: jest.fn(),
  register: jest.fn(),
  fetchProgress: jest.fn(),
  fetchToday: jest.fn(),
  submitPlacement: jest.fn(),
  completeSession: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  fetchEntitlement: jest.fn(),
  syncEntitlement: jest.fn()
}));

describe('mobile auth-driven screens', () => {
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

    const screen = render(<HomeScreen userId="u1" auth={auth} />);

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
    const screen = render(<HomeScreen userId="u1" auth={auth} />);

    await waitFor(() => {
      expect(screen.getByText('dashboard failed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Refresh Session'));
    await waitFor(() => {
      expect(screen.getByText('refresh failed')).toBeTruthy();
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
});

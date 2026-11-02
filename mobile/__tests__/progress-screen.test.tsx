import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ProgressScreen } from '../src/screens/ProgressScreen';
import * as api from '../src/lib/api';
import { createTestQueryClient } from './testUtils';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  fetchProgress: jest.fn(),
  repairStreak: jest.fn()
}));

describe('ProgressScreen', () => {
  const auth = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    onTokensUpdated: jest.fn()
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows launch-state progress copy before the learner has started', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F1',
      streakDays: 0,
      masteredSkills: 0,
      totalSkills: 0,
      plan: 'free',
      premiumActive: false
    });

    const screen = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProgressScreen userId="u1" auth={auth} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Foundations')).toBeTruthy();
      expect(screen.getByText('Complete your first lesson to unlock progress stats.')).toBeTruthy();
      expect(screen.getByText('Ready')).toBeTruthy();
      expect(screen.getByText('Start')).toBeTruthy();
      expect(screen.getByText('First Lesson')).toBeTruthy();
    });
  });

  const proProgress = {
    userId: 'u1',
    currentLevel: 'F2',
    streakDays: 6,
    masteredSkills: 2,
    totalSkills: 4,
    plan: 'pro',
    premiumActive: true
  };

  it('hides streak repair unless the server reports it available', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({ ...proProgress, streakRepairAvailable: false });

    const screen = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProgressScreen userId="u1" auth={auth} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('6')).toBeTruthy();
    });
    expect(screen.queryByText('Repair Streak')).toBeNull();
    expect(api.fetchProgress).toHaveBeenCalledWith('u1', auth, expect.any(String));
  });

  it('repairs a streak broken by one missed day and refreshes progress', async () => {
    (api.fetchProgress as jest.Mock)
      .mockResolvedValueOnce({ ...proProgress, streakRepairAvailable: true })
      .mockResolvedValue({ ...proProgress, streakRepairAvailable: false });
    (api.repairStreak as jest.Mock).mockResolvedValue({ userId: 'u1', streakDays: 6, lastActiveDate: '2026-03-09' });

    const screen = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProgressScreen userId="u1" auth={auth} />
      </QueryClientProvider>
    );

    fireEvent.press(await screen.findByText('Repair Streak'));

    await waitFor(() => {
      expect(screen.getByText('Streak repaired: 6 days. Finish a session today to keep it going.')).toBeTruthy();
    });
    expect(api.repairStreak).toHaveBeenCalledWith('u1', auth, expect.any(String));
    await waitFor(() => {
      expect(screen.queryByText('Repair Streak')).toBeNull();
    });
    expect(api.fetchProgress).toHaveBeenCalledTimes(2);
  });

  it('shows the server message when a streak repair is refused', async () => {
    (api.fetchProgress as jest.Mock).mockResolvedValue({ ...proProgress, streakRepairAvailable: true });
    (api.repairStreak as jest.Mock).mockRejectedValue(new Error('Streak is not currently broken'));

    const screen = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProgressScreen userId="u1" auth={auth} />
      </QueryClientProvider>
    );

    fireEvent.press(await screen.findByText('Repair Streak'));

    await waitFor(() => {
      expect(screen.getByText('Streak is not currently broken')).toBeTruthy();
    });
  });

  it('falls back to a generic error message when progress loading fails with a non-Error value', async () => {
    (api.fetchProgress as jest.Mock).mockRejectedValue('progress unavailable');

    const screen = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProgressScreen userId="u1" auth={auth} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Unknown error')).toBeTruthy();
    });
  });
});

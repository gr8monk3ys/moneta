import { render, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ProgressScreen } from '../src/screens/ProgressScreen';
import * as api from '../src/lib/api';
import { createTestQueryClient } from './testUtils';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  fetchProgress: jest.fn()
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

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BottomNav } from '../src/components/BottomNav';
import { LearnScreen } from '../src/screens/LearnScreen';
import { ProgressScreen } from '../src/screens/ProgressScreen';
import * as api from '../src/lib/api';
import * as storeBilling from '../src/lib/storeBilling';

jest.mock('../src/lib/api', () => ({
  ...jest.requireActual('../src/lib/api'),
  fetchToday: jest.fn(),
  fetchProgress: jest.fn()
}));

jest.mock('../src/lib/storeBilling', () => ({
  listSubscriptionProducts: jest.fn().mockResolvedValue([]),
  purchasePrimarySubscription: jest.fn().mockResolvedValue(null),
  restoreLatestSubscription: jest.fn().mockResolvedValue(null),
  disconnectStoreBilling: jest.fn().mockResolvedValue(undefined)
}));

const auth = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  onTokensUpdated: jest.fn()
};

describe('mobile presentational components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (api.fetchProgress as jest.Mock).mockResolvedValue({
      userId: 'u1',
      currentLevel: 'F2',
      streakDays: 7,
      masteredSkills: 2,
      totalSkills: 4,
      plan: 'free',
      premiumActive: false
    });
    (storeBilling.listSubscriptionProducts as jest.Mock).mockResolvedValue([
      {
        productId: 'moneta.pro.monthly',
        title: 'Moneta Pro',
        description: 'Monthly plan',
        displayPrice: '$7.99'
      }
    ]);
  });

  it('changes tabs from bottom nav', () => {
    const onChange = jest.fn();
    const screen = render(<BottomNav value="home" onChange={onChange} />);

    fireEvent.press(screen.getByText('Learn'));
    expect(onChange).toHaveBeenCalledWith('learn');
  });

  it('renders learn and progress screens', async () => {
    const learn = render(<LearnScreen userId="u1" auth={auth} />);
    expect(learn.getByText('Learning Path')).toBeTruthy();
    expect(learn.getByText('1. Money Basics')).toBeTruthy();

    await waitFor(() => {
      expect(learn.getByText('Up next: Next Up')).toBeTruthy();
    });

    const progress = render(<ProgressScreen userId="u1" auth={auth} />);
    await waitFor(() => {
      expect(progress.getByText('Everyday Decision-Making')).toBeTruthy();
      expect(progress.getByText('2/4')).toBeTruthy();
      expect(progress.getByText('50%')).toBeTruthy();
      expect(progress.getByText('7')).toBeTruthy();
    });
  });
});

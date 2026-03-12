import { render } from '@testing-library/react-native';
import App from '../App';

const mockState = {
  auth: null as null | { accessToken: string; refreshToken: string; userId: string; sessionId: string },
  bootstrapping: false,
  login: jest.fn(),
  updateTokens: jest.fn(),
  logout: jest.fn()
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuthState: () => mockState
}));

describe('Moneta mobile app', () => {
  beforeEach(() => {
    mockState.auth = null;
    mockState.bootstrapping = false;
  });

  it('shows loading indicator while bootstrapping', () => {
    mockState.bootstrapping = true;
    const screen = render(<App />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows login screen when unauthenticated', () => {
    const screen = render(<App />);
    expect(screen.getByText('Build money confidence in 5-minute lessons')).toBeTruthy();
  });

  it('shows tabs when authenticated', () => {
    mockState.auth = {
      accessToken: 'a',
      refreshToken: 'r',
      userId: 'u1',
      sessionId: 's1'
    };

    const screen = render(<App />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Learn')).toBeTruthy();
  });
});

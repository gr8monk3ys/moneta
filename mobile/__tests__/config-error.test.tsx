import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ConfigErrorScreen, FatalErrorScreen } from '../src/screens/ConfigErrorScreen';
import { getMissingRequiredSettings } from '../src/lib/env';

describe('configuration failure surfaces', () => {
  const devGlobal = global as typeof globalThis & { __DEV__?: boolean };
  const originalDev = devGlobal.__DEV__;
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    devGlobal.__DEV__ = originalDev;
    if (originalBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
    }
  });

  it('flags a missing API base URL in non-dev builds', () => {
    devGlobal.__DEV__ = false;
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    expect(getMissingRequiredSettings().map((setting) => setting.name)).toEqual(['EXPO_PUBLIC_API_BASE_URL']);
  });

  it('reports nothing missing when the API base URL is set', () => {
    devGlobal.__DEV__ = false;
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';

    expect(getMissingRequiredSettings()).toEqual([]);
  });

  it('names the variable and an example value on the config screen', () => {
    const screen = render(
      <ConfigErrorScreen
        missing={[
          {
            name: 'EXPO_PUBLIC_API_BASE_URL',
            purpose: 'Where the app sends every sign-in and lesson request.',
            example: 'https://api.moneta.app'
          }
        ]}
      />
    );

    expect(screen.getByTestId('config-error-screen')).toBeTruthy();
    expect(screen.getByText("Moneta isn't pointed at a backend yet")).toBeTruthy();
    expect(screen.getByText('EXPO_PUBLIC_API_BASE_URL=https://api.moneta.app')).toBeTruthy();
  });

  it('renders a legible message for an unexpected error', () => {
    const screen = render(<FatalErrorScreen error={new Error('boom')} />);
    expect(screen.getByTestId('fatal-error-screen')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('catches a render-time throw instead of blanking the screen', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    function Exploding(): never {
      throw new Error('render exploded');
    }

    const screen = render(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fatal-error-screen')).toBeTruthy();
    expect(screen.getByText('render exploded')).toBeTruthy();
    consoleError.mockRestore();
  });
});

import { Linking } from 'react-native';

const originalEnv = { ...process.env };
const devGlobal = global as typeof globalThis & { __DEV__: boolean };
const originalDev = devGlobal.__DEV__;

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

describe('legal link helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    restoreEnv();
    devGlobal.__DEV__ = true;
  });

  afterEach(() => {
    restoreEnv();
    devGlobal.__DEV__ = originalDev;
  });

  it('opens configured legal URLs', async () => {
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = 'http://localhost:3000/privacy';
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockImplementation(async () => undefined);

    const { getLegalUrl, openLegalDoc } = require('../src/lib/legal');

    expect(getLegalUrl('privacy')).toBe('http://localhost:3000/privacy');
    await expect(openLegalDoc('privacy')).resolves.toEqual({ opened: true });
    expect(Linking.openURL).toHaveBeenCalledWith('http://localhost:3000/privacy');
  });

  it('rejects insecure URLs outside development', async () => {
    devGlobal.__DEV__ = false;
    process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL = 'http://localhost:3000/terms';

    const { getLegalUrl, openLegalDoc } = require('../src/lib/legal');

    expect(getLegalUrl('terms')).toBeNull();
    await expect(openLegalDoc('terms')).resolves.toEqual({
      opened: false,
      error: 'Legal URL is not configured for this build.'
    });
  });

  it('reports device failures to open configured URLs', async () => {
    process.env.EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL = 'https://moneta.app/disclaimer';
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);

    const { openLegalDoc } = require('../src/lib/legal');

    await expect(openLegalDoc('disclaimer')).resolves.toEqual({
      opened: false,
      error: 'This device cannot open the configured URL.'
    });
  });

  it('supports the subscription and deletion policy URLs', async () => {
    process.env.EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL = 'https://moneta.app/subscription-terms';
    process.env.EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL = 'https://moneta.app/delete-account';
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockImplementation(async () => undefined);

    const { getLegalUrl, openLegalDoc } = require('../src/lib/legal');

    expect(getLegalUrl('subscription')).toBe('https://moneta.app/subscription-terms');
    expect(getLegalUrl('deletion')).toBe('https://moneta.app/delete-account');
    await expect(openLegalDoc('deletion')).resolves.toEqual({ opened: true });
    expect(Linking.openURL).toHaveBeenCalledWith('https://moneta.app/delete-account');
  });

  it('returns null for an unrecognized runtime key', () => {
    const { getLegalUrl } = require('../src/lib/legal');

    expect(getLegalUrl('unknown-doc' as never)).toBeNull();
  });
});

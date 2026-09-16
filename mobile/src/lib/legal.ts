import { Linking } from 'react-native';
import { readPublicEnv } from './env';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export type LegalDocKey = 'privacy' | 'terms' | 'subscription' | 'deletion' | 'disclaimer';

function readUrl(key: LegalDocKey): string | undefined {
  switch (key) {
    case 'privacy':
      return readPublicEnv('EXPO_PUBLIC_PRIVACY_POLICY_URL');
    case 'terms':
      return readPublicEnv('EXPO_PUBLIC_TERMS_OF_SERVICE_URL');
    case 'subscription':
      return readPublicEnv('EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL');
    case 'deletion':
      return readPublicEnv('EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL');
    case 'disclaimer':
      return readPublicEnv('EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL');
    default: {
      const exhaustive: never = key;
      void exhaustive;
      return undefined;
    }
  }
}

export function getLegalUrl(key: LegalDocKey): string | null {
  const raw = readUrl(key)?.trim();
  if (!raw) {
    return null;
  }

  // In non-dev builds we expect published HTTPS policy URLs.
  if (!isDev && !raw.startsWith('https://')) {
    return null;
  }

  return raw;
}

export async function openLegalDoc(key: LegalDocKey): Promise<{ opened: boolean; error?: string }> {
  const url = getLegalUrl(key);
  if (!url) {
    return { opened: false, error: 'Legal URL is not configured for this build.' };
  }

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    return { opened: false, error: 'This device cannot open the configured URL.' };
  }

  await Linking.openURL(url);
  return { opened: true };
}

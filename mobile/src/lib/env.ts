// Client environment access for the Expo app.
//
// IMPORTANT: every read below is written out longhand as
// `process.env.EXPO_PUBLIC_...`. That exact member expression is what
// babel-preset-expo rewrites into `require('expo/virtual/env').env.X`, the
// virtual module Metro fills with the values present when the bundle was
// built. Reading through an alias — `const env = globalThis.process?.env;
// env?.EXPO_PUBLIC_API_BASE_URL` — is invisible to that transform, so the
// value never reaches the bundle and every lookup returns undefined at
// runtime no matter what was exported on the command line. Keep the reads
// literal, and add new variables to this switch rather than reading
// process.env directly from feature code.

export type PublicEnvName =
  | 'EXPO_PUBLIC_API_BASE_URL'
  | 'EXPO_PUBLIC_PRIVACY_POLICY_URL'
  | 'EXPO_PUBLIC_TERMS_OF_SERVICE_URL'
  | 'EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL'
  | 'EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL'
  | 'EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL'
  | 'EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS'
  | 'EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS'
  | 'EXPO_PUBLIC_BILLING_SANDBOX_MODE';

export function readPublicEnv(name: PublicEnvName): string | undefined {
  switch (name) {
    case 'EXPO_PUBLIC_API_BASE_URL':
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    case 'EXPO_PUBLIC_PRIVACY_POLICY_URL':
      return process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    case 'EXPO_PUBLIC_TERMS_OF_SERVICE_URL':
      return process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
    case 'EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL':
      return process.env.EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL;
    case 'EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL':
      return process.env.EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL;
    case 'EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL':
      return process.env.EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL;
    case 'EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS':
      return process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS;
    case 'EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS':
      return process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS;
    case 'EXPO_PUBLIC_BILLING_SANDBOX_MODE':
      return process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE;
    default: {
      const exhaustive: never = name;
      void exhaustive;
      return undefined;
    }
  }
}

export interface MissingSetting {
  name: PublicEnvName;
  purpose: string;
  example: string;
}

/**
 * Settings the app cannot start without. Everything else degrades gracefully
 * (a legal link that refuses to open, billing that falls back to sandbox);
 * without an API base URL there is nothing the app can usefully show.
 */
export function getMissingRequiredSettings(): MissingSetting[] {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const missing: MissingSetting[] = [];

  const apiBaseUrl = readPublicEnv('EXPO_PUBLIC_API_BASE_URL')?.trim();
  if (!apiBaseUrl && !isDev) {
    missing.push({
      name: 'EXPO_PUBLIC_API_BASE_URL',
      purpose: 'Where the app sends every sign-in and lesson request.',
      example: 'https://api.moneta.app'
    });
  }

  return missing;
}

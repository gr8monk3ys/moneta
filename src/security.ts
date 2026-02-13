const WEAK_EXACT_VALUES = new Set([
  '',
  'dev-secret-change-me',
  'change-me',
  'change-me-too',
  'change-me-in-production',
  'replace-with-strong-token',
  'replace-me',
  'secret',
  'secrets',
  'password',
  'password123',
  'default',
  'test-secret',
  'test-refresh-secret'
]);

const WEAK_FRAGMENTS = [
  'change-me',
  'changeme',
  'replace-with',
  'replace-me',
  'placeholder',
  'example',
  'dev-secret'
];

function normalizeSecret(secret: string): string {
  return secret.trim().toLowerCase();
}

export function isWeakSecret(secret: string, minLength: number): boolean {
  const normalized = normalizeSecret(secret);
  if (normalized.length < minLength) {
    return true;
  }

  if (WEAK_EXACT_VALUES.has(normalized)) {
    return true;
  }

  return WEAK_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

interface ResolveRequiredSecretOptions {
  nodeEnv: string;
  configured: string | undefined;
  envName: string;
  minLength: number;
  devFallback: string;
}

export function resolveRequiredSecret(options: ResolveRequiredSecretOptions): string {
  const { nodeEnv, configured, envName, minLength, devFallback } = options;

  if (configured && nodeEnv !== 'production') {
    return configured;
  }

  if (configured && !isWeakSecret(configured, minLength)) {
    return configured;
  }

  if (nodeEnv === 'production') {
    if (!configured) {
      throw new Error(`${envName} must be set in production`);
    }

    throw new Error(`${envName} must be at least ${minLength} characters and not use placeholder/default values`);
  }

  return devFallback;
}

interface ResolveProtectedTokenOptions {
  nodeEnv: string;
  configured: string | undefined;
  envName: string;
  minLength: number;
}

export function resolveProtectedToken(options: ResolveProtectedTokenOptions): string | undefined {
  const { nodeEnv, configured, envName, minLength } = options;

  if (!configured) {
    if (nodeEnv === 'production') {
      throw new Error(`${envName} must be set in production`);
    }
    return undefined;
  }

  if (nodeEnv === 'production' && isWeakSecret(configured, minLength)) {
    throw new Error(`${envName} must be at least ${minLength} characters and not use placeholder/default values`);
  }

  return configured;
}

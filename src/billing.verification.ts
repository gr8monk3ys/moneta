import crypto from 'node:crypto';
import { ApiError } from './errors.js';
import type { BillingPlatform, EntitlementSource } from './types.js';

interface AppleReceiptTransaction {
  product_id?: string;
  expires_date_ms?: string;
  cancellation_date_ms?: string;
  transaction_id?: string;
}

interface AppleVerifyReceiptResponse {
  status?: number;
  latest_receipt_info?: AppleReceiptTransaction[];
  receipt?: {
    in_app?: AppleReceiptTransaction[];
  };
}

interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleSubscriptionLineItem {
  productId?: string;
  expiryTime?: string;
}

interface GoogleSubscriptionResponse {
  subscriptionState?: string;
  latestOrderId?: string;
  lineItems?: GoogleSubscriptionLineItem[];
}

const GOOGLE_ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const GOOGLE_DEFAULT_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SUBSCRIPTIONS_V2_API_ROOT = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const APPLE_VERIFY_RECEIPT_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_RECEIPT_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export interface VerifyPurchaseInput {
  platform: BillingPlatform;
  productId: string;
  purchaseToken: string;
  now?: Date;
}

export interface VerifiedPurchase {
  source: Extract<EntitlementSource, BillingPlatform>;
  productId: string;
  isActive: boolean;
  currentPeriodEndsAt?: string;
  verificationReference?: string;
}

export interface BillingVerifier {
  verifyPurchase(input: VerifyPurchaseInput): Promise<VerifiedPurchase>;
  verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    timestampHeader?: string | undefined
  ): boolean;
}

interface BillingVerifierOptions {
  nodeEnv: string;
  allowSandboxTokens: boolean;
  subscriptionsDisabled?: boolean;
  webhookSecret?: string;
  appleSharedSecret?: string;
  appleProductionVerifyUrl?: string;
  appleSandboxVerifyUrl?: string;
  googlePackageName?: string;
  googleServiceAccountJson?: string;
  googleTokenUrl?: string;
  timeoutMs?: number;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function parseTimeoutMs(value: number | undefined): number {
  const fallback = 8_000;
  if (!value || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

function toHmacHex(secret: string, timestamp: string, payload: Buffer): string {
  return crypto
    .createHmac('sha256', secret)
    .update(timestamp)
    .update('.')
    .update(payload)
    .digest('hex');
}

function parseSignatureHeader(signatureHeader: string | undefined): { timestamp: string; signature: string } | null {
  if (!signatureHeader) {
    return null;
  }

  if (signatureHeader.includes(',')) {
    const pairs = signatureHeader
      .split(',')
      .map((part) => part.trim())
      .map((part) => part.split('='))
      .filter((parts) => parts.length === 2)
      .map((parts) => [parts[0], parts[1]] as const);

    const timestamp = pairs.find((pair) => pair[0] === 't')?.[1];
    const signature = pairs.find((pair) => pair[0] === 'v1')?.[1];
    if (!timestamp || !signature) {
      return null;
    }

    return { timestamp, signature };
  }

  const [timestamp, signature] = signatureHeader.split('.', 2);
  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function createSandboxPurchase(platform: BillingPlatform, productId: string, now: Date): VerifiedPurchase {
  return {
    source: platform,
    productId,
    isActive: true,
    currentPeriodEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    verificationReference: `sandbox-${platform}`
  };
}

function parseServiceAccount(rawJson: string): GoogleServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new ApiError(500, 'Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError(500, 'Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  }

  const clientEmail = (parsed as { client_email?: unknown }).client_email;
  const privateKey = (parsed as { private_key?: unknown }).private_key;
  const tokenUri = (parsed as { token_uri?: unknown }).token_uri;

  if (typeof clientEmail !== 'string' || clientEmail.length === 0) {
    throw new ApiError(500, 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing client_email');
  }

  if (typeof privateKey !== 'string' || privateKey.length === 0) {
    throw new ApiError(500, 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing private_key');
  }

  const normalizedPrivateKey = privateKey.includes('\\n')
    ? privateKey.replace(/\\n/g, '\n')
    : privateKey;

  return {
    client_email: clientEmail,
    private_key: normalizedPrivateKey,
    token_uri: typeof tokenUri === 'string' && tokenUri.length > 0 ? tokenUri : undefined
  };
}

async function postJson<T>(url: string, payload: unknown, timeoutMs: number, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(502, `Billing provider request failed (${response.status})`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, 'Billing provider request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function postForm<T>(url: string, body: URLSearchParams, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString(),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(502, `Billing provider auth failed (${response.status})`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, 'Billing provider auth failed');
  } finally {
    clearTimeout(timeout);
  }
}

function parseAppleExpiry(
  transactions: AppleReceiptTransaction[],
  now: Date
): { active: boolean; currentPeriodEndsAt: string; transactionId?: string } | null {
  let latest: AppleReceiptTransaction | undefined;
  let latestExpiryMs: number | undefined;

  for (const transaction of transactions) {
    const expiryMs = Number(transaction.expires_date_ms ?? '');
    if (!Number.isFinite(expiryMs) || expiryMs <= 0) {
      continue;
    }

    if (latestExpiryMs === undefined || expiryMs >= latestExpiryMs) {
      latest = transaction;
      latestExpiryMs = expiryMs;
    }
  }

  if (!latest || latestExpiryMs === undefined) {
    return null;
  }

  const currentPeriodEndsAt = new Date(latestExpiryMs).toISOString();
  const active = !latest.cancellation_date_ms && latestExpiryMs > now.getTime();

  return {
    active,
    currentPeriodEndsAt,
    transactionId: latest.transaction_id
  };
}

async function verifyApplePurchase(
  input: VerifyPurchaseInput,
  options: BillingVerifierOptions,
  now: Date
): Promise<VerifiedPurchase> {
  if (options.allowSandboxTokens && input.purchaseToken.startsWith('sandbox-')) {
    return createSandboxPurchase('ios', input.productId, now);
  }

  if (!options.appleSharedSecret) {
    throw new ApiError(400, 'Apple billing verification is not configured');
  }

  const timeoutMs = parseTimeoutMs(options.timeoutMs);
  const payload = {
    'receipt-data': input.purchaseToken,
    password: options.appleSharedSecret,
    'exclude-old-transactions': true
  };

  let verification = await postJson<AppleVerifyReceiptResponse>(
    options.appleProductionVerifyUrl ?? APPLE_VERIFY_RECEIPT_PRODUCTION,
    payload,
    timeoutMs
  );

  if (verification.status === 21007) {
    verification = await postJson<AppleVerifyReceiptResponse>(
      options.appleSandboxVerifyUrl ?? APPLE_VERIFY_RECEIPT_SANDBOX,
      payload,
      timeoutMs
    );
  }

  if (verification.status !== 0) {
    throw new ApiError(402, 'Apple purchase could not be verified');
  }

  const transactions = [
    ...(verification.latest_receipt_info ?? []),
    ...(verification.receipt?.in_app ?? [])
  ];

  if (transactions.length === 0) {
    throw new ApiError(402, 'Apple purchase could not be verified');
  }

  const matchingTransactions = transactions.filter((transaction) => transaction.product_id === input.productId);
  if (matchingTransactions.length === 0) {
    throw new ApiError(402, 'Apple purchase did not match product');
  }

  const parsed = parseAppleExpiry(matchingTransactions, now);
  if (!parsed) {
    throw new ApiError(402, 'Apple subscription receipt was missing an expiry');
  }

  return {
    source: 'ios',
    productId: input.productId,
    isActive: parsed.active,
    currentPeriodEndsAt: parsed.currentPeriodEndsAt,
    verificationReference: parsed.transactionId
  };
}

function createGoogleAssertion(account: GoogleServiceAccount, now: Date): string {
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + 3600;

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: account.client_email,
    scope: GOOGLE_ANDROID_PUBLISHER_SCOPE,
    aud: account.token_uri ?? GOOGLE_DEFAULT_TOKEN_URL,
    iat,
    exp
  }));

  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();

  const signature = signer.sign(account.private_key);
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken(
  account: GoogleServiceAccount,
  timeoutMs: number,
  now: Date,
  tokenUrl?: string
): Promise<string> {
  const assertion = createGoogleAssertion(account, now);
  const response = await postForm<GoogleTokenResponse>(
    tokenUrl ?? account.token_uri ?? GOOGLE_DEFAULT_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }),
    timeoutMs
  );

  if (!response.access_token) {
    throw new ApiError(502, 'Google Play auth response was missing access_token');
  }

  return response.access_token;
}

async function verifyGooglePurchase(
  input: VerifyPurchaseInput,
  options: BillingVerifierOptions,
  now: Date
): Promise<VerifiedPurchase> {
  if (options.allowSandboxTokens && input.purchaseToken.startsWith('sandbox-')) {
    return createSandboxPurchase('android', input.productId, now);
  }

  if (!options.googlePackageName || !options.googleServiceAccountJson) {
    throw new ApiError(400, 'Google Play billing verification is not configured');
  }

  const timeoutMs = parseTimeoutMs(options.timeoutMs);
  const serviceAccount = parseServiceAccount(options.googleServiceAccountJson);
  const accessToken = await getGoogleAccessToken(serviceAccount, timeoutMs, now, options.googleTokenUrl);

  const encodedPackageName = encodeURIComponent(options.googlePackageName);
  const encodedPurchaseToken = encodeURIComponent(input.purchaseToken);
  const url = `${GOOGLE_SUBSCRIPTIONS_V2_API_ROOT}/applications/${encodedPackageName}/purchases/subscriptionsv2/tokens/${encodedPurchaseToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let purchase: GoogleSubscriptionResponse;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        throw new ApiError(402, 'Google Play purchase was not found');
      }
      throw new ApiError(502, `Google Play billing verification failed (${response.status})`);
    }

    purchase = await response.json() as GoogleSubscriptionResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(502, 'Google Play billing verification failed');
  } finally {
    clearTimeout(timeout);
  }

  const lineItems = purchase.lineItems ?? [];
  const lineItem = lineItems.find((item) => item.productId === input.productId);
  if (!lineItem) {
    throw new ApiError(402, 'Google Play purchase did not match product');
  }

  const expiryMs = lineItem.expiryTime ? Date.parse(lineItem.expiryTime) : NaN;
  if (!Number.isFinite(expiryMs)) {
    throw new ApiError(402, 'Google Play purchase was missing a valid expiry');
  }

  const isStateActive = purchase.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE'
    || purchase.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
  const isActive = isStateActive && expiryMs > now.getTime();

  return {
    source: 'android',
    productId: input.productId,
    isActive,
    currentPeriodEndsAt: new Date(expiryMs).toISOString(),
    verificationReference: purchase.latestOrderId
  };
}

export function createWebhookSignature(secret: string, rawBody: Buffer, timestamp: string): string {
  const digest = toHmacHex(secret, timestamp, rawBody);
  return `${timestamp}.${digest}`;
}

export function createBillingVerifier(options: BillingVerifierOptions): BillingVerifier {
  // Sandbox purchase tokens grant entitlements without contacting a real provider, so
  // they must never be honored in production regardless of how the env var is set.
  const allowSandboxTokens = options.nodeEnv === 'production'
    ? false
    : parseBoolean(String(options.allowSandboxTokens), options.nodeEnv !== 'production');
  const hasAppleConfig = Boolean(options.appleSharedSecret);
  const hasGoogleConfig = Boolean(options.googlePackageName && options.googleServiceAccountJson);

  if (options.nodeEnv === 'production' && !options.webhookSecret) {
    throw new Error('BILLING_WEBHOOK_SECRET must be configured in production');
  }

  // SUBSCRIPTIONS=disabled is a deliberate launch posture: purchase
  // verification reports itself unavailable instead of requiring provider
  // credentials that don't exist yet. The webhook secret stays mandatory so
  // that endpoint remains locked, and sandbox tokens stay dead either way.
  if (options.nodeEnv === 'production' && !options.subscriptionsDisabled && !hasAppleConfig && !hasGoogleConfig) {
    throw new Error(
      'At least one billing provider verifier (Apple or Google Play) must be configured in production (or set SUBSCRIPTIONS=disabled to launch without purchases)'
    );
  }

  return {
    async verifyPurchase(input: VerifyPurchaseInput): Promise<VerifiedPurchase> {
      if (options.subscriptionsDisabled) {
        throw new ApiError(503, 'Subscriptions are not available yet.');
      }

      const now = input.now ?? new Date();

      if (input.platform === 'ios') {
        return verifyApplePurchase(input, {
          ...options,
          allowSandboxTokens
        }, now);
      }

      if (input.platform === 'android') {
        return verifyGooglePurchase(input, {
          ...options,
          allowSandboxTokens
        }, now);
      }

      if (allowSandboxTokens && input.purchaseToken.startsWith('sandbox-')) {
        return createSandboxPurchase('web', input.productId, now);
      }

      throw new ApiError(400, 'Web billing verification is not configured');
    },

    verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, timestampHeader?: string | undefined): boolean {
      if (!options.webhookSecret) {
        return false;
      }

      const parsed = parseSignatureHeader(signatureHeader);
      if (!parsed) {
        return false;
      }

      if (timestampHeader && timestampHeader !== parsed.timestamp) {
        return false;
      }

      const timestamp = parsed.timestamp;
      if (!timestamp || !/^\d+$/.test(timestamp)) {
        return false;
      }

      const nowEpochSeconds = Math.floor(Date.now() / 1000);
      const signatureEpochSeconds = Number(timestamp);
      if (Math.abs(nowEpochSeconds - signatureEpochSeconds) > WEBHOOK_SIGNATURE_TOLERANCE_SECONDS) {
        return false;
      }

      const expected = toHmacHex(options.webhookSecret, timestamp, rawBody);
      return timingSafeEqualHex(expected, parsed.signature);
    }
  };
}

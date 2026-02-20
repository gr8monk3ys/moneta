import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBillingVerifier, createWebhookSignature } from '../src/billing.verification.js';

interface JsonResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function mockJsonResponse(status: number, body: unknown): JsonResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});


const TEST_PRIVATE_KEY = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({
  type: 'pkcs8',
  format: 'pem'
}).toString();

function createGoogleServiceAccountJson(): string {
  return JSON.stringify({
    client_email: 'svc@project.iam.gserviceaccount.com',
    private_key: TEST_PRIVATE_KEY.replace(/\n/g, '\\n')
  });
}

describe('billing verification', () => {
  it('requires webhook and provider config in production', () => {
    expect(() => createBillingVerifier({
      nodeEnv: 'production',
      allowSandboxTokens: false
    })).toThrow('BILLING_WEBHOOK_SECRET must be configured in production');

    expect(() => createBillingVerifier({
      nodeEnv: 'production',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret'
    })).toThrow('At least one billing provider verifier');
  });

  it('verifies sandbox purchases in development without provider credentials', async () => {
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: 'webhook-secret'
    });

    const ios = await verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-ios-token'
    });
    const android = await verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.yearly',
      purchaseToken: 'sandbox-android-token'
    });
    const web = await verifier.verifyPurchase({
      platform: 'web',
      productId: 'moneta.pro.web',
      purchaseToken: 'sandbox-web-token'
    });

    expect(ios.isActive).toBe(true);
    expect(ios.source).toBe('ios');
    expect(android.isActive).toBe(true);
    expect(android.source).toBe('android');
    expect(web.source).toBe('web');
    expect(web.verificationReference).toBe('sandbox-web');
  });

  it('verifies apple purchases and retries sandbox endpoint for status 21007', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('buy.itunes.apple.com')) {
        return mockJsonResponse(200, { status: 21007 }) as Response;
      }

      return mockJsonResponse(200, {
        status: 0,
        latest_receipt_info: [
          {
            product_id: 'moneta.pro.monthly',
            expires_date_ms: String(Date.now() + 24 * 60 * 60 * 1000),
            transaction_id: 'txn_123'
          }
        ]
      }) as Response;
    });

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-secret'
    });

    const result = await verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'receipt-token'
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.source).toBe('ios');
    expect(result.isActive).toBe(true);
    expect(result.verificationReference).toBe('txn_123');
  });

  it('returns inactive apple purchase when cancellation is present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockJsonResponse(200, {
        status: 0,
        receipt: {
          in_app: [
            {
              product_id: 'moneta.pro.monthly',
              expires_date_ms: String(Date.now() + 24 * 60 * 60 * 1000),
              cancellation_date_ms: String(Date.now()),
              transaction_id: 'txn_cancelled'
            }
          ]
        }
      }) as Response
    );

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-secret'
    });

    const result = await verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'receipt-token'
    });

    expect(result.isActive).toBe(false);
    expect(result.currentPeriodEndsAt).toBeUndefined();
  });

  it('throws when apple verification fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonResponse(200, { status: 100 }) as Response);

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'receipt-token'
    })).rejects.toMatchObject({ statusCode: 402 });
  });

  it('throws when apple billing is not configured', async () => {
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'receipt-token'
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('verifies google purchase and maps active entitlement fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com/token') || (url.endsWith('/token') && !url.includes('/tokens/'))) {
        return mockJsonResponse(200, { access_token: 'google-access-token' }) as Response;
      }

      expect(init?.method).toBe('GET');
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer google-access-token' });
      return mockJsonResponse(200, {
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        latestOrderId: 'order-123',
        lineItems: [
          {
            productId: 'moneta.pro.yearly',
            expiryTime: new Date(Date.now() + 86_400_000).toISOString()
          }
        ]
      }) as Response;
    });

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.moneta.app',
      googleServiceAccountJson: createGoogleServiceAccountJson()
    });

    const result = await verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.yearly',
      purchaseToken: 'purchase-token'
    });

    expect(result.source).toBe('android');
    expect(result.isActive).toBe(true);
    expect(result.verificationReference).toBe('order-123');
    expect(result.currentPeriodEndsAt).toBeDefined();
  });

  it('throws when google auth is malformed or purchase is missing', async () => {
    const badJsonVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.moneta.app',
      googleServiceAccountJson: '{bad-json'
    });

    await expect(badJsonVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.yearly',
      purchaseToken: 'purchase-token'
    })).rejects.toMatchObject({ statusCode: 500 });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com/token') || (url.endsWith('/token') && !url.includes('/tokens/'))) {
        return mockJsonResponse(200, { access_token: 'google-access-token' }) as Response;
      }

      return mockJsonResponse(404, {}) as Response;
    });

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.moneta.app',
      googleServiceAccountJson: createGoogleServiceAccountJson()
    });

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.yearly',
      purchaseToken: 'purchase-token'
    })).rejects.toMatchObject({ statusCode: 402 });
  });

  it('rejects unsupported web purchases when sandbox mode is disabled', async () => {
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'web',
      productId: 'moneta.pro.web',
      purchaseToken: 'not-sandbox-web-token'
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('validates webhook signatures and rejects malformed signatures', () => {
    const secret = 'webhook-secret';
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: secret
    });

    const body = Buffer.from(JSON.stringify({ eventId: 'evt_1' }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createWebhookSignature(secret, body, timestamp);

    expect(verifier.verifyWebhookSignature(body, signature, timestamp)).toBe(true);
    expect(verifier.verifyWebhookSignature(body, `${timestamp}.deadbeef`, timestamp)).toBe(false);
    expect(verifier.verifyWebhookSignature(body, undefined, timestamp)).toBe(false);
    expect(verifier.verifyWebhookSignature(body, 'invalid-signature')).toBe(false);
    expect(verifier.verifyWebhookSignature(body, `t=${timestamp},v1=deadbeef`, timestamp)).toBe(false);
    expect(verifier.verifyWebhookSignature(body, signature, String(Number(timestamp) + 1))).toBe(false);
  });

  it('rejects webhook signatures outside replay window', () => {
    const secret = 'webhook-secret';
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: secret
    });

    const body = Buffer.from(JSON.stringify({ eventId: 'evt_2' }));
    const nowSeconds = 1_700_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

    const staleTimestamp = String(nowSeconds - 1000);
    const signature = createWebhookSignature(secret, body, staleTimestamp);

    expect(verifier.verifyWebhookSignature(body, signature, staleTimestamp)).toBe(false);
  });
});

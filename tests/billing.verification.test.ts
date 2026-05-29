import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBillingVerifier, createWebhookSignature } from '../src/billing.verification.js';

describe('billing verification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

    expect(ios.isActive).toBe(true);
    expect(ios.source).toBe('ios');
    expect(android.isActive).toBe(true);
    expect(android.source).toBe('android');
  });

  it('never honors sandbox purchase tokens in production even if explicitly enabled', async () => {
    const verifier = createBillingVerifier({
      nodeEnv: 'production',
      // Misconfiguration: sandbox purchases flagged on in production must still be ignored.
      allowSandboxTokens: true,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    // No fetch stub: a honored sandbox token would resolve without any network call.
    // Because sandbox is force-disabled, this instead falls through to real Apple
    // verification, which fails fast against the (unstubbed) network.
    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-ios-token'
    })).rejects.toBeTruthy();
  });

  it('rejects Apple receipts that do not match the requested productId', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 0,
      receipt: {
        in_app: [
          {
            product_id: 'some.other.sku',
            expires_date_ms: String(now.getTime() + 60 * 60 * 1000),
            transaction_id: 'tx_1'
          }
        ]
      }
    }), { status: 200 })));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Apple purchase did not match product');
  });

  it('rejects Apple receipts that do not include an expiry', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 0,
      receipt: {
        in_app: [
          {
            product_id: 'moneta.pro.monthly',
            transaction_id: 'tx_1'
          }
        ]
      }
    }), { status: 200 })));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Apple subscription receipt was missing an expiry');
  });

  it('rejects Google Play purchases that do not match the requested productId', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const serviceAccountJson = JSON.stringify({
      client_email: 'billing-test@example.com',
      private_key: privateKeyPem,
      token_uri: 'https://example.com/token'
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }

      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        return new Response(JSON.stringify({
          subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
          latestOrderId: 'order_123',
          lineItems: [
            {
              productId: 'some.other.sku',
              expiryTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
            }
          ]
        }), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    }));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: serviceAccountJson,
      googleTokenUrl: 'https://example.com/token'
    });

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play purchase did not match product');
  });

  it('validates webhook signatures with replay window', () => {
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
  });

  it('supports comma-delimited webhook signatures and rejects malformed variants', () => {
    const secret = 'webhook-secret';
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: secret
    });
    const body = Buffer.from(JSON.stringify({ eventId: 'evt_2' }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const dotSignature = createWebhookSignature(secret, body, timestamp);
    const digest = dotSignature.split('.')[1];

    expect(verifier.verifyWebhookSignature(body, `t=${timestamp},v1=${digest}`)).toBe(true);
    expect(verifier.verifyWebhookSignature(body, 't=123')).toBe(false);
    expect(verifier.verifyWebhookSignature(body, dotSignature, '999')).toBe(false);
    expect(verifier.verifyWebhookSignature(body, `invalid.${digest}`)).toBe(false);

    const oldTimestamp = String(Math.floor(Date.now() / 1000) - (60 * 60));
    const oldSignature = createWebhookSignature(secret, body, oldTimestamp);
    expect(verifier.verifyWebhookSignature(body, oldSignature, oldTimestamp)).toBe(false);

    const noSecretVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true
    });
    expect(noSecretVerifier.verifyWebhookSignature(body, dotSignature, timestamp)).toBe(false);
  });

  it('rejects missing and malformed webhook headers', () => {
    const secret = 'webhook-secret';
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: secret
    });
    const body = Buffer.from(JSON.stringify({ eventId: 'evt_3' }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createWebhookSignature(secret, body, timestamp);
    const digest = signature.split('.')[1];

    expect(verifier.verifyWebhookSignature(body, undefined)).toBe(false);
    expect(verifier.verifyWebhookSignature(body, `v1=${digest}`)).toBe(false);
    expect(verifier.verifyWebhookSignature(body, `not-a-number.${digest}`)).toBe(false);
  });

  it('falls back to the Apple sandbox verifier and can return an inactive purchase', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    let callCount = 0;

    vi.stubGlobal('fetch', vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ status: 21007 }), { status: 200 });
      }

      return new Response(JSON.stringify({
        status: 0,
        latest_receipt_info: [
          {
            product_id: 'moneta.pro.monthly',
            expires_date_ms: String(now.getTime() + 60 * 60 * 1000),
            cancellation_date_ms: String(now.getTime()),
            transaction_id: 'tx_apple_1'
          }
        ]
      }), { status: 200 });
    }));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    const purchase = await verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    });

    expect(purchase).toMatchObject({
      source: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: false,
      verificationReference: 'tx_apple_1'
    });
  });

  it('rejects Apple verification failures from provider responses and transport errors', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 21010
    }), { status: 200 })));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Apple purchase could not be verified');

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network');
    }));

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Billing provider request failed');
  });

  it('rejects Apple provider HTTP failures and empty verified receipts', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    vi.stubGlobal('fetch', vi.fn(async () => new Response('provider-down', { status: 500 })));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      appleSharedSecret: 'apple-shared-secret'
    });

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Billing provider request failed (500)');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 0,
      latest_receipt_info: [],
      receipt: {
        in_app: []
      }
    }), { status: 200 })));

    await expect(verifier.verifyPurchase({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      now
    })).rejects.toThrow('Apple purchase could not be verified');
  });

  it('rejects malformed Google Play service-account configuration', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');

    const invalidJsonVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: 'not-json'
    });

    await expect(invalidJsonVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');

    const invalidObjectVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: 'null'
    });

    await expect(invalidObjectVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');

    const missingClientEmailVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: JSON.stringify({ private_key: 'pk' })
    });

    await expect(missingClientEmailVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing client_email');

    const missingPrivateKeyVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: JSON.stringify({ client_email: 'billing-test@example.com' })
    });

    await expect(missingPrivateKeyVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing private_key');
  });

  it('rejects Google Play auth and purchase edge cases', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const serviceAccountJson = JSON.stringify({
      client_email: 'billing-test@example.com',
      private_key: privateKeyPem,
      token_uri: 'https://example.com/token'
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    }));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: serviceAccountJson,
      googleTokenUrl: 'https://example.com/token'
    });

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play auth response was missing access_token');

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }

      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        return new Response('gone', { status: 404 });
      }

      return new Response('not found', { status: 404 });
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play purchase was not found');

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }

      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        return new Response(JSON.stringify({
          subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
          latestOrderId: 'order_123',
          lineItems: [
            {
              productId: 'moneta.pro.monthly',
              expiryTime: 'not-a-date'
            }
          ]
        }), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play purchase was missing a valid expiry');
  });

  it('rejects missing Google Play config and provider transport failures', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const serviceAccountJson = JSON.stringify({
      client_email: 'billing-test@example.com',
      private_key: privateKeyPem,
      token_uri: 'https://example.com/token'
    });

    const missingConfigVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret'
    });

    await expect(missingConfigVerifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play billing verification is not configured');

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: serviceAccountJson,
      googleTokenUrl: 'https://example.com/token'
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response('auth failed', { status: 401 });
      }
      return new Response('not found', { status: 404 });
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Billing provider auth failed (401)');

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('token network');
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Billing provider auth failed');

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        return new Response('provider error', { status: 500 });
      }
      return new Response('not found', { status: 404 });
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play billing verification failed (500)');

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        throw new Error('purchase network');
      }
      return new Response('not found', { status: 404 });
    }));

    await expect(verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    })).rejects.toThrow('Google Play billing verification failed');
  });

  it('returns inactive Google Play purchases when the subscription state is no longer active', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const serviceAccountJson = JSON.stringify({
      client_email: 'billing-test@example.com',
      private_key: privateKeyPem,
      token_uri: 'https://example.com/token'
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === 'https://example.com/token' && init?.method === 'POST') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }

      if (urlString.includes('/purchases/subscriptionsv2/tokens/') && init?.method === 'GET') {
        return new Response(JSON.stringify({
          subscriptionState: 'SUBSCRIPTION_STATE_CANCELED',
          latestOrderId: 'order_456',
          lineItems: [
            {
              productId: 'moneta.pro.monthly',
              expiryTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
            }
          ]
        }), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    }));

    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret',
      googlePackageName: 'com.example.moneta',
      googleServiceAccountJson: serviceAccountJson,
      googleTokenUrl: 'https://example.com/token'
    });

    const purchase = await verifier.verifyPurchase({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      now
    });

    expect(purchase).toMatchObject({
      source: 'android',
      productId: 'moneta.pro.monthly',
      isActive: false,
      verificationReference: 'order_456'
    });
  });

  it('supports web sandbox purchases and rejects non-sandbox web verification', async () => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    const verifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: 'webhook-secret'
    });

    const sandboxWeb = await verifier.verifyPurchase({
      platform: 'web',
      productId: 'moneta.pro.web',
      purchaseToken: 'sandbox-web-12345',
      now
    });
    expect(sandboxWeb.source).toBe('web');
    expect(sandboxWeb.isActive).toBe(true);

    const strictVerifier = createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: false,
      webhookSecret: 'webhook-secret'
    });

    await expect(strictVerifier.verifyPurchase({
      platform: 'web',
      productId: 'moneta.pro.web',
      purchaseToken: 'web-purchase-token',
      now
    })).rejects.toThrow('Web billing verification is not configured');
  });
});

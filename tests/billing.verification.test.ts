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
});

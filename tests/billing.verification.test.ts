import { describe, expect, it } from 'vitest';
import { createBillingVerifier, createWebhookSignature } from '../src/billing.verification.js';

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

    expect(ios.isActive).toBe(true);
    expect(ios.source).toBe('ios');
    expect(android.isActive).toBe(true);
    expect(android.source).toBe('android');
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

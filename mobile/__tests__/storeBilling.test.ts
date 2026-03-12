import * as expoIap from 'expo-iap';
import { Platform } from 'react-native';
import {
  disconnectStoreBilling,
  listSubscriptionProducts,
  purchasePrimarySubscription,
  restoreLatestSubscription
} from '../src/lib/storeBilling';

const originalEnv = { ...process.env };
const originalPlatform = Platform.OS;

function setPlatform(os: 'ios' | 'android' | 'web') {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os
  });
}

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

describe('store billing helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreEnv();
  });

  afterEach(async () => {
    restoreEnv();
    setPlatform(originalPlatform as 'ios' | 'android' | 'web');
    await disconnectStoreBilling();
  });

  it('returns sandbox products on unsupported platforms when sandbox mode is enabled', async () => {
    setPlatform('web');
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'true';

    const products = await listSubscriptionProducts();

    expect(products).toEqual([
      {
        productId: 'moneta.pro.monthly',
        title: 'Moneta Pro',
        description: 'Sandbox purchase mode',
        displayPrice: 'Sandbox'
      }
    ]);
  });

  it('throws on unsupported platforms when sandbox mode is disabled', async () => {
    setPlatform('web');
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'false';

    await expect(listSubscriptionProducts()).rejects.toThrow('In-app purchases are unavailable on this platform.');
    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('In-app purchases are only available on iOS and Android builds.');
  });

  it('defaults sandbox mode off for production builds when no override is set', async () => {
    setPlatform('web');
    delete process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE;
    process.env.NODE_ENV = 'production';

    await expect(listSubscriptionProducts()).rejects.toThrow('In-app purchases are unavailable on this platform.');
  });

  it('uses sandbox fallbacks on native platforms when store SKUs are not configured', async () => {
    setPlatform('ios');
    delete process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS;
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'true';

    const products = await listSubscriptionProducts();
    expect(products[0]?.productId).toBe('moneta.pro.monthly');

    const purchased = await purchasePrimarySubscription('user-1');
    expect(purchased).toMatchObject({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      sandbox: true
    });

    const restored = await restoreLatestSubscription();
    expect(restored).toMatchObject({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      sandbox: true
    });
  });

  it('lists, purchases, restores, and disconnects iOS subscriptions', async () => {
    setPlatform('ios');
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly,moneta.pro.yearly';

    (expoIap.fetchProducts as jest.Mock).mockResolvedValue([
      {
        id: 'moneta.pro.monthly',
        title: 'Moneta Pro Monthly',
        displayName: 'Moneta Pro Monthly',
        description: 'Monthly access',
        displayPrice: '$7.99'
      },
      {
        id: 'moneta.pro.yearly',
        title: 'Moneta Pro Yearly',
        displayName: 'Moneta Pro Yearly',
        description: 'Yearly access',
        displayPrice: '$59.99'
      }
    ]);
    (expoIap.requestPurchase as jest.Mock).mockResolvedValue([
      {
        productId: 'moneta.pro.monthly',
        purchaseToken: 'purchase-token',
        transactionDate: 10
      }
    ]);
    (expoIap.getReceiptIOS as jest.Mock).mockResolvedValue('ios-receipt');

    const catalog = await listSubscriptionProducts();
    expect(catalog).toHaveLength(2);
    expect(expoIap.initConnection).toHaveBeenCalledTimes(1);

    const purchase = await purchasePrimarySubscription('user-1');
    expect(purchase).toEqual({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt',
      sandbox: false
    });
    expect(expoIap.requestPurchase).toHaveBeenCalledWith({
      type: 'subs',
      request: {
        apple: {
          sku: 'moneta.pro.monthly'
        }
      }
    });
    expect(expoIap.finishTransaction).toHaveBeenCalled();

    const restored = await restoreLatestSubscription();
    expect(restored).toEqual({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt',
      sandbox: false
    });

    await disconnectStoreBilling();
    expect(expoIap.endConnection).toHaveBeenCalledTimes(1);
  });

  it('throws for missing iOS store config and incomplete App Store purchases', async () => {
    setPlatform('ios');
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'false';
    delete process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS;

    await expect(listSubscriptionProducts()).rejects.toThrow('Set EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS for store billing.');
    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('Set EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS for store billing.');
    await expect(restoreLatestSubscription()).rejects.toThrow('Set EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS for store billing.');

    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    (expoIap.fetchProducts as jest.Mock).mockResolvedValue([
      {
        id: 'moneta.pro.monthly',
        title: 'Moneta Pro Monthly',
        displayName: 'Moneta Pro Monthly',
        description: 'Monthly access',
        displayPrice: '$7.99'
      }
    ]);
    (expoIap.requestPurchase as jest.Mock).mockResolvedValue(null);

    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('Purchase was not completed by the App Store.');

    (expoIap.requestPurchase as jest.Mock).mockResolvedValue([
      {
        productId: 'moneta.pro.monthly',
        purchaseToken: 'purchase-token',
        transactionDate: 10
      }
    ]);
    (expoIap.getReceiptIOS as jest.Mock).mockResolvedValue(null);

    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('Could not load App Store receipt for verification.');
  });

  it('returns null when restoring iOS purchases without a receipt', async () => {
    setPlatform('ios');
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    (expoIap.getReceiptIOS as jest.Mock).mockResolvedValue(null);

    await expect(restoreLatestSubscription()).resolves.toBeNull();
  });

  it('purchases and restores Android subscriptions with offer tokens', async () => {
    setPlatform('android');
    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';

    (expoIap.fetchProducts as jest.Mock).mockResolvedValue([
      {
        id: 'moneta.pro.monthly',
        title: 'Moneta Pro Monthly',
        displayName: 'Moneta Pro Monthly',
        description: 'Monthly access',
        displayPrice: '$7.99',
        subscriptionOffers: [{ offerTokenAndroid: 'offer-token-1' }]
      }
    ]);
    (expoIap.requestPurchase as jest.Mock).mockResolvedValue({
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      transactionDate: 20
    });
    (expoIap.getAvailablePurchases as jest.Mock).mockResolvedValue([
      {
        productId: 'moneta.pro.monthly',
        purchaseToken: 'android-restore-token',
        transactionDate: 30
      }
    ]);

    const purchase = await purchasePrimarySubscription('user-1');
    expect(purchase).toEqual({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-purchase-token',
      sandbox: false
    });
    expect(expoIap.requestPurchase).toHaveBeenCalledWith({
      type: 'subs',
      request: {
        google: {
          skus: ['moneta.pro.monthly'],
          obfuscatedAccountId: 'user-1',
          subscriptionOffers: [{ sku: 'moneta.pro.monthly', offerToken: 'offer-token-1' }]
        }
      }
    });

    const restored = await restoreLatestSubscription();
    expect(restored).toEqual({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-restore-token',
      sandbox: false
    });
  });

  it('handles Android fallback purchase selection and empty restore results', async () => {
    setPlatform('android');
    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';

    (expoIap.fetchProducts as jest.Mock).mockResolvedValue([
      {
        id: 'moneta.pro.monthly',
        title: '',
        displayName: '',
        description: '',
        displayPrice: ''
      }
    ]);
    (expoIap.requestPurchase as jest.Mock).mockResolvedValue([
      {
        productId: 'older-product',
        purchaseToken: 'old-token',
        transactionDate: 10
      },
      {
        productId: 'newest-product',
        purchaseToken: 'new-token',
        transactionDate: 20
      }
    ]);
    (expoIap.getAvailablePurchases as jest.Mock).mockResolvedValue([
      {
        productId: 'older-product',
        purchaseToken: '   ',
        transactionDate: 30
      }
    ]);

    const products = await listSubscriptionProducts();
    expect(products).toEqual([
      {
        productId: 'moneta.pro.monthly',
        title: 'moneta.pro.monthly',
        description: 'Moneta Pro subscription',
        displayPrice: 'See store'
      }
    ]);

    const purchase = await purchasePrimarySubscription('user-1');
    expect(purchase).toEqual({
      platform: 'android',
      productId: 'newest-product',
      purchaseToken: 'new-token',
      sandbox: false
    });

    const restored = await restoreLatestSubscription();
    expect(restored).toBeNull();
  });

  it('throws for missing Android store config and tokenless Google Play purchases', async () => {
    setPlatform('android');
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'false';
    delete process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS;

    await expect(listSubscriptionProducts()).rejects.toThrow('Set EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS for store billing.');
    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('Set EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS for store billing.');
    await expect(restoreLatestSubscription()).rejects.toThrow('Set EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS for store billing.');

    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    (expoIap.fetchProducts as jest.Mock).mockResolvedValue([
      {
        id: 'moneta.pro.monthly',
        title: 'Moneta Pro Monthly',
        displayName: 'Moneta Pro Monthly',
        description: 'Monthly access',
        displayPrice: '$7.99'
      }
    ]);
    (expoIap.requestPurchase as jest.Mock).mockResolvedValue({
      productId: 'moneta.pro.monthly',
      purchaseToken: '   ',
      transactionDate: 20
    });

    await expect(purchasePrimarySubscription('user-1')).rejects.toThrow('Purchase token was not returned by Google Play.');
  });
});

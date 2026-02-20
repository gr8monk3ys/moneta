const mockFetchProducts = jest.fn();
const mockInitConnection = jest.fn();
const mockEndConnection = jest.fn();
const mockRequestPurchase = jest.fn();
const mockFinishTransaction = jest.fn();
const mockGetReceiptIOS = jest.fn();
const mockRestorePurchases = jest.fn();
const mockGetAvailablePurchases = jest.fn();

jest.mock('expo-iap', () => ({
  fetchProducts: (...args: unknown[]) => mockFetchProducts(...args),
  initConnection: (...args: unknown[]) => mockInitConnection(...args),
  endConnection: (...args: unknown[]) => mockEndConnection(...args),
  requestPurchase: (...args: unknown[]) => mockRequestPurchase(...args),
  finishTransaction: (...args: unknown[]) => mockFinishTransaction(...args),
  getReceiptIOS: (...args: unknown[]) => mockGetReceiptIOS(...args),
  restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  getAvailablePurchases: (...args: unknown[]) => mockGetAvailablePurchases(...args)
}));

const mockPlatformState: { OS: string } = { OS: 'ios' };
jest.mock('react-native', () => ({
  Platform: mockPlatformState
}));

describe('storeBilling', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPlatformState.OS = 'ios';
    process.env.NODE_ENV = 'test';
    delete process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS;
    delete process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS;
    delete process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE;
  });

  it('returns sandbox catalog in non-mobile runtime when sandbox mode is enabled', async () => {
    mockPlatformState.OS = 'web';
    const billing = require('../src/lib/storeBilling');

    const products = await billing.listSubscriptionProducts();

    expect(products).toHaveLength(1);
    expect(products[0].displayPrice).toBe('Sandbox');
  });

  it('lists configured ios products and maps catalog fields', async () => {
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly,moneta.pro.yearly';
    mockFetchProducts.mockResolvedValueOnce([
      {
        id: 'moneta.pro.monthly',
        title: 'Moneta Monthly',
        description: 'Monthly',
        displayPrice: '$9.99'
      },
      {
        id: 'moneta.pro.yearly',
        title: 'Moneta Yearly',
        description: 'Yearly',
        displayPrice: '$79.99'
      }
    ]);

    const billing = require('../src/lib/storeBilling');
    const products = await billing.listSubscriptionProducts();

    expect(mockInitConnection).toHaveBeenCalledTimes(1);
    expect(products.map((p) => p.productId)).toEqual(['moneta.pro.monthly', 'moneta.pro.yearly']);
  });

  it('purchases iOS subscription and returns receipt payload', async () => {
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockRequestPurchase.mockResolvedValueOnce({
      productId: 'moneta.pro.monthly',
      purchaseToken: 'token',
      transactionDate: Date.now()
    });
    mockGetReceiptIOS.mockResolvedValueOnce('ios-receipt-token');

    const billing = require('../src/lib/storeBilling');
    const payload = await billing.purchasePrimarySubscription('user-1');

    expect(mockFinishTransaction).toHaveBeenCalled();
    expect(payload).toMatchObject({
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'ios-receipt-token',
      sandbox: false
    });
  });

  it('restores android purchase and returns latest token', async () => {
    mockPlatformState.OS = 'android';
    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockRestorePurchases.mockResolvedValueOnce(undefined);
    mockGetAvailablePurchases.mockResolvedValueOnce([
      { productId: 'other', purchaseToken: 'x', transactionDate: 1 },
      { productId: 'moneta.pro.monthly', purchaseToken: 'android-token', transactionDate: 2 }
    ]);

    const billing = require('../src/lib/storeBilling');
    const payload = await billing.restoreLatestSubscription();

    expect(payload).toMatchObject({
      platform: 'android',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'android-token',
      sandbox: false
    });
  });



  it('throws when iap unavailable and sandbox mode disabled', async () => {
    mockPlatformState.OS = 'web';
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'false';

    const billing = require('../src/lib/storeBilling');

    await expect(billing.listSubscriptionProducts()).rejects.toThrow('In-app purchases are unavailable on this platform.');
  });

  it('throws when sku config missing and sandbox disabled on mobile', async () => {
    process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE = 'false';
    const billing = require('../src/lib/storeBilling');

    await expect(billing.listSubscriptionProducts()).rejects.toThrow('Set EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS');
  });

  it('returns sandbox purchase payload when skus missing and sandbox enabled', async () => {
    mockPlatformState.OS = 'android';
    const billing = require('../src/lib/storeBilling');

    const payload = await billing.purchasePrimarySubscription('user-2');
    expect(payload.platform).toBe('android');
    expect(payload.sandbox).toBe(true);
    expect(payload.purchaseToken).toContain('sandbox-android-');
  });

  it('throws when iOS receipt is missing after purchase', async () => {
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockRequestPurchase.mockResolvedValueOnce({
      productId: 'moneta.pro.monthly',
      purchaseToken: 'token',
      transactionDate: Date.now()
    });
    mockGetReceiptIOS.mockResolvedValueOnce('');

    const billing = require('../src/lib/storeBilling');
    await expect(billing.purchasePrimarySubscription('user-1')).rejects.toThrow('Could not load App Store receipt');
  });

  it('throws when android purchase token is missing', async () => {
    mockPlatformState.OS = 'android';
    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockFetchProducts.mockResolvedValueOnce([{ id: 'moneta.pro.monthly', subscriptionOffers: [] }]);
    mockRequestPurchase.mockResolvedValueOnce({
      productId: 'moneta.pro.monthly',
      purchaseToken: '',
      transactionDate: Date.now()
    });

    const billing = require('../src/lib/storeBilling');
    await expect(billing.purchasePrimarySubscription('user-2')).rejects.toThrow('Purchase token was not returned by Google Play.');
  });

  it('returns null when restore has no purchase token', async () => {
    mockPlatformState.OS = 'android';
    process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockRestorePurchases.mockResolvedValueOnce(undefined);
    mockGetAvailablePurchases.mockResolvedValueOnce([{ productId: 'moneta.pro.monthly', purchaseToken: '', transactionDate: 2 }]);

    const billing = require('../src/lib/storeBilling');
    await expect(billing.restoreLatestSubscription()).resolves.toBeNull();
  });

  it('disconnects store billing only when initialized', async () => {
    process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS = 'moneta.pro.monthly';
    mockFetchProducts.mockResolvedValueOnce([
      { id: 'moneta.pro.monthly', title: 't', description: 'd', displayPrice: '$1' }
    ]);

    const billing = require('../src/lib/storeBilling');
    await billing.listSubscriptionProducts();
    await billing.disconnectStoreBilling();

    expect(mockEndConnection).toHaveBeenCalledTimes(1);
  });
});

import type { ProductSubscription, Purchase } from 'expo-iap';
import { Platform } from 'react-native';
import { readPublicEnv } from './env';

// Non-EXPO_PUBLIC vars are runtime-only (never inlined into a bundle), so the
// dynamic lookup is correct for these two.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const DEFAULT_PRO_PRODUCT_ID = 'moneta.pro.monthly';

let connected = false;
let expoIapModulePromise: Promise<typeof import('expo-iap')> | null = null;

export type BillingPlatform = 'ios' | 'android';

export interface BillingCatalogProduct {
  productId: string;
  title: string;
  description: string;
  displayPrice: string;
}

export interface BillingSyncPayload {
  platform: BillingPlatform;
  productId: string;
  purchaseToken: string;
  sandbox: boolean;
}

function parseSkuList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getSkuList(platform: BillingPlatform): string[] {
  return platform === 'ios'
    ? parseSkuList(readPublicEnv('EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS'))
    : parseSkuList(readPublicEnv('EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS'));
}

function resolvePlatform(): BillingPlatform {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  throw new Error('In-app purchases are only available on iOS and Android builds.');
}

function resolveDefaultSku(platform: BillingPlatform): string {
  return getSkuList(platform)[0] ?? DEFAULT_PRO_PRODUCT_ID;
}

function sandboxEnabled(): boolean {
  const configured = readPublicEnv('EXPO_PUBLIC_BILLING_SANDBOX_MODE');
  if (configured === 'true') {
    return true;
  }

  if (configured === 'false') {
    return false;
  }

  return env?.NODE_ENV !== 'production';
}

async function loadExpoIap() {
  if (!expoIapModulePromise) {
    expoIapModulePromise = env?.JEST_WORKER_ID
      ? Promise.resolve().then(() => require('expo-iap') as typeof import('expo-iap'))
      : import('expo-iap');
  }

  return expoIapModulePromise;
}

function createSandboxPayload(platform: BillingPlatform, productId: string): BillingSyncPayload {
  return {
    platform,
    productId,
    purchaseToken: `sandbox-${platform}-${Date.now()}`,
    sandbox: true
  };
}

function toCatalogProduct(product: ProductSubscription): BillingCatalogProduct {
  return {
    productId: product.id,
    title: product.title || product.displayName || product.id,
    description: product.description || 'Moneta Pro subscription',
    displayPrice: product.displayPrice || 'See store'
  };
}

async function ensureConnection(): Promise<void> {
  if (connected) {
    return;
  }

  const expoIap = await loadExpoIap();
  await expoIap.initConnection();
  connected = true;
}

function toPurchaseArray(result: Purchase | Purchase[] | null): Purchase[] {
  if (!result) {
    return [];
  }

  return Array.isArray(result) ? result : [result];
}

function purchaseTimestamp(purchase: Purchase): number {
  // expo-iap surfaces transactionDate as an epoch number on some platforms and an
  // ISO/date string on others; normalize both to a comparable millisecond value.
  const value: unknown = (purchase as { transactionDate?: unknown }).transactionDate;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function selectPurchase(purchases: Purchase[], productIds: string[]): Purchase | null {
  const withToken = purchases.filter((purchase) => typeof purchase.purchaseToken === 'string' && purchase.purchaseToken.length > 0);
  if (withToken.length === 0) {
    return null;
  }

  const exactMatch = withToken.find((purchase) => productIds.includes(purchase.productId));
  if (exactMatch) {
    return exactMatch;
  }

  const sortedByDate = [...withToken].sort((a, b) => purchaseTimestamp(b) - purchaseTimestamp(a));
  return sortedByDate[0] ?? null;
}

async function resolveAndroidSubscriptionOffers(productId: string): Promise<Array<{ sku: string; offerToken: string }> | undefined> {
  const expoIap = await loadExpoIap();
  const raw = await expoIap.fetchProducts({ skus: [productId], type: 'subs' });
  const products = raw as ProductSubscription[];
  const product = products.find((entry) => entry.id === productId);
  const offerToken = product?.subscriptionOffers?.[0]?.offerTokenAndroid;

  if (!offerToken) {
    return undefined;
  }

  return [{ sku: productId, offerToken }];
}

async function resolveIosReceiptOrThrow(): Promise<string> {
  const expoIap = await loadExpoIap();
  const receipt = await expoIap.getReceiptIOS();
  if (!receipt) {
    throw new Error('Could not load App Store receipt for verification.');
  }
  return receipt;
}

export async function listSubscriptionProducts(): Promise<BillingCatalogProduct[]> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    if (sandboxEnabled()) {
      return [
        {
          productId: DEFAULT_PRO_PRODUCT_ID,
          title: 'Moneta Pro',
          description: 'Sandbox purchase mode',
          displayPrice: 'Sandbox'
        }
      ];
    }

    throw new Error('In-app purchases are unavailable on this platform.');
  }

  const platform = resolvePlatform();
  const skus = getSkuList(platform);

  if (skus.length === 0) {
    if (sandboxEnabled()) {
      return [
        {
          productId: resolveDefaultSku(platform),
          title: 'Moneta Pro',
          description: 'Sandbox purchase mode',
          displayPrice: 'Sandbox'
        }
      ];
    }

    throw new Error(`Set EXPO_PUBLIC_${platform === 'ios' ? 'IOS' : 'ANDROID'}_SUBSCRIPTION_PRODUCT_IDS for store billing.`);
  }

  await ensureConnection();
  const expoIap = await loadExpoIap();
  const raw = await expoIap.fetchProducts({ skus, type: 'subs' });
  const products = raw as ProductSubscription[];
  const byId = new Map(products.map((product) => [product.id, toCatalogProduct(product)] as const));

  return skus
    .map((sku) => byId.get(sku))
    .filter((product): product is BillingCatalogProduct => Boolean(product));
}

export async function purchasePrimarySubscription(userId: string): Promise<BillingSyncPayload> {
  const platform = resolvePlatform();
  const skus = getSkuList(platform);
  const primarySku = resolveDefaultSku(platform);

  if (skus.length === 0 && sandboxEnabled()) {
    return createSandboxPayload(platform, primarySku);
  }

  if (skus.length === 0) {
    throw new Error(`Set EXPO_PUBLIC_${platform === 'ios' ? 'IOS' : 'ANDROID'}_SUBSCRIPTION_PRODUCT_IDS for store billing.`);
  }

  await ensureConnection();
  const expoIap = await loadExpoIap();

  if (platform === 'ios') {
    const purchase = await expoIap.requestPurchase({
      type: 'subs',
      request: {
        apple: {
          sku: primarySku
        }
      }
    });

    const selected = selectPurchase(toPurchaseArray(purchase), skus);
    if (!selected) {
      throw new Error('Purchase was not completed by the App Store.');
    }

    await expoIap.finishTransaction({ purchase: selected, isConsumable: false });
    const receipt = await resolveIosReceiptOrThrow();
    return {
      platform: 'ios',
      productId: selected.productId,
      purchaseToken: receipt,
      sandbox: false
    };
  }

  const subscriptionOffers = await resolveAndroidSubscriptionOffers(primarySku);
  const purchase = await expoIap.requestPurchase({
    type: 'subs',
    request: {
      google: {
        skus: [primarySku],
        obfuscatedAccountId: userId,
        ...(subscriptionOffers ? { subscriptionOffers } : {})
      }
    }
  });

  const selected = selectPurchase(toPurchaseArray(purchase), skus);
  const token = selected?.purchaseToken?.trim();

  if (!selected || !token) {
    throw new Error('Purchase token was not returned by Google Play.');
  }

  await expoIap.finishTransaction({ purchase: selected, isConsumable: false });

  return {
    platform: 'android',
    productId: selected.productId,
    purchaseToken: token,
    sandbox: false
  };
}

export async function restoreLatestSubscription(): Promise<BillingSyncPayload | null> {
  const platform = resolvePlatform();
  const skus = getSkuList(platform);
  const primarySku = resolveDefaultSku(platform);

  if (skus.length === 0 && sandboxEnabled()) {
    return createSandboxPayload(platform, primarySku);
  }

  if (skus.length === 0) {
    throw new Error(`Set EXPO_PUBLIC_${platform === 'ios' ? 'IOS' : 'ANDROID'}_SUBSCRIPTION_PRODUCT_IDS for store billing.`);
  }

  await ensureConnection();
  const expoIap = await loadExpoIap();
  await expoIap.restorePurchases();

  if (platform === 'ios') {
    const receipt = await expoIap.getReceiptIOS();
    if (!receipt) {
      return null;
    }

    return {
      platform: 'ios',
      productId: primarySku,
      purchaseToken: receipt,
      sandbox: false
    };
  }

  const purchases = await expoIap.getAvailablePurchases({ includeSuspendedAndroid: false });
  const selected = selectPurchase(purchases, skus);
  const token = selected?.purchaseToken?.trim();

  if (!selected || !token) {
    return null;
  }

  return {
    platform: 'android',
    productId: selected.productId,
    purchaseToken: token,
    sandbox: false
  };
}

export async function disconnectStoreBilling(): Promise<void> {
  if (!connected) {
    return;
  }

  const expoIap = await loadExpoIap();
  await expoIap.endConnection();
  connected = false;
}

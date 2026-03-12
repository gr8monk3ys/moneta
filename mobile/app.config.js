function resolveBuildProfile() {
  return process.env.EAS_BUILD_PROFILE ?? process.env.APP_ENV ?? 'development';
}

function isHttpsUrl(value) {
  return typeof value === 'string' && value.startsWith('https://');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlaceholderUrl(value) {
  return typeof value === 'string' && value.startsWith('https://example.com');
}

function parseSkuList(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function validateRequiredConfig(buildProfile) {
  // For anything intended to be installed outside local dev (preview/prod),
  // force explicit https API config so we don't accidentally ship localhost.
  if (buildProfile === 'development') {
    return;
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!isNonEmptyString(apiBaseUrl)) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be set for preview/production builds.');
  }

  if (!isHttpsUrl(apiBaseUrl)) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be an https:// URL for preview/production builds.');
  }

  const requiredLegalUrls = [
    'EXPO_PUBLIC_PRIVACY_POLICY_URL',
    'EXPO_PUBLIC_TERMS_OF_SERVICE_URL',
    'EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL',
    'EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL',
    'EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL'
  ];

  for (const envName of requiredLegalUrls) {
    const value = process.env[envName];
    if (!isNonEmptyString(value)) {
      throw new Error(`${envName} must be set for preview/production builds.`);
    }
    if (!isHttpsUrl(value)) {
      throw new Error(`${envName} must be an https:// URL for preview/production builds.`);
    }
    if (isPlaceholderUrl(value)) {
      throw new Error(`${envName} must be a real, published policy URL (not example.com).`);
    }
  }

  if (buildProfile === 'production') {
    const sandboxMode = process.env.EXPO_PUBLIC_BILLING_SANDBOX_MODE;
    if (sandboxMode === 'true') {
      throw new Error('EXPO_PUBLIC_BILLING_SANDBOX_MODE must be false for production builds.');
    }

    const iosSkus = parseSkuList(process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS);
    const androidSkus = parseSkuList(process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS);
    if (iosSkus.length === 0) {
      throw new Error('EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS must be set for production builds.');
    }
    if (androidSkus.length === 0) {
      throw new Error('EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS must be set for production builds.');
    }
  }
}

function withDevIosNetworking(ios) {
  const next = { ...(ios ?? {}) };
  const infoPlist = { ...(next.infoPlist ?? {}) };

  infoPlist.NSAppTransportSecurity = {
    ...(infoPlist.NSAppTransportSecurity ?? {}),
    // Needed for device dev builds that point at http://<LAN_IP>:3000.
    NSAllowsArbitraryLoads: true
  };

  infoPlist.NSLocalNetworkUsageDescription = infoPlist.NSLocalNetworkUsageDescription
    ?? 'Allow Moneta to connect to your local development server.';

  next.infoPlist = infoPlist;
  return next;
}

function withAndroidCleartextTraffic(android, enabled) {
  return {
    ...(android ?? {}),
    // Needed for device dev builds that point at http://<LAN_IP>:3000.
    usesCleartextTraffic: Boolean(enabled)
  };
}

module.exports = ({ config }) => {
  const buildProfile = resolveBuildProfile();
  validateRequiredConfig(buildProfile);

  const isDevProfile = buildProfile === 'development';

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      buildProfile
    },
    ios: isDevProfile ? withDevIosNetworking(config.ios) : (config.ios ?? {}),
    android: withAndroidCleartextTraffic(config.android, isDevProfile)
  };
};

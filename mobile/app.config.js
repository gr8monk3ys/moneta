function resolveBuildProfile() {
  return process.env.EAS_BUILD_PROFILE ?? process.env.APP_ENV ?? 'development';
}

function isHttpsUrl(value) {
  return typeof value === 'string' && value.startsWith('https://');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
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


# Moneta Mobile (Expo)

This is the mobile client for Moneta, built with Expo and React Native.

## Prerequisites

- Node.js 20+
- iOS Simulator (Mac) or Expo Go on a physical device

## Setup

```bash
npm install
cp .env.example .env
npm run start
```

## Run targets

- `npm run ios`
- `npm run android`
- `npm run web`

## Backend connection

Set `EXPO_PUBLIC_API_BASE_URL` to your backend URL.

- Local simulator (same machine): `http://localhost:3000`
- Physical iPhone device: use your machine LAN IP, for example `http://192.168.1.15:3000`

For Expo web preview, browser requests must also be allowed by the backend `CORS_ORIGINS` setting.

## EAS builds (required for IAP testing)

In-app purchases do not work in Expo Go. Use EAS to build a dev client or an internal distribution build.

Profiles live in `mobile/eas.json`:

- `development`: dev client + allows http:// API URLs (for local device testing)
- `preview`: internal distribution + requires https:// API URL
- `production`: store build + requires https:// API URL + sandbox billing disabled

Typical commands (run from `mobile/`):

```bash
npx eas-cli login

# Dev client (device install) for local testing
npx eas-cli build --profile development --platform ios
npx eas-cli build --profile development --platform android

# Internal distribution pointed at staging/prod https API
npx eas-cli build --profile preview --platform ios
npx eas-cli build --profile preview --platform android
```

## Store billing configuration

Configure subscription SKUs per platform:

- `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS` (comma-separated, for example `moneta.pro.monthly,moneta.pro.yearly`)
- `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS` (comma-separated)

Optional local fallback:

- `EXPO_PUBLIC_BILLING_SANDBOX_MODE=true|false`
  - defaults to `true` outside production
  - defaults to `false` in production

## Tests and lint

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage -- --runInBand
```

## Production env templates

Use the tracked templates when preparing release values:

- `../.env.production.example`
- `.env.production.example`

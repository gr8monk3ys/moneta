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

Set `EXPO_PUBLIC_API_BASE_URL` to your backend URL. The app logs a runtime warning if `localhost` is used in a React Native runtime.

- Local simulator (same machine): `http://localhost:3000`
- Physical iPhone device: use your machine LAN IP, for example `http://192.168.1.15:3000`

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
npm run test
npm run test:ci
```

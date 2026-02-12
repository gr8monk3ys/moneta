# moneta

An iOS / Android finance-learning platform.

## Product documentation

- [Product Requirements Document](docs/product-requirements-document.md)
- [MVP API Documentation](docs/api.md)
- [Operations Guide](docs/operations.md)
- [Go-Live Checklist](docs/go-live-checklist.md)

## Repository layout

- `src/` - backend API
- `mobile/` - Expo mobile app (iOS/Android/Web)

## Mobile app quick start (Expo)

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

Then run on target:

- `npm run ios` (iOS simulator)
- `npm run android` (Android emulator)
- `npm run web` (browser preview)

For physical iPhone testing, point `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP address.

## Backend API (implemented)

This repository includes a TypeScript backend for the core loop with authentication:

- auth register/login (`POST /api/auth/register`, `POST /api/auth/login`)
- refresh/logout (`POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/logout-all`)
- onboarding placement (`POST /api/onboarding/placement`)
- daily learning feed (`GET /api/learn/today/:userId`)
- session completion with mastery/streak updates (`POST /api/sessions/complete`)
- progress summary (`GET /api/progress/:userId`)
- health/readiness/metrics (`GET /health`, `GET /ready`, `GET /metrics`)

## Configuration

Backend:

- `PORT` (default: `3000`)
- `NODE_ENV` (`development` or `production`)
- `JWT_SECRET` (required in production)
- `JWT_REFRESH_SECRET` (required in production)
- `JWT_ACCESS_TTL_SECONDS` (default: `3600`)
- `JWT_REFRESH_TTL_SECONDS` (default: `604800`)
- `REFRESH_TOKEN_PRUNE_INTERVAL_SECONDS` (default: `300`)
- `CORS_ORIGINS` (comma-separated allowlist)
- `DATABASE_URL` (required in production; app exits if missing)
- `METRICS_TOKEN` (required in production to access `GET /metrics` with `Authorization: Bearer <token>`)
- `RATE_LIMIT_REDIS_URL` (optional Redis store for distributed rate limiting; recommended in production)
- `TRUST_PROXY` (`true`/`false`; defaults to `true` in production)

Production readiness helper:

- Run `./scripts/production-readiness-check.sh` in your deployment environment to verify required env vars and secure defaults before promoting traffic.

Mobile:

- `EXPO_PUBLIC_API_BASE_URL`

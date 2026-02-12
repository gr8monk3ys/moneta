# Moneta MVP API

Base URL: `http://localhost:3000`

## Health, readiness, and metrics

### `GET /health`
Basic liveness endpoint.

### `GET /ready`
Readiness endpoint that validates storage availability.

### `GET /metrics`
Prometheus metrics endpoint. In production, requires `Authorization: Bearer <METRICS_TOKEN>`.

## Authentication

### `POST /api/auth/register`
Registers a user with email/password and initializes their finance profile.

### `POST /api/auth/login`
Returns an access token and refresh token.

### `POST /api/auth/refresh`
Rotates refresh token and issues a fresh access/refresh pair.

### `POST /api/auth/logout`
Revokes all refresh tokens for the current session.

### `POST /api/auth/logout-all`
Revokes all refresh tokens for the authenticated user.

## Protected routes
All routes below require `Authorization: Bearer <access-token>`.

### `POST /api/onboarding/placement`
Calculates and stores finance level from placement results for the authenticated user.

### `GET /api/learn/today/:userId`
Returns due reviews and next recommended lesson. `:userId` must match token subject.

### `POST /api/sessions/complete`
Stores item outcomes, updates streak, and schedules review items.

### `GET /api/progress/:userId`
Returns level, streak, and mastery summary. `:userId` must match token subject.

## Security and lifecycle controls

- Auth endpoints are rate-limited.
- API routes are rate-limited.
- Rate limit storage can be centralized with Redis via `RATE_LIMIT_REDIS_URL`.
- Helmet headers are enabled.
- CORS allowlist is configured via `CORS_ORIGINS`.
- Access tokens and refresh tokens use separate secrets and TTL settings.
- Refresh tokens are stored hashed and include session IDs.
- Refresh tokens are rotated, revocable by session/user, and pruned by policy.

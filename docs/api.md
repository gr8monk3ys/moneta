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

### `GET /api/auth/account/export`
Returns an authenticated user data export snapshot:
- profile and entitlement state
- refresh token session history
- processed billing webhook history

### `DELETE /api/auth/account`
Deletes the authenticated account and related lifecycle data.
- Required body:
  - `confirmation`: must be `DELETE_ACCOUNT`

## Protected routes
All routes below require `Authorization: Bearer <access-token>`.

### `POST /api/onboarding/placement`
Calculates and stores finance level from placement results for the authenticated user.

### `GET /api/learn/today/:userId`
Returns reviews that are currently due (based on persisted per-skill schedule) and next recommended lesson. `:userId` must match token subject.
- Includes `entitlement` and `features` so clients can render free-vs-pro limits.
- Free users are limited to a capped due-review queue (`features.maxDueReviews`), while active Pro users receive the full queue.
- `nextLesson` returns lesson metadata only (no answer keys).

### `GET /api/learn/path/:userId`
Returns curriculum path metadata for the authenticated user.
- Includes each lesson with `locked` flag based on entitlement (free vs pro).

### `GET /api/learn/lessons/:lessonId`
Returns lesson details for the authenticated user.
- Premium lessons return `402` when the user does not have Pro access.
- Lesson items exclude answer keys (`correctAnswer`) in API responses.

### `POST /api/sessions/complete`
Stores item outcomes, updates streak, and schedules review items.
- Optional body field: `timeZone` (IANA timezone like `America/New_York`) to compute streak day boundaries.
- Optional header fallback: `x-user-timezone` if `timeZone` is omitted.

### `GET /api/progress/:userId`
Returns level, streak, and mastery summary. `:userId` must match token subject.
- Includes `plan` and `premiumActive` status.

### `GET /api/billing/entitlements/:userId`
Returns current subscription entitlement and feature access for the authenticated user. `:userId` must match token subject.

### `POST /api/billing/entitlements/sync`
Synchronizes entitlement state after server-side store verification.
- Body:
  - `platform`: `ios | android | web`
  - `productId`: store product identifier
  - `purchaseToken`: platform purchase token or receipt reference (validated server-side, never persisted)
- The server verifies receipts against configured provider APIs and computes `isActive`/`currentPeriodEndsAt` from provider responses.

### `POST /api/billing/webhooks/reconcile`
Processes signed billing lifecycle events (renewal, cancellation, expiration) and reconciles user entitlements.
- Required headers:
  - `x-billing-signature`: HMAC signature (`<timestamp>.<hex-digest>`)
  - `x-billing-timestamp`: epoch seconds (used in signature and replay window checks)
- Body:
  - `eventId`: idempotency key from upstream billing event
  - `userId`
  - `platform`: `ios | android | web`
  - `productId`
  - `isActive`
  - `currentPeriodEndsAt` (optional): ISO timestamp
- Duplicate `eventId` values are ignored safely.

## Security and lifecycle controls

- Auth endpoints are rate-limited.
- API routes are rate-limited.
- Rate limit storage can be centralized with Redis via `RATE_LIMIT_REDIS_URL`.
- Helmet headers are enabled.
- CORS allowlist is configured via `CORS_ORIGINS`.
- Access tokens and refresh tokens use separate secrets and TTL settings.
- Refresh tokens are stored hashed and include session IDs.
- Refresh tokens are rotated, revocable by session/user, and pruned by policy.

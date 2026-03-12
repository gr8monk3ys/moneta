# Backend Smoke Test (Draft)

Use these commands against a staging/production-like environment to verify core endpoints.

## Prereqs

- `BASE_URL` points at the deployed API, for example: `https://api.your-domain.com`
- `jq` installed (optional, but recommended)

## Health checks

```bash
curl -fsS "$BASE_URL/health"
curl -fsS "$BASE_URL/ready"
```

## Register + login

```bash
EMAIL="smoke-$(date +%s)@example.com"
PASSWORD="password123"

curl -fsS -X POST "$BASE_URL/api/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

TOKENS_JSON="$(curl -fsS -X POST "$BASE_URL/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

echo "$TOKENS_JSON" | jq .
USER_ID="$(echo "$TOKENS_JSON" | jq -r .userId)"
ACCESS_TOKEN="$(echo "$TOKENS_JSON" | jq -r .accessToken)"
REFRESH_TOKEN="$(echo "$TOKENS_JSON" | jq -r .refreshToken)"
```

## Password reset (email code)

This flow requires SMTP to be configured so the API can send the reset code email.

1) Request a code:

```bash
curl -fsS -X POST "$BASE_URL/api/auth/password/reset/request" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\"}" | jq .
```

2) Get the 8-digit code from your email, then confirm:

```bash
RESET_CODE="12345678"
NEW_PASSWORD="new-password-123"

curl -fsS -X POST "$BASE_URL/api/auth/password/reset/confirm" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$RESET_CODE\",\"newPassword\":\"$NEW_PASSWORD\"}" | jq .
```

3) Verify old password fails and new password works:

```bash
curl -fsS -X POST "$BASE_URL/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" || true

curl -fsS -X POST "$BASE_URL/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}" | jq .
```

## Fetch progress + today

```bash
curl -fsS "$BASE_URL/api/progress/$USER_ID" -H "authorization: Bearer $ACCESS_TOKEN" | jq .
curl -fsS "$BASE_URL/api/learn/today/$USER_ID" -H "authorization: Bearer $ACCESS_TOKEN" | jq .
curl -fsS "$BASE_URL/api/learn/path/$USER_ID" -H "authorization: Bearer $ACCESS_TOKEN" | jq .
```

## Refresh token

```bash
curl -fsS -X POST "$BASE_URL/api/auth/refresh" \
  -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

## Logout

```bash
curl -fsS -X POST "$BASE_URL/api/auth/logout" \
  -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

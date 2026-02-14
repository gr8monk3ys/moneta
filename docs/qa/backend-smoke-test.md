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
USER_ID="smoke-$(date +%s)"
EMAIL="$USER_ID@example.com"
PASSWORD="password123"

curl -fsS -X POST "$BASE_URL/api/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

TOKENS_JSON="$(curl -fsS -X POST "$BASE_URL/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

echo "$TOKENS_JSON" | jq .
ACCESS_TOKEN="$(echo "$TOKENS_JSON" | jq -r .accessToken)"
REFRESH_TOKEN="$(echo "$TOKENS_JSON" | jq -r .refreshToken)"
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


# Moneta Staging Environment Setup

Goal: host an HTTPS Moneta API that EAS preview builds can talk to (no laptop / LAN required).

## Key choices

- Recommended backend runtime: `NODE_ENV=staging`
  - Keeps production-like behavior (real DB, real HTTPS endpoint) while allowing sandbox billing tokens and avoiding production-only store verifier requirements.
- Recommended mobile preview build profile: `eas build --profile preview`
  - Requires `EXPO_PUBLIC_API_BASE_URL` to be `https://...` (enforced by `mobile/app.config.js`).

## 1) Provision an HTTPS endpoint

You need a public hostname (example: `https://api-staging.example.com`) that terminates TLS and forwards to the Moneta Node server (default port `3000`).

Requirements:

- TLS termination (Caddy/Nginx/Cloudflare) with a valid certificate
- Forward `/health`, `/ready`, `/metrics`, and `/api/*` to the Node process
- If using a reverse proxy, set `TRUST_PROXY=true` in the API environment

Example Caddy config: `ops/caddy/Caddyfile.example`

## 1a) Systemd service

Deploys assume a systemd unit exists and can be restarted on deploy.

Example unit file: `ops/systemd/moneta.service.example`

Important:

- Update `/srv/moneta` in the example to match your `DEPLOY_PATH`.
- The deploy script restarts `DEPLOY_SERVICE_NAME` via `sudo systemctl restart ...`.
- Ensure your `DEPLOY_USER` can run `systemctl restart` and `systemctl is-active` for that service without a password prompt.

Example sudoers entry (adjust service name + systemctl path for your host):

```bash
# /etc/sudoers.d/moneta-deploy
deploy-user ALL=NOPASSWD: /bin/systemctl restart moneta-staging, /bin/systemctl is-active moneta-staging
```

## 2) Staging `.env` template (server-side)

Put this at `<DEPLOY_PATH>/shared/.env` on the staging host (the deploy script symlinks it).

Minimum required:

```bash
NODE_ENV=staging
PORT=3000
TRUST_PROXY=true

DATABASE_URL=postgres://...
JWT_SECRET=... # >= 32 chars
JWT_REFRESH_SECRET=... # >= 32 chars, different from JWT_SECRET
METRICS_TOKEN=... # >= 24 chars
CORS_ORIGINS=https://your-web-host.example.com

# Optional but recommended
RATE_LIMIT_REDIS_URL=redis://...
BILLING_ALLOW_SANDBOX_PURCHASES=true
```

Notes:

- `CORS_ORIGINS` is only enforced for browser traffic. Native iOS/Android apps are not subject to CORS, but keep it explicit anyway.
- `BILLING_ALLOW_SANDBOX_PURCHASES=true` lets the API accept `sandbox-*` purchase tokens (used by mobile sandbox mode).

## 3) GitHub Actions staging deploy

Workflow: `.github/workflows/deploy-staging.yml` (defaults to `push` on branch `work` and `workflow_dispatch`).

Create a GitHub **Environment** named `staging` and set:

Secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `METRICS_TOKEN`
- `CORS_ORIGINS`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_KNOWN_HOSTS`
- `DEPLOY_SERVICE_NAME` (example: `moneta-staging`)
- `HEALTHCHECK_URL` (example: `https://api-staging.example.com`)

Variables:

- `DEPLOY_KEEP_RELEASES` (example: `5`)

## 4) EAS preview builds pointing at staging

Preview builds require HTTPS:

1. Set `EXPO_PUBLIC_API_BASE_URL=https://api-staging.example.com` for your EAS project (secret or env).
2. Build with:

```bash
cd "$(git rev-parse --show-toplevel)/mobile"
npx eas-cli build --profile preview --platform ios
npx eas-cli build --profile preview --platform android
```

## 5) Verification checklist

- `curl https://api-staging.example.com/health` returns `200`
- `curl https://api-staging.example.com/ready` returns `200`
- `curl -H "Authorization: Bearer $METRICS_TOKEN" https://api-staging.example.com/metrics` returns `200`
- EAS preview build launches and can register/login and start a lesson/reviews

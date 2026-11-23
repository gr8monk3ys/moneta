# Deploy the Express app as a single Vercel function

`vercel.json` rewrites every path to `api/index.ts`, which mounts the same Express app that `src/server.ts` runs as a long-lived process. Scheduled work, such as pruning refresh tokens, runs as a Vercel cron hitting `/internal/prune-refresh-tokens` instead of an in-process timer, and `migrations/`, `public/` and `docs/compliance/` are bundled into the function.

Anything that assumes a persistent process (in-memory caches, background timers) is therefore unreliable in production.

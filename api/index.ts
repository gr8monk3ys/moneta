import type { IncomingMessage, ServerResponse } from 'node:http';
import { bootstrapFromEnv, type BootstrappedApp } from '../src/bootstrap.js';

// One bootstrap per instance, shared across invocations. Migrations run inside
// bootstrapFromEnv under a Postgres advisory lock, so parallel cold starts
// serialize instead of racing. A failed bootstrap is not cached — the next
// invocation retries instead of pinning the instance to a dead app.
let bootstrapped: Promise<BootstrappedApp> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  bootstrapped ??= bootstrapFromEnv().catch((error: unknown) => {
    bootstrapped = undefined;
    throw error;
  });
  const { app } = await bootstrapped;
  app(req, res);
}

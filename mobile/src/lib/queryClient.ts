import { QueryClient } from '@tanstack/react-query';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const isTestEnv = env?.NODE_ENV === 'test' || Boolean(env?.JEST_WORKER_ID);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isTestEnv ? false : 1,
      // Prevent long-lived timers from keeping Jest alive.
      gcTime: isTestEnv ? Infinity : undefined
    },
    mutations: {
      retry: isTestEnv ? false : 1
    }
  }
});

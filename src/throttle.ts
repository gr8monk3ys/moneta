// Per-account failed-attempt throttle for login and password-reset-confirm.
//
// IP-based rate limiting (express-rate-limit) already caps total auth traffic;
// this adds a per-account guard so credential stuffing or reset-code guessing
// distributed across many IPs is also bounded. After `maxFailures` failures within
// `windowMs`, the account key is locked for `lockMs`. A success clears the counter.
//
// Tradeoff: locking by account can let an attacker lock out a victim by failing
// their login. The threshold/cooldown are deliberately moderate, the lockout is
// temporary, and lockout responses stay generic (no account enumeration). State is
// per-instance/in-memory; a distributed store would be a future enhancement.

export interface ThrottleStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

export interface AccountThrottle {
  check(key: string, now?: number): ThrottleStatus;
  recordFailure(key: string, now?: number): void;
  reset(key: string): void;
}

interface ThrottleEntry {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

export interface AccountThrottleOptions {
  maxFailures?: number;
  windowMs?: number;
  lockMs?: number;
}

export function createAccountThrottle(options: AccountThrottleOptions = {}): AccountThrottle {
  const maxFailures = options.maxFailures ?? 10;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockMs = options.lockMs ?? 15 * 60 * 1000;
  const entries = new Map<string, ThrottleEntry>();

  function check(key: string, now: number = Date.now()): ThrottleStatus {
    const entry = entries.get(key);
    if (!entry) {
      return { locked: false, retryAfterSeconds: 0 };
    }

    if (entry.lockedUntil > now) {
      return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
    }

    // Lock expired or window stale: drop the entry so the map does not grow unbounded.
    if (entry.lockedUntil !== 0 || now - entry.windowStart > windowMs) {
      entries.delete(key);
    }

    return { locked: false, retryAfterSeconds: 0 };
  }

  function recordFailure(key: string, now: number = Date.now()): void {
    const entry = entries.get(key);
    if (!entry || now - entry.windowStart > windowMs || entry.lockedUntil !== 0) {
      entries.set(key, { failures: 1, windowStart: now, lockedUntil: 0 });
      return;
    }

    entry.failures += 1;
    if (entry.failures >= maxFailures) {
      entry.lockedUntil = now + lockMs;
    }
  }

  function reset(key: string): void {
    entries.delete(key);
  }

  return { check, recordFailure, reset };
}

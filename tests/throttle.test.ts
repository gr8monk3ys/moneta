import { describe, expect, it } from 'vitest';
import { createAccountThrottle } from '../src/throttle.js';

describe('account throttle', () => {
  it('locks after maxFailures and reports retry-after seconds', () => {
    const throttle = createAccountThrottle({ maxFailures: 3, windowMs: 10_000, lockMs: 5_000 });
    const now = 1_000_000;

    expect(throttle.check('k', now).locked).toBe(false);
    throttle.recordFailure('k', now);
    throttle.recordFailure('k', now);
    expect(throttle.check('k', now).locked).toBe(false);

    throttle.recordFailure('k', now); // third failure trips the lock
    const status = throttle.check('k', now);
    expect(status.locked).toBe(true);
    expect(status.retryAfterSeconds).toBe(5);
  });

  it('clears failures on reset', () => {
    const throttle = createAccountThrottle({ maxFailures: 2, windowMs: 10_000, lockMs: 5_000 });
    throttle.recordFailure('k');
    throttle.reset('k');
    throttle.recordFailure('k'); // only one failure since reset

    expect(throttle.check('k').locked).toBe(false);
  });

  it('unlocks after the lock window elapses', () => {
    const throttle = createAccountThrottle({ maxFailures: 2, windowMs: 10_000, lockMs: 5_000 });
    const now = 1_000_000;
    throttle.recordFailure('k', now);
    throttle.recordFailure('k', now);

    expect(throttle.check('k', now).locked).toBe(true);
    expect(throttle.check('k', now + 5_001).locked).toBe(false);
  });

  it('starts a fresh window once the previous one is stale', () => {
    const throttle = createAccountThrottle({ maxFailures: 2, windowMs: 1_000, lockMs: 5_000 });
    const now = 1_000_000;
    throttle.recordFailure('k', now);
    throttle.recordFailure('k', now + 2_000); // window expired -> counts as first failure again

    expect(throttle.check('k', now + 2_000).locked).toBe(false);
  });
});

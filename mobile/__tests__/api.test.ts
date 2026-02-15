import {
  completeSession,
  deleteAccount,
  exportAccountData,
  fetchEntitlement,
  fetchProgress,
  fetchToday,
  logout,
  logoutAll,
  probeBackend,
  register,
  syncEntitlement,
  submitPlacement,
  type AuthContext
} from '../src/lib/api';

describe('mobile api auth retry', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshes once for concurrent auth failures and retries with new token', async () => {
    let protectedCalls = 0;

    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/api/auth/refresh')) {
        return {
          ok: true,
          json: async () => ({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            sessionId: 'session-2'
          })
        } as Response;
      }

      if (url.endsWith('/api/progress/user-1')) {
        protectedCalls += 1;
        const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;

        if (authHeader === 'Bearer old-access') {
          return {
            ok: false,
            json: async () => ({ error: 'Invalid token' })
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            currentLevel: 'F1',
            streakDays: 1,
            masteredSkills: 1,
            totalSkills: 2,
            plan: 'free',
            premiumActive: false
          })
        } as Response;
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const updates: Array<{ accessToken: string; refreshToken: string; sessionId: string }> = [];
    const auth: AuthContext = {
      accessToken: 'old-access',
      refreshToken: 'refresh-token',
      onTokensUpdated(tokens) {
        updates.push(tokens);
      }
    };

    const [first, second] = await Promise.all([
      fetchProgress('user-1', auth),
      fetchProgress('user-1', auth)
    ]);

    expect(first.userId).toBe('user-1');
    expect(second.userId).toBe('user-1');
    expect(updates).toHaveLength(2);

    const refreshCalls = fetchSpy.mock.calls.filter((call) => String(call[0]).endsWith('/api/auth/refresh')).length;
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(4);
  });

  it('supports non-auth calls and propagates non-auth errors', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/health')) {
        return { ok: true, json: async () => ({ status: 'ok' }) } as Response;
      }
      if (url.endsWith('/ready')) {
        return { ok: true, json: async () => ({ status: 'ready' }) } as Response;
      }
      if (url.endsWith('/api/auth/register')) {
        return { ok: true, json: async () => ({ userId: 'user-1', email: 'x@example.com' }) } as Response;
      }
      if (url.endsWith('/api/auth/logout')) {
        return { ok: true, json: async () => ({}) } as Response;
      }
      if (url.endsWith('/api/auth/logout-all')) {
        const authHeader = (init?.headers as Record<string, string>).Authorization;
        if (authHeader === 'Bearer stale') {
          return { ok: false, json: async () => ({ error: 'Missing bearer token' }) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
      }
      if (url.endsWith('/api/auth/account/export')) {
        const authHeader = (init?.headers as Record<string, string>).Authorization;
        if (authHeader === 'Bearer stale') {
          return { ok: false, json: async () => ({ error: 'Invalid token' }) } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            email: 'u1@example.com',
            generatedAt: new Date().toISOString(),
            profile: {
              userId: 'user-1',
              currentLevel: 'F1',
              streakDays: 1,
              skills: {},
              entitlement: {
                plan: 'free',
                isActive: true,
                source: 'none',
                updatedAt: new Date().toISOString()
              }
            },
            sessions: { total: 1, active: 1, refreshTokens: [] },
            billing: { webhookEventsProcessed: 0, events: [] }
          })
        } as Response;
      }
      if (url.endsWith('/api/auth/account') && init?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({ userId: 'user-1', deleted: true, deletedAt: new Date().toISOString() })
        } as Response;
      }
      if (url.endsWith('/api/learn/today/user-1')) {
        return { ok: false, json: async () => ({ error: 'Service unavailable' }) } as Response;
      }
      if (url.endsWith('/api/billing/entitlements/user-1')) {
        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            entitlement: {
              plan: 'free',
              isActive: true,
              source: 'none',
              updatedAt: new Date().toISOString()
            },
            features: {
              advancedTracks: false,
              certificates: false,
              streakRepair: false,
              unlimitedReviews: false,
              maxDueReviews: 3
            }
          })
        } as Response;
      }
      if (url.endsWith('/api/billing/entitlements/sync')) {
        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            entitlement: {
              plan: 'pro',
              isActive: true,
              source: 'ios',
              productId: 'moneta.pro.monthly',
              currentPeriodEndsAt: new Date(Date.now() + 86_400_000).toISOString(),
              updatedAt: new Date().toISOString()
            },
            features: {
              advancedTracks: true,
              certificates: true,
              streakRepair: true,
              unlimitedReviews: true,
              maxDueReviews: null
            }
          })
        } as Response;
      }
      if (url.endsWith('/api/onboarding/placement')) {
        return {
          ok: true,
          json: async () => ({ userId: 'user-1', level: 'F2' })
        } as Response;
      }
      if (url.endsWith('/api/sessions/complete')) {
        return {
          ok: true,
          json: async () => ({ userId: 'user-1', streakDays: 2, scheduledReviews: [] })
        } as Response;
      }
      if (url.endsWith('/api/auth/refresh')) {
        return {
          ok: true,
          json: async () => ({ accessToken: 'fresh', refreshToken: 'fresh-r', sessionId: 's2' })
        } as Response;
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    expect(await probeBackend()).toEqual({ health: 'ok', ready: 'ready' });
    await register({ email: 'x@example.com', password: 'password123' });
    await logout('refresh-token');

    const auth: AuthContext = {
      accessToken: 'stale',
      refreshToken: 'refresh-token',
      onTokensUpdated: jest.fn()
    };

    await logoutAll(auth);
    await submitPlacement(auth, { correctAnswers: 1, totalQuestions: 2 });
    await completeSession(auth, [{ skillId: 'budget', isCorrect: true }]);
    const accountExport = await exportAccountData(auth);
    expect(accountExport.userId).toBe('user-1');
    const accountDelete = await deleteAccount(auth);
    expect(accountDelete.deleted).toBe(true);
    const entitlement = await fetchEntitlement('user-1', auth);
    expect(entitlement.entitlement.plan).toBe('free');
    const upgraded = await syncEntitlement(auth, {
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      purchaseToken: 'sandbox-purchase-token-12345'
    });
    expect(upgraded.entitlement.plan).toBe('pro');

    await expect(fetchToday('user-1', auth)).rejects.toThrow('Service unavailable');

    expect(fetchSpy).toHaveBeenCalled();
  });
});

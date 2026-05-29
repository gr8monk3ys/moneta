import {
  completeSession,
  confirmPasswordReset,
  deleteAccount,
  exportAccountData,
  fetchEntitlement,
  fetchLearningPath,
  fetchLessonDetails,
  fetchProgress,
  fetchToday,
  login,
  logout,
  logoutAll,
  probeBackend,
  refresh,
  register,
  requestPasswordReset,
  syncEntitlement,
  submitPlacement,
  type AuthContext
} from '../src/lib/api';

describe('mobile api auth retry', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const devGlobal = global as typeof globalThis & { __DEV__?: boolean };
  const originalDev = devGlobal.__DEV__;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    devGlobal.__DEV__ = originalDev;
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

  it('invalidates the session and logs out when the refresh token is rejected', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/auth/refresh')) {
        return { ok: false, status: 401, json: async () => ({ error: 'Invalid refresh token' }) } as Response;
      }
      if (url.endsWith('/api/progress/user-1')) {
        return { ok: false, status: 401, json: async () => ({ error: 'Invalid token' }) } as Response;
      }
      throw new Error(`Unhandled request: ${url}`);
    });
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const onAuthInvalidated = jest.fn();
    const auth: AuthContext = {
      accessToken: 'dead-access',
      refreshToken: 'dead-refresh',
      onTokensUpdated: jest.fn(),
      onAuthInvalidated
    };

    await expect(fetchProgress('user-1', auth)).rejects.toBeTruthy();
    expect(onAuthInvalidated).toHaveBeenCalledTimes(1);
  });

  it('treats an HTTP 401 status as an auth error and refreshes once', async () => {
    let protectedCalls = 0;
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/auth/refresh')) {
        return {
          ok: true,
          json: async () => ({ accessToken: 'fresh', refreshToken: 'fresh-r', sessionId: 's2' })
        } as Response;
      }
      if (url.endsWith('/api/progress/user-1')) {
        protectedCalls += 1;
        const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;
        // No recognizable error message — only the 401 status signals the auth failure.
        if (authHeader === 'Bearer stale') {
          return { ok: false, status: 401, json: async () => ({ error: 'opaque gateway error' }) } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            currentLevel: 'F1',
            streakDays: 1,
            masteredSkills: 0,
            totalSkills: 0,
            plan: 'free',
            premiumActive: false
          })
        } as Response;
      }
      throw new Error(`Unhandled request: ${url}`);
    });
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const auth: AuthContext = { accessToken: 'stale', refreshToken: 'r', onTokensUpdated: jest.fn() };
    const result = await fetchProgress('user-1', auth);

    expect(result.userId).toBe('user-1');
    expect(protectedCalls).toBe(2);
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

  it('normalizes network request failures into a user-facing message', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch'));

    await expect(register({ email: 'x@example.com', password: 'password123' })).rejects.toThrow(
      "Couldn't reach Moneta. Check your connection and app configuration."
    );
  });

  it('normalizes delete request network failures into a user-facing message', async () => {
    const auth: AuthContext = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      onTokensUpdated: jest.fn()
    };

    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch'));

    await expect(deleteAccount(auth)).rejects.toThrow(
      "Couldn't reach Moneta. Check your connection and app configuration."
    );
  });

  it('covers direct auth endpoints plus learning path and lesson detail fetches', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/api/auth/login')) {
        return {
          ok: true,
          json: async () => ({ accessToken: 'a', refreshToken: 'r', userId: 'user-1', sessionId: 's1' })
        } as Response;
      }
      if (url.endsWith('/api/auth/password/reset/request')) {
        return { ok: true, json: async () => ({ success: true }) } as Response;
      }
      if (url.endsWith('/api/auth/password/reset/confirm')) {
        return { ok: true, json: async () => ({ success: true }) } as Response;
      }
      if (url.endsWith('/api/auth/refresh')) {
        return {
          ok: true,
          json: async () => ({ accessToken: 'fresh-a', refreshToken: 'fresh-r', sessionId: 's2' })
        } as Response;
      }
      if (url.endsWith('/api/learn/path/user-1')) {
        expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer access-token');
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
            },
            lessons: [
              {
                lessonId: 'lesson-1',
                title: 'Cash Flow Basics',
                summary: 'Short intro',
                level: 'F1',
                track: 'core',
                premium: false,
                estimatedMinutes: 5,
                locked: false,
                completed: false
              }
            ]
          })
        } as Response;
      }
      if (url.endsWith('/api/learn/lessons/lesson-1')) {
        expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer access-token');
        return {
          ok: true,
          json: async () => ({
            userId: 'user-1',
            lesson: {
              lessonId: 'lesson-1',
              title: 'Cash Flow Basics',
              summary: 'Short intro',
              level: 'F1',
              track: 'core',
              premium: false,
              estimatedMinutes: 5,
              items: [
                {
                  itemId: 'item-1',
                  skillId: 'cash-flow',
                  prompt: 'What is cash flow?'
                }
              ]
            }
          })
        } as Response;
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    const auth: AuthContext = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      onTokensUpdated: jest.fn()
    };

    const loginResponse = await login({ email: 'u1@example.com', password: 'password123' });
    expect(loginResponse.userId).toBe('user-1');
    await expect(requestPasswordReset({ email: 'u1@example.com' })).resolves.toEqual({ success: true });
    await expect(confirmPasswordReset({ email: 'u1@example.com', code: '123456', newPassword: 'next-password' })).resolves.toEqual({ success: true });
    await expect(refresh('refresh-token')).resolves.toMatchObject({ accessToken: 'fresh-a', refreshToken: 'fresh-r' });

    const path = await fetchLearningPath('user-1', auth);
    expect(path.lessons[0]?.lessonId).toBe('lesson-1');

    const lesson = await fetchLessonDetails('lesson-1', auth);
    expect(lesson.lesson.items[0]?.itemId).toBe('item-1');

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('falls back to generic request errors when responses or thrown values are malformed', async () => {
    const auth: AuthContext = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      onTokensUpdated: jest.fn()
    };

    jest.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce('offline')
      .mockImplementationOnce(async () => ({
        ok: false,
        json: async () => {
          throw new Error('invalid json');
        }
      } as unknown as Response))
      .mockRejectedValueOnce('load failure');

    await expect(login({ email: 'u1@example.com', password: 'password123' })).rejects.toThrow('Request failed');
    await expect(deleteAccount(auth)).rejects.toThrow('Request failed');
    await expect(fetchLessonDetails('lesson-1', auth)).rejects.toThrow('Request failed');
  });

  it('requires an API base URL outside development builds', () => {
    jest.resetModules();
    devGlobal.__DEV__ = false;
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    expect(() => require('../src/lib/api')).toThrow('EXPO_PUBLIC_API_BASE_URL is required for non-dev builds.');
  });
});

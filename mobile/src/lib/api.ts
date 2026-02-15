const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const baseUrl = env?.EXPO_PUBLIC_API_BASE_URL ?? (isDev ? 'http://localhost:3000' : '');

if (!baseUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required for non-dev builds.');
}

interface AuthPayload {
  email: string;
  password: string;
  sessionId?: string;
}

export type SubscriptionPlan = 'free' | 'pro';
export type EntitlementSource = 'none' | 'ios' | 'android' | 'web' | 'admin';

export interface Entitlement {
  plan: SubscriptionPlan;
  isActive: boolean;
  source: EntitlementSource;
  productId?: string;
  currentPeriodEndsAt?: string;
  updatedAt: string;
}

export interface FeatureAccess {
  advancedTracks: boolean;
  certificates: boolean;
  streakRepair: boolean;
  unlimitedReviews: boolean;
  maxDueReviews: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  sessionId: string;
}

export interface AuthContext {
  accessToken: string;
  refreshToken: string;
  onTokensUpdated: (tokens: { accessToken: string; refreshToken: string; sessionId: string }) => void;
}

export interface ProgressResponse {
  userId: string;
  currentLevel: string;
  streakDays: number;
  masteredSkills: number;
  totalSkills: number;
  plan: SubscriptionPlan;
  premiumActive: boolean;
  completedLessons?: number;
  totalLessons?: number;
}

export interface TodayReviewItem {
  itemId: string;
  skillId: string;
  dueDate: string;
  contentItemId?: string;
  prompt?: string;
  format?: 'mcq' | 'numeric' | 'scenario';
  choices?: string[];
  explanation?: string;
  locked?: boolean;
}

export interface TodayResponse {
  userId: string;
  dueReviews: TodayReviewItem[];
  practiceReviews?: TodayReviewItem[];
  nextLesson?: { lessonId: string; title: string; estimatedMinutes: number };
  entitlement: Entitlement;
  features: FeatureAccess;
}

export interface PathLesson {
  lessonId: string;
  title: string;
  summary: string;
  level: string;
  track: 'core' | 'advanced';
  premium: boolean;
  estimatedMinutes: number;
  locked: boolean;
  completed: boolean;
}

export interface LessonDetailsResponse {
  userId: string;
  lesson: {
    lessonId: string;
    title: string;
    summary: string;
    level: string;
    track: 'core' | 'advanced';
    premium: boolean;
    estimatedMinutes: number;
    items: Array<{
      itemId: string;
      skillId: string;
      prompt: string;
      format?: 'mcq' | 'numeric' | 'scenario';
      choices?: string[];
      explanation?: string;
    }>;
  };
}

export interface PathResponse {
  userId: string;
  entitlement: Entitlement;
  features: FeatureAccess;
  lessons: PathLesson[];
}

interface PlacementResponse {
  userId: string;
  level: string;
}

export type SessionItemResult =
  | { skillId: string; isCorrect: boolean }
  | { skillId: string; itemId: string; answer: string };

interface SessionResponse {
  userId: string;
  streakDays: number;
  scheduledReviews: Array<{ itemId: string; skillId: string; dueDate: string }>;
  gradedItems?: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }>;
  lessonProgress?: {
    lessonId: string;
    completed: boolean;
    score: number;
    correctCount: number;
    totalItems: number;
    coverage: number;
  };
}

interface HealthResponse {
  status: string;
}

export interface EntitlementResponse {
  userId: string;
  entitlement: Entitlement;
  features: FeatureAccess;
}

export interface AccountExportResponse {
  userId: string;
  email: string;
  generatedAt: string;
  profile: {
    userId: string;
    currentLevel: string;
    streakDays: number;
    lastActiveDate?: string;
    skills: Record<string, { skillId: string; mastery: number; lastReviewedAt?: string; nextReviewAt?: string }>;
    entitlement: Entitlement;
  };
  sessions: {
    total: number;
    active: number;
    refreshTokens: Array<{
      tokenId: string;
      userId: string;
      sessionId: string;
      createdAt: string;
      expiresAt: string;
      revokedAt?: string;
    }>;
  };
  billing: {
    webhookEventsProcessed: number;
    events: Array<{
      eventId: string;
      userId: string;
      platform: 'ios' | 'android' | 'web';
      productId: string;
      payloadHash: string;
      processedAt: string;
    }>;
  };
}

interface SyncEntitlementPayload {
  platform: 'ios' | 'android' | 'web';
  productId: string;
  purchaseToken: string;
}

const refreshInflight = new Map<string, Promise<AuthResponse>>();

async function parseError(response: Response): Promise<never> {
  const body = await response.json().catch(() => ({ error: 'Request failed' }));
  throw new Error(body.error ?? 'Request failed');
}

async function postJson<T>(path: string, payload: unknown, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json() as Promise<T>;
}

async function deleteJson<T>(path: string, payload: unknown, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json() as Promise<T>;
}

function isAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message === 'Invalid token' || message === 'Missing bearer token';
}

async function getRefreshedTokens(refreshToken: string): Promise<AuthResponse> {
  const existing = refreshInflight.get(refreshToken);
  if (existing) {
    return existing;
  }

  const inflight = refresh(refreshToken)
    .finally(() => {
      refreshInflight.delete(refreshToken);
    });

  refreshInflight.set(refreshToken, inflight);
  return inflight;
}

async function withAuthRetry<T>(auth: AuthContext, request: (token: string) => Promise<T>): Promise<T> {
  try {
    return await request(auth.accessToken);
  } catch (error) {
    if (!isAuthError(error)) {
      throw error;
    }

    const rotated = await getRefreshedTokens(auth.refreshToken);
    auth.onTokensUpdated({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      sessionId: rotated.sessionId
    });

    return request(rotated.accessToken);
  }
}

export async function probeBackend(): Promise<{ health: string; ready: string }> {
  const [health, ready] = await Promise.all([
    getJson<HealthResponse>('/health'),
    getJson<HealthResponse>('/ready')
  ]);

  return { health: health.status, ready: ready.status };
}

export async function register(payload: { email: string; password: string }): Promise<{ userId: string; email: string }> {
  return postJson<{ userId: string; email: string }>('/api/auth/register', payload);
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/login', payload);
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/refresh', { refreshToken });
}

export async function logout(refreshToken: string): Promise<void> {
  await postJson('/api/auth/logout', { refreshToken });
}

export async function logoutAll(auth: AuthContext): Promise<void> {
  await withAuthRetry(auth, (token) => postJson('/api/auth/logout-all', {}, token));
}

export async function exportAccountData(auth: AuthContext): Promise<AccountExportResponse> {
  return withAuthRetry(auth, (token) => getJson<AccountExportResponse>('/api/auth/account/export', token));
}

export async function deleteAccount(auth: AuthContext): Promise<{ userId: string; deleted: boolean; deletedAt: string }> {
  return withAuthRetry(auth, (token) => deleteJson<{ userId: string; deleted: boolean; deletedAt: string }>(
    '/api/auth/account',
    { confirmation: 'DELETE_ACCOUNT' },
    token
  ));
}

export async function fetchProgress(userId: string, auth: AuthContext): Promise<ProgressResponse> {
  return withAuthRetry(auth, (token) => getJson<ProgressResponse>(`/api/progress/${userId}`, token));
}

export async function fetchToday(userId: string, auth: AuthContext): Promise<TodayResponse> {
  return withAuthRetry(auth, (token) => getJson<TodayResponse>(`/api/learn/today/${userId}`, token));
}

export async function fetchLearningPath(userId: string, auth: AuthContext): Promise<PathResponse> {
  return withAuthRetry(auth, (token) => getJson<PathResponse>(`/api/learn/path/${userId}`, token));
}

export async function fetchLessonDetails(lessonId: string, auth: AuthContext): Promise<LessonDetailsResponse> {
  return withAuthRetry(auth, (token) => getJson<LessonDetailsResponse>(`/api/learn/lessons/${lessonId}`, token));
}

export async function fetchEntitlement(userId: string, auth: AuthContext): Promise<EntitlementResponse> {
  return withAuthRetry(auth, (token) => getJson<EntitlementResponse>(`/api/billing/entitlements/${userId}`, token));
}

export async function syncEntitlement(auth: AuthContext, payload: SyncEntitlementPayload): Promise<EntitlementResponse> {
  return withAuthRetry(auth, (token) => postJson<EntitlementResponse>('/api/billing/entitlements/sync', payload, token));
}

export async function submitPlacement(auth: AuthContext, score: { correctAnswers: number; totalQuestions: number }): Promise<PlacementResponse> {
  return withAuthRetry(auth, (token) => postJson<PlacementResponse>('/api/onboarding/placement', score, token));
}

export async function completeSession(
  auth: AuthContext,
  itemResults: SessionItemResult[],
  options: { lessonId?: string; timeZone?: string } = {}
): Promise<SessionResponse> {
  return withAuthRetry(auth, (token) => postJson<SessionResponse>(
    '/api/sessions/complete',
    {
      itemResults,
      lessonId: options.lessonId,
      timeZone: options.timeZone
    },
    token
  ));
}

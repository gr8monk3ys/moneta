const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const baseUrl = env?.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

interface AuthPayload {
  email: string;
  password: string;
  sessionId?: string;
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
}

export interface TodayResponse {
  userId: string;
  dueReviews: Array<{ itemId: string; skillId: string; dueDate: string }>;
  nextLesson?: { lessonId: string; title: string; estimatedMinutes: number };
}

interface PlacementResponse {
  userId: string;
  level: string;
}

interface SessionResponse {
  userId: string;
  streakDays: number;
  scheduledReviews: Array<{ itemId: string; skillId: string; dueDate: string }>;
}

interface HealthResponse {
  status: string;
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

export async function register(payload: { userId: string; email: string; password: string }): Promise<void> {
  await postJson('/api/auth/register', payload);
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

export async function fetchProgress(userId: string, auth: AuthContext): Promise<ProgressResponse> {
  return withAuthRetry(auth, (token) => getJson<ProgressResponse>(`/api/progress/${userId}`, token));
}

export async function fetchToday(userId: string, auth: AuthContext): Promise<TodayResponse> {
  return withAuthRetry(auth, (token) => getJson<TodayResponse>(`/api/learn/today/${userId}`, token));
}

export async function submitPlacement(auth: AuthContext, score: { correctAnswers: number; totalQuestions: number }): Promise<PlacementResponse> {
  return withAuthRetry(auth, (token) => postJson<PlacementResponse>('/api/onboarding/placement', score, token));
}

export async function completeSession(auth: AuthContext, itemResults: Array<{ skillId: string; isCorrect: boolean }>): Promise<SessionResponse> {
  return withAuthRetry(auth, (token) => postJson<SessionResponse>('/api/sessions/complete', { itemResults }, token));
}

/**
 * Cầu nối tới auth-service (Spring Boot, repo meridian-backend/auth-service). Chỉ gọi từ
 * phía server — middleware (Edge) lẫn server action / route handler (Node) — nên chỉ dùng
 * `fetch`, không dùng API riêng của Node.
 *
 * Trình duyệt không bao giờ gọi thẳng auth-service: token nằm trong cookie HttpOnly do
 * server này đặt, không cần CORS, và trang HTTPS không bị chặn khi backend còn chạy HTTP.
 */

import type { Credentials, Role } from './auth';
import { ACCESS_COOKIE, REFRESH_COOKIE, decodeJwt } from './auth';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Giây sống của access token. */
  expiresIn: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  createdAt: string;
}

/** `status` 0 = không tới được auth-service (chưa cấu hình, mạng, timeout). */
export class AuthServiceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

const TIMEOUT_MS = 8000;

function baseUrl(): string {
  const url = process.env.AUTH_SERVICE_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080');
  if (!url) throw new AuthServiceError(0, 'AUTH_SERVICE_URL chưa được cấu hình.');
  return url.replace(/\/+$/, '');
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(baseUrl() + path, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof AuthServiceError) throw err;
    console.error('[auth-service] không gọi được', path, err);
    throw new AuthServiceError(0, 'Không kết nối được dịch vụ đăng nhập.');
  }

  if (!res.ok) {
    // Lỗi của auth-service là RFC 9457 ProblemDetail: { status, title, detail }.
    const problem = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    const detail = typeof problem?.detail === 'string' ? problem.detail : res.statusText;
    if (res.status >= 500) console.error('[auth-service]', path, res.status, detail);
    throw new AuthServiceError(res.status, detail);
  }
  return (await res.json()) as T;
}

export function login(credentials: Credentials): Promise<AuthTokens> {
  return call('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export function register(credentials: Credentials): Promise<AuthTokens> {
  return call('/api/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
}

export function refresh(refreshToken: string): Promise<AuthTokens> {
  return call('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
}

/** Nguồn sự thật về danh tính và quyền: auth-service kiểm chữ ký, hạn, và đọc role từ DB. */
export function me(accessToken: string): Promise<AuthUser> {
  return call('/api/users/me', { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
}

/** Lỗi auth-service → câu tiếng Việt cho khách. Không lộ chi tiết kỹ thuật. */
export function describeAuthError(err: unknown): string {
  if (!(err instanceof AuthServiceError)) return 'Có lỗi xảy ra. Vui lòng thử lại.';
  switch (err.status) {
    case 401:
      return 'Email hoặc mật khẩu không đúng.';
    case 409:
      return 'Email này đã có tài khoản. Hãy đăng nhập.';
    case 400:
      return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
    default:
      return 'Dịch vụ đăng nhập tạm thời không phản hồi. Vui lòng thử lại sau ít phút.';
  }
}

export interface CookieSpec {
  name: string;
  value: string;
  maxAge: number;
}

/**
 * Hai cookie HttpOnly, sống đúng bằng token bên trong: cookie access hết hạn thì
 * middleware thấy thiếu và tự làm mới bằng cookie refresh.
 */
export function tokenCookies(tokens: AuthTokens, now = Date.now()): CookieSpec[] {
  const refreshExp = decodeJwt(tokens.refreshToken)?.exp;
  const refreshMaxAge = typeof refreshExp === 'number' ? Math.max(0, Math.floor(refreshExp - now / 1000)) : 7 * 24 * 3600;
  return [
    { name: ACCESS_COOKIE, value: tokens.accessToken, maxAge: tokens.expiresIn },
    { name: REFRESH_COOKIE, value: tokens.refreshToken, maxAge: refreshMaxAge },
  ];
}

export const CLEARED_COOKIES: CookieSpec[] = [
  { name: ACCESS_COOKIE, value: '', maxAge: 0 },
  { name: REFRESH_COOKIE, value: '', maxAge: 0 },
];

export const cookieAttributes = {
  httpOnly: true,
  sameSite: 'lax',
  // localhost được trình duyệt coi là an toàn, nhưng Safari vẫn bỏ cookie Secure trên http.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

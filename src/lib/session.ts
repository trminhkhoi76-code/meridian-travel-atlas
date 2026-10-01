/**
 * Đọc/ghi phiên đăng nhập trong Server Component, server action và route handler. Middleware
 * không dùng file này (nó tự đặt cookie qua NextResponse) — xem src/middleware.ts.
 *
 * Gọi `cookies()` khiến trang thành dynamic: chỉ dùng ở trang tài khoản và /admin, KHÔNG
 * dùng trong app/layout.tsx, nếu không 83 route đang prerender tĩnh sẽ mất hết.
 */

import { cookies } from 'next/headers';
import type { SessionUser } from './auth';
import { ACCESS_COOKIE, sessionFromToken } from './auth';
import type { AuthTokens } from './auth-service';
import { CLEARED_COOKIES, cookieAttributes, tokenCookies } from './auth-service';

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

/** Danh tính để hiển thị, đọc từ access token — middleware đã làm mới token trước khi tới đây. */
export async function getSession(): Promise<SessionUser | null> {
  return sessionFromToken(await getAccessToken());
}

/** Chỉ gọi được trong server action / route handler (Server Component không ghi được cookie). */
export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const jar = await cookies();
  for (const c of tokenCookies(tokens)) jar.set(c.name, c.value, { ...cookieAttributes, maxAge: c.maxAge });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  for (const c of CLEARED_COOKIES) jar.set(c.name, c.value, { ...cookieAttributes, maxAge: 0 });
}

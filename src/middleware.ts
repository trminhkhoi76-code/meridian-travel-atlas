import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, ACCOUNT_PATHS, LOGIN_PATH, REFRESH_COOKIE, isFresh } from '@/lib/auth';
import type { CookieSpec } from '@/lib/auth-service';
import { AuthServiceError, CLEARED_COOKIES, cookieAttributes, me, refresh, tokenCookies } from '@/lib/auth-service';

/**
 * `skipTrailingSlashRedirect` trong next.config.ts tắt chuẩn hoá dấu gạch chéo cuối cho
 * TOÀN bộ app, nhưng chỗ duy nhất cần giữ nguyên dấu gạch chéo là ca #4 của bộ repro —
 * ở đó `…/v1.2` và `…/v1.2/` phải là hai URL riêng, cùng trả 200.
 *
 * Mọi đường dẫn khác được dựng lại đúng cú 308 mà Next vẫn tự làm, để mỗi level của
 * atlas vẫn chỉ có một URL chính tắc.
 */
const KEEP_TRAILING_SLASH = '/url-match/04-dot';

const ADMIN_PATH = /^\/(api\/)?admin(\/|$)/;

/**
 * Chỉ làm mới phiên ở các route dynamic. Trang atlas prerender tĩnh và có thể bị CDN
 * cache: gắn Set-Cookie vào đó là có nguy cơ phát cookie của khách này cho khách khác.
 * SessionProvider gọi /api/session ngay khi mount, nên phiên vẫn được giữ sống.
 */
function needsSession(pathname: string): boolean {
  return pathname === '/api/session' || ACCOUNT_PATHS.includes(pathname) || ADMIN_PATH.test(pathname);
}

/**
 * Access token sắp hết hạn (hoặc cookie đã bị trình duyệt xoá) mà còn refresh token thì
 * đổi cặp mới. Token mới được ghi cả vào request — để Server Component phía sau đọc được
 * ngay — lẫn vào response cho trình duyệt.
 *
 * Nhiều request song song có thể cùng làm mới bằng một refresh token. Auth-service hiện
 * không xoay vòng token nên việc này vô hại; nếu sau này bật phát hiện dùng lại token thì
 * phải gom các lần làm mới này lại.
 */
async function renewSession(request: NextRequest): Promise<{ accessToken?: string; updates: CookieSpec[] }> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken || isFresh(accessToken)) return { accessToken, updates: [] };

  try {
    const tokens = await refresh(refreshToken);
    const updates = tokenCookies(tokens);
    for (const c of updates) request.cookies.set(c.name, c.value);
    return { accessToken: tokens.accessToken, updates };
  } catch (err) {
    if (err instanceof AuthServiceError && err.status === 401) {
      // Refresh token hết hạn / tài khoản bị khoá: đăng xuất hẳn.
      request.cookies.delete([ACCESS_COOKIE, REFRESH_COOKIE]);
      return { updates: CLEARED_COOKIES };
    }
    // Auth-service không phản hồi: giữ nguyên cookie, lần sau thử lại.
    return { accessToken, updates: [] };
  }
}

/**
 * Khu quản trị chỉ cho tài khoản ROLE_ADMIN. Hỏi auth-service mỗi request vì FE không
 * giữ secret để tự kiểm chữ ký JWT, và role trong token có thể đã cũ.
 */
async function guardAdmin(request: NextRequest, accessToken: string | undefined): Promise<NextResponse | null> {
  if (accessToken) {
    try {
      const user = await me(accessToken);
      if (user.role === 'ROLE_ADMIN') return null;
      return new NextResponse('Tài khoản này không có quyền quản trị.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (err) {
      if (!(err instanceof AuthServiceError && err.status === 401)) {
        return new NextResponse('Dịch vụ đăng nhập tạm thời không phản hồi.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }
  }

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Cần đăng nhập.' }, { status: 401 });
  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set('next', pathname + search);
  // 303: server action là POST, quay về trang đăng nhập phải bằng GET.
  return NextResponse.redirect(login, 303);
}

function withCookies(response: NextResponse, updates: CookieSpec[]): NextResponse {
  for (const c of updates) response.cookies.set(c.name, c.value, { ...cookieAttributes, maxAge: c.maxAge });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(KEEP_TRAILING_SLASH)) return NextResponse.next();

  if (pathname.length > 1 && pathname.endsWith('/')) {
    // Phải dựng URL mới từ `request.url` chứ không clone `nextUrl`: khi
    // `skipTrailingSlashRedirect` bật, nextUrl gắn lại dấu gạch chéo lúc serialize
    // nên redirect trỏ về chính nó và vòng vô hạn.
    const target = new URL(`${pathname.replace(/\/+$/, '')}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(target, 308);
  }

  if (!needsSession(pathname)) return NextResponse.next();

  const session = await renewSession(request);
  const isAdmin = ADMIN_PATH.test(pathname);

  if (isAdmin) {
    const denied = await guardAdmin(request, session.accessToken);
    if (denied) return withCookies(denied, session.updates);
  }

  const response = NextResponse.next({ request: { headers: request.headers } });
  response.headers.set('Cache-Control', 'private, no-store');
  if (isAdmin) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return withCookies(response, session.updates);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|geo/|favicon.ico).*)'],
};

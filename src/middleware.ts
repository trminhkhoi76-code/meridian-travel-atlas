import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

/** So sánh không rò thời gian theo vị trí ký tự sai đầu tiên (Edge runtime không có timingSafeEqual). */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Basic Auth cho khu quản trị — tạm thời, tới khi có đăng nhập thật. Đặt
 * ADMIN_USER / ADMIN_PASSWORD trong env. Thiếu mật khẩu: dev thì cho qua (kèm
 * cảnh báo), production thì khoá hẳn, để không bao giờ lỡ mở admin ra ngoài.
 */
function guardAdmin(request: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[admin] ADMIN_PASSWORD chưa đặt — khu quản trị đang mở (chỉ ở dev).');
      return null;
    }
    return new NextResponse('Khu quản trị chưa được cấu hình.', { status: 503 });
  }

  const user = process.env.ADMIN_USER ?? 'admin';
  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(':');
      if (sep >= 0 && safeEqual(decoded.slice(0, sep), user) && safeEqual(decoded.slice(sep + 1), password)) {
        return null;
      }
    } catch {
      /* base64 hỏng — rơi xuống 401 */
    }
  }
  return new NextResponse('Cần đăng nhập.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Meridian admin", charset="UTF-8"' },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_PATH.test(pathname)) {
    const denied = guardAdmin(request);
    if (denied) return denied;
  }

  if (pathname.startsWith(KEEP_TRAILING_SLASH)) return NextResponse.next();

  if (pathname.length > 1 && pathname.endsWith('/')) {
    // Phải dựng URL mới từ `request.url` chứ không clone `nextUrl`: khi
    // `skipTrailingSlashRedirect` bật, nextUrl gắn lại dấu gạch chéo lúc serialize
    // nên redirect trỏ về chính nó và vòng vô hạn.
    const target = new URL(`${pathname.replace(/\/+$/, '')}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(target, 308);
  }

  const response = NextResponse.next();
  if (ADMIN_PATH.test(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|geo/|favicon.ico).*)'],
};

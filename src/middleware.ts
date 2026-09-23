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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(KEEP_TRAILING_SLASH)) return NextResponse.next();

  if (pathname.length > 1 && pathname.endsWith('/')) {
    // Phải dựng URL mới từ `request.url` chứ không clone `nextUrl`: khi
    // `skipTrailingSlashRedirect` bật, nextUrl gắn lại dấu gạch chéo lúc serialize
    // nên redirect trỏ về chính nó và vòng vô hạn.
    const target = new URL(`${pathname.replace(/\/+$/, '')}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(target, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|geo/|favicon.ico).*)'],
};

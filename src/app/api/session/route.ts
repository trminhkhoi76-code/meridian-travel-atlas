import { getSession } from '@/lib/session';

/**
 * GET /api/session — ai đang đăng nhập, cho thanh trên và form đặt chỗ. Tách thành API
 * thay vì đọc cookie trong layout, để các trang atlas vẫn prerender tĩnh.
 *
 * Chỉ giải mã access token (middleware đã làm mới nếu cần), không gọi auth-service: dữ
 * liệu này để hiển thị, không dùng để phân quyền.
 *
 *   200 { user: SessionUser | null }
 */
export async function GET() {
  return Response.json({ user: await getSession() }, { headers: { 'Cache-Control': 'private, no-store' } });
}

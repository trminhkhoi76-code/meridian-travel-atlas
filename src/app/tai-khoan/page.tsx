import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hrefOf } from '@/lib/catalog';
import { ACCOUNT_PATH, LOGIN_PATH, sessionFromToken } from '@/lib/auth';
import type { Role } from '@/lib/auth';
import { AuthServiceError, me } from '@/lib/auth-service';
import type { AuthUser } from '@/lib/auth-service';
import { vnDate } from '@/lib/format';
import { getAccessToken } from '@/lib/session';
import { logoutAction } from './actions';

export const metadata: Metadata = {
  title: 'Tài khoản',
  robots: { index: false },
};

const ROLE_LABEL: Record<Role, string> = { ROLE_USER: 'Khách hàng', ROLE_ADMIN: 'Quản trị viên' };

export default async function AccountPage() {
  const token = await getAccessToken();
  const session = sessionFromToken(token);
  if (!token || !session) redirect(`${LOGIN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`);

  // Hỏi lại auth-service: token có thể còn hạn nhưng tài khoản đã bị khoá hoặc đổi quyền.
  let user: AuthUser | null = null;
  try {
    user = await me(token);
  } catch (err) {
    if (err instanceof AuthServiceError && err.status === 401) {
      redirect(`${LOGIN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`);
    }
    // Auth-service không phản hồi: vẫn hiện thông tin đọc từ token, kèm cảnh báo.
  }

  const email = user?.email ?? session.email;
  const role = user?.role ?? session.role;

  return (
    <main className="container">
      <div className="narrow">
        <div className="panel panel-pad enter">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 className="title-m" style={{ fontSize: 32 }}>
              Tài khoản
            </h1>
            <p className="muted">
              Email này được điền sẵn khi bạn gửi yêu cầu đặt chỗ ở <Link href={hrefOf.cart()}>Giỏ hàng</Link>.
            </p>
          </div>

          {!user && (
            <p className="formerr" role="status">
              Chưa lấy được thông tin mới nhất từ máy chủ — đang hiển thị dữ liệu đã lưu.
            </p>
          )}

          <dl className="facts two">
            <div style={{ gridColumn: '1 / -1' }}>
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div>
              <dt>Vai trò</dt>
              <dd>{ROLE_LABEL[role]}</dd>
            </div>
            <div>
              <dt>Thành viên từ</dt>
              <dd>{user ? vnDate(user.createdAt) : '—'}</dd>
            </div>
          </dl>

          <div className="actions">
            {role === 'ROLE_ADMIN' && (
              <a href="/admin" className="btn-d press">
                Vào khu quản trị →
              </a>
            )}
            <Link href={hrefOf.itinerary()} className="btn-s press">
              Hành trình của tôi
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-s press">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

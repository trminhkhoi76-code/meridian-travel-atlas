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
    <>
      <div className="pbody">
        <Link href={hrefOf.world()} className="back">
          ← Thế giới
        </Link>
        <h1 className="ptitle sm">Tài khoản</h1>
        <p className="pdesc">
          Email này được điền sẵn khi bạn gửi yêu cầu đặt chỗ ở{' '}
          <Link href={hrefOf.itinerary()}>Hành trình</Link>.
        </p>

        {!user && (
          <p className="formerr" role="status">
            Chưa lấy được thông tin mới nhất từ máy chủ — đang hiển thị dữ liệu đã lưu.
          </p>
        )}

        <dl className="meta">
          <div className="wide">
            <dt className="mono">Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt className="mono">Vai trò</dt>
            <dd>{ROLE_LABEL[role]}</dd>
          </div>
          <div>
            <dt className="mono">Thành viên từ</dt>
            <dd>{user ? vnDate(user.createdAt) : '—'}</dd>
          </div>
        </dl>

        {role === 'ROLE_ADMIN' && (
          <p>
            <a href="/admin" className="btn ghost">
              Vào khu quản trị →
            </a>
          </p>
        )}
      </div>

      <div className="pfoot">
        <div className="amt">
          <span className="mono">Đang đăng nhập</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn ghost">
            Đăng xuất
          </button>
        </form>
      </div>
    </>
  );
}

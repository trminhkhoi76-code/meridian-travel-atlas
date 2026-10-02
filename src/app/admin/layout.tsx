import type { Metadata } from 'next';
import './admin.css';
import AdminNav from '@/components/admin/AdminNav';
import { isOverdue } from '@/lib/booking';
import { listBookings } from '@/lib/booking-store';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Quản trị', template: '%s · Quản trị Meridian' },
  robots: { index: false, follow: false },
};

/**
 * Khu quản trị: không header/footer của trang khách (SiteFrame bỏ qua /admin), không
 * tag đo lường. Middleware chỉ cho tài khoản ROLE_ADMIN của auth-service vào tới đây.
 * Dùng chung token và nút/pill của globals.css; admin.css chỉ thêm bố cục riêng.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const now = Date.now();
  const [bookings, session] = await Promise.all([listBookings(), getSession()]);
  const overdue = bookings.filter((r) => isOverdue(r, now)).length;

  return (
    <div className="admin">
      <AdminNav overdue={overdue} email={session?.email} />
      <main className="amain">
        <p className="amock">
          Kho giả lập trong bộ nhớ · dữ liệu mẫu + yêu cầu gửi từ lúc máy chủ khởi động · khởi động lại là mất
        </p>
        {children}
      </main>
    </div>
  );
}

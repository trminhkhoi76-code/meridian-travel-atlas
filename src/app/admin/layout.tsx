import type { Metadata } from 'next';
import './admin.css';
import AdminNav from '@/components/admin/AdminNav';
import { isOverdue } from '@/lib/booking';
import { listBookings } from '@/lib/booking-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Quản trị', template: '%s · Quản trị Meridian' },
  robots: { index: false, follow: false },
};

/**
 * Khu quản trị: không quả cầu (SiteFrame bỏ AtlasShell ở /admin), không tag đo
 * lường, có Basic Auth ở middleware. `body` của site khoá cuộn (quả cầu chiếm
 * trọn màn hình), nên `.admin` tự cuộn.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const now = Date.now();
  const overdue = (await listBookings()).filter((r) => isOverdue(r, now)).length;

  return (
    <div className="admin">
      <AdminNav overdue={overdue} />
      <main className="amain">
        <p className="amock mono">
          Kho giả lập trong bộ nhớ · dữ liệu mẫu + yêu cầu gửi từ lúc máy chủ khởi động · khởi động lại là mất
        </p>
        {children}
      </main>
    </div>
  );
}

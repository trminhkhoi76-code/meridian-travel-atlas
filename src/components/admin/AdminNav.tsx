'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/tai-khoan/actions';
import ThemeToggle from '../ThemeToggle';

const LINKS = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/yeu-cau', label: 'Yêu cầu đặt chỗ' },
  { href: '/admin/lich', label: 'Lịch khởi hành' },
  { href: '/admin/danh-muc', label: 'Danh mục' },
];

export default function AdminNav({ overdue, email }: { overdue: number; email?: string }) {
  const pathname = usePathname();
  const isOn = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="anav" aria-label="Quản trị">
      <Link href="/admin" className="brand">
        Meridian<em>Quản trị</em>
      </Link>
      <ul>
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={isOn(l.href) ? 'page' : undefined}>
              {l.label}
              {l.href === '/admin/yeu-cau' && overdue > 0 && (
                <b className="nbadge" aria-label={`${overdue} quá hạn`}>
                  {overdue}
                </b>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="anav-foot">
        <ThemeToggle />
        {email && (
          <form action={logoutAction} className="anav-user">
            <span className="mono" title={email}>
              {email}
            </span>
            <button type="submit">Đăng xuất</button>
          </form>
        )}
        <a href="/">← Trang khách</a>
      </div>
    </nav>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

/**
 * Chọn khung theo đường dẫn: trang khách có header, thanh tab (điện thoại) và
 * footer; /admin có layout riêng (app/admin/layout.tsx).
 */
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return <>{children}</>;
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}

/**
 * Chỉ render ở trang khách. Bọc các tag đo lường bên thứ ba: trang admin hiện
 * tên, email, số điện thoại của khách — không để heatmap ghi lại.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isAdminPath(pathname) ? null : <>{children}</>;
}

'use client';

import { usePathname } from 'next/navigation';
import AtlasShell from './AtlasShell';

export const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

/**
 * Chọn khung theo đường dẫn: mọi trang khách nằm trong AtlasShell (quả cầu
 * không unmount khi chuyển route), còn /admin có layout riêng, không quả cầu.
 */
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return <>{children}</>;
  return <AtlasShell>{children}</AtlasShell>;
}

/**
 * Chỉ render ở trang khách. Bọc các tag đo lường bên thứ ba: trang admin hiện
 * tên, email, số điện thoại của khách — không để heatmap ghi lại.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isAdminPath(pathname) ? null : <>{children}</>;
}

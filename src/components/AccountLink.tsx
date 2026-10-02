'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACCOUNT_PATH, ACCOUNT_PATHS, LOGIN_PATH } from '@/lib/auth';
import { JA_UI } from '@/lib/ja';
import type { Lang } from '@/lib/ja';
import { useSession } from './SessionProvider';

/** Nút tài khoản trên thanh trên: "Đăng nhập" (kèm quay lại trang đang xem) hoặc tên tài khoản. */
export default function AccountLink({ lang = 'vi' }: { lang?: Lang }) {
  const { user } = useSession();
  const pathname = usePathname();

  // Đang tải: giữ chỗ cùng kích thước để thanh trên không nhảy.
  if (user === undefined) return <span className="acct off" aria-hidden="true" />;

  if (user) {
    const name = user.email.split('@')[0];
    return (
      <Link
        href={ACCOUNT_PATH}
        className="acct mono"
        title={user.email}
        aria-label={`${lang === 'ja' ? JA_UI.account : 'Tài khoản'}: ${user.email}`}
      >
        <span className="acct-full">{name}</span>
        <span className="acct-short">{name.charAt(0).toUpperCase()}</span>
      </Link>
    );
  }

  const next = ACCOUNT_PATHS.includes(pathname) ? '' : `?next=${encodeURIComponent(pathname)}`;
  const label = lang === 'ja' ? JA_UI.login : 'Đăng nhập';
  return (
    <Link href={LOGIN_PATH + next} className="acct mono" aria-label={label}>
      <span className="acct-full">{label}</span>
      <span className="acct-short">↪</span>
    </Link>
  );
}

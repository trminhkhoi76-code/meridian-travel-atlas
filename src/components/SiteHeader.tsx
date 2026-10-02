'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACCOUNT_PATH, ACCOUNT_PATHS, LOGIN_PATH } from '@/lib/auth';
import { IconBag, IconCompass, IconGrid, IconHeart, IconImage, IconRoute, IconSearch, IconUser, Logo } from './Icons';
import { useSession } from './SessionProvider';
import { useTrip } from './TripProvider';

type Section = 'explore' | 'category' | 'gallery' | 'trip' | 'cart' | 'none';

function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/danh-muc')) return 'category';
  if (pathname.startsWith('/thu-vien-anh')) return 'gallery';
  if (pathname.startsWith('/hanh-trinh')) return 'trip';
  if (pathname.startsWith('/gio-hang')) return 'cart';
  if (ACCOUNT_PATHS.includes(pathname)) return 'none';
  return 'explore';
}

const NAV: Array<{ id: Section; label: string; href: string }> = [
  { id: 'explore', label: 'Khám phá', href: '/' },
  { id: 'category', label: 'Danh mục', href: '/danh-muc/luu-tru' },
  { id: 'gallery', label: 'Thư viện ảnh', href: '/thu-vien-anh' },
  { id: 'trip', label: 'Hành trình', href: '/hanh-trinh' },
];

function AccountButton() {
  const { user } = useSession();
  const pathname = usePathname();
  // Đang tải: giữ chỗ cùng kích thước để thanh trên không nhảy.
  if (user === undefined) return <span className="acct off" aria-hidden="true" />;
  if (user) {
    return (
      <Link href={ACCOUNT_PATH} className="acct" title={user.email} aria-label={`Tài khoản: ${user.email}`}>
        <IconUser size={18} />
        <span>{user.email.split('@')[0]}</span>
      </Link>
    );
  }
  const next = ACCOUNT_PATHS.includes(pathname) ? '' : `?next=${encodeURIComponent(pathname)}`;
  return (
    <Link href={LOGIN_PATH + next} className="acct">
      Đăng nhập
    </Link>
  );
}

/** Thanh trên (desktop) + thanh tab dưới (điện thoại). Số trên giỏ đọc từ TripProvider. */
export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const section = sectionOf(pathname);
  const { trip, ready } = useTrip();
  const [q, setQ] = useState('');
  const count = ready ? trip.cart.length : 0;
  const cartLabel = count ? `Giỏ hàng, ${count} trải nghiệm` : 'Giỏ hàng';

  return (
    <>
      <header className="site-header">
        <div className="container sh-in">
          <Link href="/" className="logo" aria-label="Meridian Travel — trang chủ">
            <Logo />
            <b>Meridian</b>
          </Link>
          <nav className="sh-nav" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <Link key={item.id} href={item.href} className="press" aria-current={section === item.id ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <form
            className="sh-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/tim-kiem');
            }}
          >
            <label>
              <IconSearch size={18} />
              <span className="sr-only">Tìm kiếm</span>
              <input
                type="search"
                name="q"
                placeholder="Quốc gia, thành phố, địa điểm…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </form>
          <div className="sh-icons">
            <Link href="/tim-kiem" className="icon-link find" aria-label="Tìm kiếm">
              <IconSearch size={22} />
            </Link>
            <Link href="/hanh-trinh" className="icon-link saved" aria-label="Đã lưu trong hành trình">
              <IconHeart size={22} />
            </Link>
            <Link href="/gio-hang" className="icon-link cart" aria-label={cartLabel} aria-current={section === 'cart' ? 'page' : undefined}>
              <IconBag size={22} />
              {count > 0 && (
                <span className="badge" key={count} aria-hidden="true">
                  {count}
                </span>
              )}
            </Link>
            <AccountButton />
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Điều hướng chính (điện thoại)">
        <Link href="/" aria-current={section === 'explore' ? 'page' : undefined}>
          <IconCompass size={22} />
          Khám phá
        </Link>
        <Link href="/danh-muc/luu-tru" aria-current={section === 'category' ? 'page' : undefined}>
          <IconGrid size={22} />
          Danh mục
        </Link>
        <Link href="/thu-vien-anh" aria-current={section === 'gallery' ? 'page' : undefined}>
          <IconImage size={22} />
          Ảnh
        </Link>
        <Link href="/hanh-trinh" aria-current={section === 'trip' ? 'page' : undefined}>
          <IconRoute size={22} />
          Hành trình
        </Link>
        <Link href="/gio-hang" aria-current={section === 'cart' ? 'page' : undefined} aria-label={cartLabel}>
          <IconBag size={22} />
          Giỏ
          {count > 0 && (
            <span className="badge" key={count} aria-hidden="true">
              {count}
            </span>
          )}
        </Link>
      </nav>
    </>
  );
}

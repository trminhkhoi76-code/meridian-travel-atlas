import Link from 'next/link';
import { IconChevronLeft } from './Icons';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Đường dẫn cấp bậc: Trang chủ › Việt Nam › Phú Quốc › Bãi Ông Lang. Mục cuối là
 * trang hiện tại. Trên điện thoại chỉ còn một nút "‹ <cấp trên>".
 */
export default function Crumbs({ items }: { items: Crumb[] }) {
  const parent = [...items].reverse().find((c) => c.href);
  return (
    <nav className="crumbs" aria-label="Đường dẫn">
      {parent?.href && (
        <Link href={parent.href} className="crumb-back">
          <IconChevronLeft size={18} />
          {parent.label}
        </Link>
      )}
      {items.flatMap((c, i) => {
        const node = c.href ? (
          <Link key={`c${i}`} href={c.href}>
            {c.label}
          </Link>
        ) : (
          <span key={`c${i}`} aria-current="page">
            {c.label}
          </span>
        );
        return i === 0
          ? [node]
          : [
              <span key={`s${i}`} aria-hidden="true">
                ›
              </span>,
              node,
            ];
      })}
    </nav>
  );
}

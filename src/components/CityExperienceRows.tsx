'use client';

import Link from 'next/link';
import { CAT_LABEL } from '@/lib/catalog';
import type { Cat } from '@/lib/catalog';
import { ratingLabel, vnd } from '@/lib/format';
import { swatch } from '@/lib/swatch';
import { usePinFocus } from './PinFocusProvider';

export interface ExperienceRow {
  key: string;
  href: string;
  title: string;
  cat: Cat;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
}

/**
 * Danh sách trải nghiệm ở bảng bán tầng thành phố. Rê chuột/focus vào một
 * dòng sẽ hiện nhãn của đúng ghim đó trên quả cầu (ghim tầng này mặc định
 * không có nhãn — xem placePins trong AtlasShell).
 */
export default function CityExperienceRows({ rows }: { rows: ExperienceRow[] }) {
  const { setHovered } = usePinFocus();

  return (
    <div className="rows">
      {rows.map((row) => (
        <Link
          key={row.key}
          href={row.href}
          className="row"
          onMouseEnter={() => setHovered(row.key)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(row.key)}
          onBlur={() => setHovered(null)}
        >
          <span className="sw" style={{ background: swatch(row.cat) }} aria-hidden="true" />
          <span className="txt">
            <b>{row.title}</b>
            <small>
              {CAT_LABEL[row.cat]} · {row.duration} · {ratingLabel(row.rating)} ★ ({row.reviews})
            </small>
          </span>
          <span className="pr">
            <b>{vnd(row.price)}</b>
            <small>mỗi khách</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

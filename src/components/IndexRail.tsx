import Link from 'next/link';
import { COUNTRIES, hrefOf } from '@/lib/catalog';
import { LEVEL_LABEL } from '@/lib/geo';
import type { RouteState } from '@/lib/route';

interface Entry {
  key: string;
  href: string;
  label: string;
  current: boolean;
}

/**
 * Mục lục góc dưới bên trái: danh sách chữ của đúng những gì đang có ghim trên
 * quả cầu, cộng dải số đo toạ độ và tỉ lệ bản đồ (giá trị do canvas cập nhật).
 */
export default function IndexRail({ route }: { route: RouteState }) {
  let heading: string;
  let entries: Entry[];
  let wide = false;

  if (route.city) {
    heading = `Mục lục · ${route.city.name}`;
    wide = true;
    entries = route.city.experiences.map((e) => ({
      key: e.key,
      href: hrefOf.experience(e),
      label: e.title,
      current: route.experience?.key === e.key,
    }));
  } else if (route.country) {
    heading = `Mục lục · ${route.country.name}`;
    entries = route.country.cities.map((c) => ({
      key: c.key,
      href: hrefOf.city(c),
      label: c.name,
      current: false,
    }));
  } else {
    heading = 'Mục lục · sáu điểm đến';
    entries = COUNTRIES.map((c) => ({
      key: c.key,
      href: hrefOf.country(c),
      label: c.name,
      current: false,
    }));
  }

  return (
    <div className="index">
      <h3 className="mono">{heading}</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.key} className={wide ? 'wide' : undefined}>
            <Link href={e.href} className={e.current ? 'on' : undefined}>
              <i aria-hidden="true" />
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="readout">
        <span>
          VĨ ĐỘ <b data-readout="lat">—</b>
        </span>
        <span>
          KINH ĐỘ <b data-readout="lon">—</b>
        </span>
        <span>
          TỈ LỆ <b data-readout="scale">—</b>
        </span>
        <span>
          CẤP <b>{LEVEL_LABEL[route.level]}</b>
        </span>
      </div>
    </div>
  );
}

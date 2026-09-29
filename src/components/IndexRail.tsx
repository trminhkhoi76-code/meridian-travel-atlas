import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { LEVEL_LABEL } from '@/lib/geo';
import { JA_COUNTRY, JA_LEVEL_LABEL, JA_UI } from '@/lib/ja';
import type { RouteState } from '@/lib/route';
import { useCatalog } from './CatalogProvider';

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
  const { countries } = useCatalog();
  const ja = route.lang === 'ja' ? JA_COUNTRY[route.country?.slug ?? ''] : undefined;
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
    heading = ja ? `${JA_UI.index} · ${ja.name}` : `Mục lục · ${route.country.name}`;
    entries = route.country.cities.map((c) => ({
      key: c.key,
      href: hrefOf.city(c),
      label: ja?.cities[c.slug]?.name ?? c.name,
      current: false,
    }));
  } else {
    heading = 'Mục lục · sáu điểm đến';
    entries = countries.map((c) => ({
      key: c.key,
      href: hrefOf.country(c),
      label: c.name,
      current: false,
    }));
  }

  return (
    <div className="index" lang={ja ? 'ja' : undefined}>
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
          {ja ? JA_UI.lat : 'VĨ ĐỘ'} <b data-readout="lat">—</b>
        </span>
        <span>
          {ja ? JA_UI.lon : 'KINH ĐỘ'} <b data-readout="lon">—</b>
        </span>
        <span>
          {ja ? JA_UI.scale : 'TỈ LỆ'} <b data-readout="scale">—</b>
        </span>
        <span>
          {ja ? JA_UI.level : 'CẤP'} <b>{(ja ? JA_LEVEL_LABEL : LEVEL_LABEL)[route.level]}</b>
        </span>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { Cat } from '@/lib/catalog';
import { CAT_LABEL, CAT_ORDER, byRating } from '@/lib/catalog';
import { ExperienceRow } from './cards';
import { useCatalog } from './CatalogProvider';

type Sort = 'rating' | 'price-asc' | 'price-desc';

/**
 * Danh sách trải nghiệm có chip lọc theo danh mục và chọn cách sắp xếp. Nhận khoá
 * thay vì object (Server → Client), tra lại qua CatalogProvider. Đổi bộ lọc thì
 * danh sách chạy lại hiệu ứng xuất hiện, so le từng thẻ.
 */
export default function ExperienceFilter({ keys, heading, headingId }: { keys: string[]; heading: string; headingId: string }) {
  const { byKey } = useCatalog();
  const all = useMemo(() => keys.map((k) => byKey.get(k)!).filter(Boolean), [keys, byKey]);
  const [cat, setCat] = useState<Cat | 'ALL'>('ALL');
  const [sort, setSort] = useState<Sort>('rating');
  const [tick, setTick] = useState(0);

  const cats = CAT_ORDER.filter((c) => all.some((e) => e.cat === c));
  const shown = (cat === 'ALL' ? all : all.filter((e) => e.cat === cat)).sort((a, b) =>
    sort === 'rating' ? byRating(a, b) : sort === 'price-asc' ? a.price - b.price : b.price - a.price,
  );

  return (
    <>
      <div className="sec-head">
        <h2 id={headingId}>{heading}</h2>
        <label>
          <span className="sr-only">Sắp xếp</span>
          <select className="select" value={sort} onChange={(e) => (setSort(e.target.value as Sort), setTick((t) => t + 1))}>
            <option value="rating">Sắp xếp: Đánh giá cao</option>
            <option value="price-asc">Sắp xếp: Giá thấp trước</option>
            <option value="price-desc">Sắp xếp: Giá cao trước</option>
          </select>
        </label>
      </div>
      <div className="pills" role="group" aria-label="Lọc theo danh mục">
        {(['ALL', ...cats] as const).map((c) => (
          <button
            key={c}
            type="button"
            className="pill press"
            aria-pressed={cat === c}
            onClick={() => {
              setCat(c);
              setTick((t) => t + 1);
            }}
          >
            {c === 'ALL' ? 'Tất cả' : CAT_LABEL[c]}{' '}
            <span className="count">{c === 'ALL' ? all.length : all.filter((e) => e.cat === c).length}</span>
          </button>
        ))}
      </div>
      <div className="grid g3" key={tick}>
        {shown.map((e, i) => (
          <ExperienceRow key={e.key} e={e} style={{ animationDelay: `${i * 45}ms` }} />
        ))}
      </div>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { Cat } from '@/lib/catalog';
import { CAT_NOUN, byRating } from '@/lib/catalog';
import { ExperienceCard } from './cards';
import { useCatalog } from './CatalogProvider';
import { IconFilter } from './Icons';

const BANDS = {
  all: { label: 'Tất cả', test: () => true },
  lt5: { label: 'Dưới 5 triệu', test: (p: number) => p < 5_000_000 },
  m5: { label: '5 – 10 triệu', test: (p: number) => p >= 5_000_000 && p <= 10_000_000 },
  gt10: { label: 'Trên 10 triệu', test: (p: number) => p > 10_000_000 },
} as const;
type Band = keyof typeof BANDS;
type Sort = 'rating' | 'price-asc' | 'price-desc';
const PAGE = 9;

/** Bộ lọc + kết quả của một danh mục. Lọc ngay phía client — mỗi danh mục chỉ vài chục mục. */
export default function CategoryResults({ cat }: { cat: Cat }) {
  const { countries, byKey } = useCatalog();
  const items = useMemo(() => [...byKey.values()].filter((e) => e.cat === cat), [byKey, cat]);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [band, setBand] = useState<Band>('all');
  const [top, setTop] = useState(false);
  const [sort, setSort] = useState<Sort>('rating');
  const [all, setAll] = useState(false);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);

  const change = (fn: () => void) => {
    fn();
    setAll(false);
    setTick((t) => t + 1);
  };

  const passRating = (r: number) => !top || r >= 4.8;
  const byCountry = items.filter((e) => !off[e.country.key]);
  const filtered = byCountry
    .filter((e) => BANDS[band].test(e.price) && passRating(e.rating))
    .sort((a, b) => (sort === 'rating' ? byRating(a, b) : sort === 'price-asc' ? a.price - b.price : b.price - a.price));
  const limit = all ? filtered.length : PAGE;
  const present = countries.filter((c) => items.some((e) => e.country === c));
  const activeFilters = Object.values(off).filter(Boolean).length + (band !== 'all' ? 1 : 0) + (top ? 1 : 0);

  return (
    <div className="cat-grid">
      <button
        type="button"
        className="btn-s btn-sm filter-toggle press"
        aria-expanded={open}
        aria-controls="cat-filters"
        onClick={() => setOpen((o) => !o)}
        style={{ gridColumn: 'span 12', justifySelf: 'start', marginBottom: 12 }}
      >
        <IconFilter size={16} />
        Bộ lọc{activeFilters ? ` (${activeFilters})` : ''}
      </button>
      <aside id="cat-filters" className={'filters' + (open ? ' open' : '')} aria-label="Bộ lọc">
        <fieldset>
          <legend>Quốc gia</legend>
          {present.map((c) => (
            <label key={c.key}>
              <input type="checkbox" checked={!off[c.key]} onChange={() => change(() => setOff({ ...off, [c.key]: !off[c.key] }))} />
              <span>{c.name}</span>
              <span>{items.filter((e) => e.country === c && BANDS[band].test(e.price) && passRating(e.rating)).length}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Khoảng giá mỗi khách</legend>
          {(Object.keys(BANDS) as Band[]).map((k) => (
            <label key={k}>
              <input type="radio" name="price" checked={band === k} onChange={() => change(() => setBand(k))} />
              <span>{BANDS[k].label}</span>
              <span>{byCountry.filter((e) => BANDS[k].test(e.price) && passRating(e.rating)).length}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Đánh giá</legend>
          <div className="pills">
            <button type="button" className="pill press" aria-pressed={!top} onClick={() => change(() => setTop(false))}>
              Tất cả
            </button>
            <button type="button" className="pill press" aria-pressed={top} onClick={() => change(() => setTop(true))}>
              ★ 4,8+
            </button>
          </div>
        </fieldset>
        <button
          type="button"
          className="btn-s btn-sm press"
          onClick={() =>
            change(() => {
              setOff({});
              setBand('all');
              setTop(false);
            })
          }
        >
          Xoá bộ lọc
        </button>
      </aside>

      <section className="results" aria-label="Kết quả">
        <div className="sec-head" style={{ alignItems: 'center' }}>
          <p className="note" role="status">
            {filtered.length} {CAT_NOUN[cat]}
          </p>
          <label>
            <span className="sr-only">Sắp xếp</span>
            <select className="select" value={sort} onChange={(e) => change(() => setSort(e.target.value as Sort))}>
              <option value="rating">Sắp xếp: Đánh giá cao</option>
              <option value="price-asc">Sắp xếp: Giá thấp trước</option>
              <option value="price-desc">Sắp xếp: Giá cao trước</option>
            </select>
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className="empty pop">Không có {CAT_NOUN[cat]} nào khớp bộ lọc. Thử bỏ bớt quốc gia hoặc đổi khoảng giá.</div>
        ) : (
          <div className="grid" key={tick}>
            {filtered.slice(0, limit).map((e, i) => (
              <ExperienceCard key={e.key} e={e} showCat={false} style={{ animation: `rise .5s var(--out) ${(i % PAGE) * 40}ms both` }} />
            ))}
          </div>
        )}
        {filtered.length > limit && (
          <button type="button" className="btn-s press" style={{ alignSelf: 'center', marginTop: 12, borderColor: 'var(--ink)' }} onClick={() => setAll(true)}>
            Xem thêm {filtered.length - limit} {CAT_NOUN[cat]}
          </button>
        )}
      </section>
    </div>
  );
}

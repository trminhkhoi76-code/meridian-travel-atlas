'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { Cat, Place } from '@/lib/catalog';
import { CAT_LABEL, CAT_ORDER, byRating, hrefOf } from '@/lib/catalog';
import { ratingLabel, vnd } from '@/lib/format';
import type { MapRegion } from '@/lib/map';
import { cluster, pctOf } from '@/lib/map';
import { useCatalog } from './CatalogProvider';
import { IconClose, IconPin, IconPlus } from './Icons';
import MapView from './MapView';
import Photo from './Photo';
import SaveButton from './SaveButton';
import ShareButton from './ShareButton';
import { useTrip } from './TripProvider';

type Sort = 'suggest' | 'price' | 'rating';

const minPrice = (p: Place) => (p.experiences.length ? Math.min(...p.experiences.map((e) => e.price)) : Infinity);
const maxRating = (p: Place) => (p.experiences.length ? Math.max(...p.experiences.map((e) => e.rating)) : 0);

/** Cấp 2 · Thành phố — danh sách địa điểm + bản đồ, lọc theo danh mục. */
export default function CityExplorer({ cityKey, map }: { cityKey: string; map: MapRegion }) {
  const { cities } = useCatalog();
  const { inTrip, toggleSaved, ready } = useTrip();
  const city = cities.get(cityKey)!;
  const [cat, setCat] = useState<Cat | 'ALL'>('ALL');
  const [sort, setSort] = useState<Sort>('suggest');
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLElement>(null);

  const number = useMemo(() => new Map(city.places.map((p, i) => [p.key, i + 1])), [city]);
  const cats = CAT_ORDER.filter((c) => city.experiences.some((e) => e.cat === c));
  const shown = useMemo(() => {
    const list = cat === 'ALL' ? [...city.places] : city.places.filter((p) => p.experiences.some((e) => e.cat === cat));
    if (sort === 'price') list.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === 'rating') list.sort((a, b) => maxRating(b) - maxRating(a));
    return list;
  }, [city, cat, sort]);
  const clusters = useMemo(() => cluster(map, shown, (p) => p.coord, 36), [map, shown]);

  const selCluster = clusters.find((c) => c.items.some((p) => p.key === sel));
  const pick = (key: string) => setSel((cur) => (cur === key ? null : key));

  function rerun(fn: () => void) {
    fn();
    setTick((t) => t + 1);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="title-l enter">{city.name}</h1>
          <p className="lede">{city.blurb}</p>
        </div>
        <div className="actions">
          <SaveButton itemKey={city.key} label={city.name} variant="button" className="btn-s btn-sm" />
          <ShareButton title={`${city.name}, ${city.country.name}`} withLabel />
        </div>
      </header>

      <div className="filterbar">
        <div className="pills" role="group" aria-label="Lọc theo danh mục">
          {(['ALL', ...cats] as const).map((c) => (
            <button key={c} type="button" className="pill press" aria-pressed={cat === c} onClick={() => rerun(() => setCat(c))}>
              {c === 'ALL' ? 'Tất cả' : CAT_LABEL[c]}{' '}
              <span className="count">
                {c === 'ALL' ? city.places.length : city.places.filter((p) => p.experiences.some((e) => e.cat === c)).length}
              </span>
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Sắp xếp địa điểm</span>
          <select className="select" value={sort} onChange={(e) => rerun(() => setSort(e.target.value as Sort))}>
            <option value="suggest">Gợi ý cho bạn</option>
            <option value="price">Giá thấp nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </label>
      </div>

      <div className="city-grid">
        <div className="city-map">
          <MapView
            region={map}
            label={`Bản đồ ${city.name}`}
          >
            {clusters.map((c) => {
              const style = { left: pctOf(map, c.x), top: pctOf(map, c.y) };
              const on = c.items.some((p) => p.key === sel);
              const hov = c.items.some((p) => p.key === hover);
              if (c.items.length > 1) {
                return (
                  <span key={c.items.map((p) => p.key).join()}>
                    {on && <span className="pin-ring" style={style} aria-hidden="true" />}
                    <button
                      type="button"
                      className={'pin cl dropin' + (on ? ' is-sel' : '')}
                      style={style}
                      aria-pressed={on}
                      aria-label={`${c.items.length} địa điểm gần nhau: ${c.items.map((p) => p.name).join(', ')}`}
                      onClick={() => pick(c.items[0].key)}
                    >
                      {c.items.length}
                    </button>
                  </span>
                );
              }
              const p = c.items[0];
              return (
                <span key={p.key}>
                  {on && <span className="pin-ring" style={style} aria-hidden="true" />}
                  <button
                    type="button"
                    className={'pin num dropin' + (on ? ' is-sel' : hov ? ' is-hover' : '')}
                    style={{ ...style, animationDelay: `${150 + (number.get(p.key)! - 1) * 70}ms` }}
                    aria-pressed={on}
                    aria-label={`${number.get(p.key)}. ${p.name}`}
                    onClick={() => pick(p.key)}
                    onMouseEnter={() => setHover(p.key)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {number.get(p.key)}
                  </button>
                </span>
              );
            })}
            {selCluster && (
              <MapPop
                key={sel}
                x={selCluster.x / map.size}
                y={selCluster.y / map.size}
                places={selCluster.items}
                onClose={() => setSel(null)}
              />
            )}
          </MapView>
        </div>

        <section className="city-list" aria-label={`Địa điểm ở ${city.name}`} ref={listRef}>
          <button
            type="button"
            className="sheet-grip"
            aria-label="Cuộn tới danh sách hoặc về bản đồ"
            onClick={() => {
              const el = listRef.current;
              if (!el) return;
              const top = el.getBoundingClientRect().top;
              window.scrollTo({ top: top > 200 ? window.scrollY + top - 56 : 0, behavior: 'smooth' });
            }}
          >
            <span />
          </button>
          <p className="note">
            {shown.length} địa điểm<span className="hover-only"> · rê chuột vào thẻ để thấy ghim, bấm ghim để xem nhanh</span>
          </p>
          <div key={tick} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shown.map((p, i) => {
              const exps = (cat === 'ALL' ? p.experiences : p.experiences.filter((e) => e.cat === cat)).sort(byRating);
              const saved = ready && inTrip(p.key);
              return (
                <article
                  key={p.key}
                  className={'pcard cardin' + (p.key === sel ? ' is-sel' : p.key === hover ? ' is-hover' : '')}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onMouseEnter={() => setHover(p.key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <Photo label={p.name} seed={p.key} caption={false}>
                    <span className="n" aria-hidden="true">
                      {number.get(p.key)}
                    </span>
                  </Photo>
                  <div className="pcard-body">
                    <div className="pcard-top">
                      <div>
                        <span className="kicker">{p.kind}</span>
                        <br />
                        <Link href={hrefOf.place(p)}>{p.name}</Link>
                      </div>
                      <button
                        type="button"
                        className="icon-btn press"
                        style={{ color: 'var(--teal)' }}
                        aria-pressed={p.key === sel}
                        aria-label={`Xem ${p.name} trên bản đồ`}
                        onClick={() => pick(p.key)}
                      >
                        <IconPin />
                      </button>
                    </div>
                    <p>{p.blurb}</p>
                    {exps.length > 0 ? (
                      <div className="pcard-exps">
                        {exps.map((e) => (
                          <Link key={e.key} href={hrefOf.experience(e)} className="erow">
                            <span>
                              <span className="k">
                                {CAT_LABEL[e.cat]} · {e.duration} · ★ {ratingLabel(e.rating)}
                              </span>
                              <b>{e.title}</b>
                            </span>
                            <b>{vnd(e.price)}</b>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="free-line">
                        <IconPlus size={16} />
                        Điểm tham quan tự do —{' '}
                        <button type="button" className="linklike" aria-pressed={saved} onClick={() => toggleSaved(p.key, p.name)}>
                          {saved ? 'đã có trong hành trình' : 'thêm vào hành trình'}
                        </button>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

/** Thẻ xem nhanh cạnh ghim; với cụm thì liệt kê các địa điểm trong cụm. */
function MapPop({ x, y, places, onClose }: { x: number; y: number; places: Place[]; onClose: () => void }) {
  // Đặt theo % của khung vuông — cùng hệ toạ độ với ghim. Ghim ở nửa phải thì thẻ
  // nằm bên trái ghim; ghim ở thấp thì thẻ mọc lên trên.
  const right = x > 0.55;
  const low = y > 0.68;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const style: React.CSSProperties = {
    left: right ? undefined : `calc(${pct(x)} + 26px)`,
    right: right ? `calc(${pct(1 - x)} + 26px)` : undefined,
    top: low ? undefined : `calc(${pct(y)} - 30px)`,
    bottom: low ? `calc(${pct(1 - y)} - 30px)` : undefined,
  };
  const one = places.length === 1 ? places[0] : null;
  return (
    <div className="map-pop" style={style} role="dialog" aria-label={one ? one.name : 'Các địa điểm gần nhau'}>
      <button type="button" className="x" aria-label="Đóng" onClick={onClose}>
        <IconClose size={16} />
      </button>
      {one ? (
        <>
          <span className="kicker">{one.kind}</span>
          <Link href={hrefOf.place(one)}>{one.name}</Link>
          <span>
            {one.experiences.length
              ? `${one.experiences[0].title} · ${vnd(Math.min(...one.experiences.map((e) => e.price)))}`
              : 'Điểm tham quan tự do'}
          </span>
        </>
      ) : (
        <>
          <span className="kicker">{places.length} địa điểm gần nhau</span>
          <ul>
            {places.map((p) => (
              <li key={p.key}>
                <Link href={hrefOf.place(p)}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

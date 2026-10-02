'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CAT_LABEL, byRating, hrefOf, slugify } from '@/lib/catalog';
import { vnd, vndShort } from '@/lib/format';
import { useCatalog } from './CatalogProvider';
import { IconSearch } from './Icons';

/** Tìm trong toàn danh mục, không phân biệt dấu ("ha giang" khớp "Hà Giang"). */
export default function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const { countries } = useCatalog();

  useEffect(() => setQ(initial), [initial]);

  const needle = slugify(q);
  const hit = (...parts: string[]) => slugify(parts.join(' ')).includes(needle);
  const res = useMemo(() => {
    if (!needle) return null;
    const cities = countries.flatMap((c) => c.cities);
    return {
      countries: countries.filter((c) => hit(c.name, c.native)),
      cities: cities.filter((t) => hit(t.name, t.country.name, t.blurb)),
      places: cities.flatMap((t) => t.places).filter((p) => hit(p.name, p.kind, p.city.name)),
      experiences: cities
        .flatMap((t) => t.experiences)
        .filter((e) => hit(e.title, CAT_LABEL[e.cat], e.place.name, e.city.name, e.blurb))
        .sort(byRating),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, countries]);
  const total = res ? res.countries.length + res.cities.length + res.places.length + res.experiences.length : 0;

  return (
    <>
      <header className="cat-head" style={{ paddingTop: 24 }}>
        <div style={{ width: '100%' }}>
          <h1 className="title-m">Tìm kiếm</h1>
          <form
            role="search"
            className="finder"
            style={{ maxWidth: 640 }}
            onSubmit={(e) => {
              e.preventDefault();
              router.replace(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/tim-kiem');
            }}
          >
            <label className="grow">
              <span>Quốc gia, thành phố, địa điểm hay trải nghiệm</span>
              <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ví dụ: onsen, Hội An, bãi biển" />
            </label>
            <button type="submit" className="btn-p press">
              <IconSearch size={18} />
              Tìm
            </button>
          </form>
        </div>
      </header>

      {!res ? (
        <p className="note">Gõ tên một nơi hoặc loại trải nghiệm. Tìm không phân biệt dấu.</p>
      ) : total === 0 ? (
        <div className="empty">Không tìm thấy “{q}”. Thử tên thành phố hoặc một từ ngắn hơn.</div>
      ) : (
        <div className="sresults" aria-live="polite">
          <p className="note">{total} kết quả</p>
          {res.countries.length > 0 && (
            <section>
              <h2>Quốc gia</h2>
              {res.countries.map((c) => (
                <Link key={c.key} href={hrefOf.country(c)} className="srow">
                  <span>
                    <b>{c.name}</b>
                    <small>{c.cities.map((t) => t.name).join(' · ')}</small>
                  </span>
                  <b>từ {vndShort(c.from)}</b>
                </Link>
              ))}
            </section>
          )}
          {res.cities.length > 0 && (
            <section>
              <h2>Thành phố</h2>
              {res.cities.map((t) => (
                <Link key={t.key} href={hrefOf.city(t)} className="srow">
                  <span>
                    <b>{t.name}</b>
                    <small>
                      {t.country.name} · {t.blurb}
                    </small>
                  </span>
                  <b>từ {vndShort(t.from)}</b>
                </Link>
              ))}
            </section>
          )}
          {res.places.length > 0 && (
            <section>
              <h2>Địa điểm</h2>
              {res.places.map((p) => (
                <Link key={p.key} href={hrefOf.place(p)} className="srow">
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {p.kind} · {p.city.name}, {p.country.name}
                    </small>
                  </span>
                  <small>{p.experiences.length ? `${p.experiences.length} trải nghiệm` : 'Tự do'}</small>
                </Link>
              ))}
            </section>
          )}
          {res.experiences.length > 0 && (
            <section>
              <h2>Trải nghiệm</h2>
              {res.experiences.map((e) => (
                <Link key={e.key} href={hrefOf.experience(e)} className="srow">
                  <span>
                    <b>{e.title}</b>
                    <small>
                      {CAT_LABEL[e.cat]} · {e.place.name}, {e.city.name} · {e.duration}
                    </small>
                  </span>
                  <b>{vnd(e.price)}</b>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}

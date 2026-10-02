'use client';

import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { DEPARTURES, hrefOf, slugify } from '@/lib/catalog';
import { FLEXIBLE_DEPARTURE } from '@/lib/booking';
import { setDeparture, setGuests } from '@/lib/trip';
import { useCatalog } from './CatalogProvider';
import { IconSearch } from './Icons';
import { useTrip } from './TripProvider';

/**
 * Ô tìm ở trang chủ. Gõ đúng tên một quốc gia/thành phố/địa điểm thì đi thẳng tới
 * đó; không thì sang trang tìm kiếm. Ngày đi và số khách được ghi vào hành trình
 * để giỏ hàng và form đặt chỗ điền sẵn.
 */
export default function Finder() {
  const router = useRouter();
  const id = useId();
  const { countries } = useCatalog();
  const { trip, ready, update } = useTrip();
  const [q, setQ] = useState('');

  const index = useMemo(() => {
    const out: Array<{ name: string; href: string }> = [];
    for (const c of countries) {
      out.push({ name: c.name, href: hrefOf.country(c) });
      for (const t of c.cities) {
        out.push({ name: t.name, href: hrefOf.city(t) });
        for (const p of t.places) out.push({ name: p.name, href: hrefOf.place(p) });
      }
    }
    return out;
  }, [countries]);

  const guests = ready ? trip.adults : 2;
  const departure = ready ? trip.departure : DEPARTURES[0].date;

  return (
    <form
      className="finder enter d3"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const needle = slugify(q);
        if (!needle) return router.push('/tim-kiem');
        const exact = index.find((x) => slugify(x.name) === needle);
        router.push(exact ? exact.href : hrefOf.search(q.trim()));
      }}
    >
      <label className="grow">
        <span>Điểm đến</span>
        <input
          type="text"
          list={`${id}-dest`}
          placeholder="Hà Giang, Kyoto, Jeju…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <datalist id={`${id}-dest`}>
          {index.map((x) => (
            <option key={x.href} value={x.name} />
          ))}
        </datalist>
      </label>
      <div className="sep" />
      <label>
        <span>Khởi hành</span>
        <select value={departure} onChange={(e) => update((s) => setDeparture(s, e.target.value))}>
          {DEPARTURES.map((d) => (
            <option key={d.date} value={d.date}>
              {d.date} · {d.day}
            </option>
          ))}
          <option value={FLEXIBLE_DEPARTURE}>Linh hoạt</option>
        </select>
      </label>
      <div className="sep" />
      <label>
        <span>Số khách</span>
        <select value={guests} onChange={(e) => update((s) => setGuests(s, Number(e.target.value), s.children))}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} người lớn
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-p press">
        <IconSearch size={18} />
        Tìm
      </button>
    </form>
  );
}

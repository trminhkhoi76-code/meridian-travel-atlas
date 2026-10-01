import type { Metadata } from 'next';
import { FilterLinks, PageHead } from '@/components/admin/bits';
import { CATALOG_SORTS, PERIODS, catalogStats } from '@/lib/admin-stats';
import type { CatalogSort, PeriodDays } from '@/lib/admin-stats';
import { CAT_LABEL, hrefOf } from '@/lib/catalog';
import { getCountries, getExperienceIndex } from '@/lib/catalog-service';
import { listBookings } from '@/lib/booking-store';
import { num, pct, vnd } from '@/lib/format';

export const metadata: Metadata = { title: 'Danh mục' };

interface Props {
  searchParams: Promise<{ ky?: string; 'sap-xep'?: string }>;
}

export default async function CatalogPerformance({ searchParams }: Props) {
  const sp = await searchParams;
  const days = (PERIODS as readonly number[]).includes(Number(sp.ky)) ? (Number(sp.ky) as PeriodDays) : undefined;
  const sort: CatalogSort = sp['sap-xep'] && sp['sap-xep'] in CATALOG_SORTS ? (sp['sap-xep'] as CatalogSort) : 'gia-tri';
  const [records, byKey, countries] = await Promise.all([listBookings(), getExperienceIndex(), getCountries()]);
  const rows = catalogStats(records, countries, byKey, days, Date.now(), sort);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const idle = rows.filter((r) => r.requests === 0).length;

  const href = (k: PeriodDays | undefined, s: CatalogSort) => {
    const q = new URLSearchParams();
    if (k) q.set('ky', String(k));
    if (s !== 'gia-tri') q.set('sap-xep', s);
    const qs = q.toString();
    return '/admin/danh-muc' + (qs ? '?' + qs : '');
  };

  return (
    <>
      <PageHead
        title="Danh mục"
        sub={`${rows.length} trải nghiệm · ${idle} chưa có yêu cầu nào ${days ? `trong ${days} ngày` : 'từ trước tới nay'}. Giá và nội dung sửa trong seed.ts (chưa có CMS).`}
      />
      <div className="frows">
        <FilterLinks
          label="Kỳ"
          options={[
            ...PERIODS.map((p) => ({ href: href(p, sort), label: `${p} ngày`, on: p === days })),
            { href: href(undefined, sort), label: 'Tất cả', on: !days },
          ]}
        />
        <FilterLinks
          label="Sắp xếp"
          options={(Object.keys(CATALOG_SORTS) as CatalogSort[]).map((s) => ({
            href: href(days, s),
            label: CATALOG_SORTS[s],
            on: s === sort,
          }))}
        />
      </div>

      <section className="acard flush">
        <div className="ascroll">
          <table className="atable hl">
            <thead>
              <tr>
                <th>Trải nghiệm</th>
                <th>Phân loại</th>
                <th className="num">Giá / khách</th>
                <th className="num">Yêu cầu</th>
                <th className="num">Khách</th>
                <th className="wbar">Giá trị tạm tính</th>
                <th className="num">Tỉ lệ xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.exp.key} className={r.requests ? undefined : 'dim'}>
                  <td>
                    <a href={hrefOf.experience(r.exp)} target="_blank" rel="noreferrer">
                      {r.exp.title}
                    </a>
                    <small>
                      {r.exp.city.name}, {r.exp.country.name} · {r.exp.duration}
                    </small>
                  </td>
                  <td>{CAT_LABEL[r.exp.cat]}</td>
                  <td className="num">{vnd(r.exp.price)}</td>
                  <td className="num">{num(r.requests)}</td>
                  <td className="num">{num(r.guests)}</td>
                  <td className="wbar">
                    <span className="cellbar">
                      <span className="cb-track" aria-hidden="true">
                        <span style={{ width: `${(r.value / max) * 100}%` }} />
                      </span>
                      <b>{vnd(r.value)}</b>
                    </span>
                  </td>
                  <td className="num">{r.confirmRate === undefined ? '—' : pct(r.confirmRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

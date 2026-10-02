import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/admin/bits';
import StatusBadge from '@/components/admin/StatusBadge';
import AutoSubmit from '@/components/admin/AutoSubmit';
import { filterBookings, resolveLines } from '@/lib/admin-stats';
import { parseBookingFilter, filterQuery } from '@/lib/admin-filter';
import { DEPARTURES } from '@/lib/catalog';
import { getCountries, getExperienceIndex } from '@/lib/catalog-service';
import { listBookings } from '@/lib/booking-store';
import { BOOKING_STATUSES, FLEXIBLE_DEPARTURE, STATUS_LABEL, departureLabel, isOverdue } from '@/lib/booking';
import { num, vnDateTime, vnd } from '@/lib/format';

export const metadata: Metadata = { title: 'Yêu cầu đặt chỗ' };

const PAGE_SIZE = 25;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingList({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = parseBookingFilter(sp);
  const page = Math.max(1, Number(sp.trang) || 1);
  const now = Date.now();
  const [records, byKey, countries] = await Promise.all([listBookings(), getExperienceIndex(), getCountries()]);

  const rows = filterBookings(records, byKey, filter, now);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const query = filterQuery(filter);
  const pageHref = (p: number) => `/admin/yeu-cau?${filterQuery(filter, { trang: String(p) })}`;

  return (
    <>
      <PageHead title="Yêu cầu đặt chỗ" sub={`${num(rows.length)} yêu cầu khớp bộ lọc · mới nhất trước`}>
        <a className="pill sm" href={`/admin/yeu-cau/csv?${query}`} download>
          Xuất CSV
        </a>
      </PageHead>

      {/* GET thuần: không cần JS vẫn lọc được; AutoSubmit chỉ để đổi select là lọc luôn. */}
      <form className="ffilters" method="get" action="/admin/yeu-cau">
        <AutoSubmit />
        <label>
          <span className="kicker">Tìm</span>
          <input type="search" name="q" defaultValue={filter.q} placeholder="Mã, tên, email, SĐT" />
        </label>
        <label>
          <span className="kicker">Trạng thái</span>
          <select name="trang-thai" defaultValue={filter.status ?? ''}>
            <option value="">Tất cả</option>
            <option value="OVERDUE">Quá hạn 24 giờ</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="kicker">Điểm đến</span>
          <select name="nuoc" defaultValue={filter.country ?? ''}>
            <option value="">Tất cả</option>
            {countries.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="kicker">Khởi hành</span>
          <select name="khoi-hanh" defaultValue={filter.departure ?? ''}>
            <option value="">Tất cả</option>
            {DEPARTURES.map((d) => (
              <option key={d.date} value={d.date}>
                {d.date}
              </option>
            ))}
            <option value={FLEXIBLE_DEPARTURE}>Linh hoạt</option>
          </select>
        </label>
        <button type="submit" className="btn-p btn-sm">
          Lọc
        </button>
        {query && (
          <Link href="/admin/yeu-cau" className="pill sm">
            Bỏ lọc
          </Link>
        )}
      </form>

      <section className="acard flush">
        {shown.length === 0 ? (
          <p className="aempty">Không có yêu cầu nào khớp bộ lọc.</p>
        ) : (
          <div className="ascroll">
            <table className="atable hl">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Nhận lúc</th>
                  <th>Khách hàng</th>
                  <th>Hành trình</th>
                  <th>Khởi hành</th>
                  <th className="num">Khách</th>
                  <th className="num">Tạm tính</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const lines = resolveLines(r, byKey);
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/yeu-cau/${r.id}`} className="mono-id">
                          {r.id}
                        </Link>
                        {!r.notified && <small className="warn">Chưa báo mail</small>}
                      </td>
                      <td className="nowrap">{vnDateTime(r.receivedAt)}</td>
                      <td>
                        <Link href={`/admin/yeu-cau/${r.id}`}>{r.name}</Link>
                        <small>{r.email}</small>
                      </td>
                      <td>
                        {lines[0]?.exp.title ?? '—'}
                        <small>
                          {lines[0] ? lines[0].exp.country.name : ''}
                          {lines.length > 1 ? ` · +${lines.length - 1} dòng` : ''}
                        </small>
                      </td>
                      <td className="nowrap">{departureLabel(r.departure)}</td>
                      <td className="num">{r.guests}</td>
                      <td className="num">{vnd(r.estimate)}</td>
                      <td>
                        <StatusBadge status={r.status} overdue={isOverdue(r, now)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 && (
        <nav className="pager" aria-label="Phân trang">
          {page > 1 ? <Link href={pageHref(page - 1)}>← Trước</Link> : <span />}
          <span className="kicker">
            Trang {page} / {pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)}>Sau →</Link> : <span />}
        </nav>
      )}
    </>
  );
}

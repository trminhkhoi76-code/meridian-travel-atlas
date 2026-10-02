import type { Metadata } from 'next';
import Link from 'next/link';
import { FilterLinks, PageHead } from '@/components/admin/bits';
import { ChartCard } from '@/components/admin/charts';
import Gantt from '@/components/admin/Gantt';
import StatusBadge from '@/components/admin/StatusBadge';
import { schedule } from '@/lib/admin-stats';
import { getCountries, getExperienceIndex } from '@/lib/catalog-service';
import { listBookings } from '@/lib/booking-store';
import { isOverdue } from '@/lib/booking';
import { num, vnDateShort, vnDateTime, vnDayStart } from '@/lib/format';

export const metadata: Metadata = { title: 'Lịch khởi hành' };

const DAY = 24 * 3600_000;

interface Props {
  searchParams: Promise<{ nuoc?: string }>;
}

export default async function DepartureSchedule({ searchParams }: Props) {
  const nuoc = (await searchParams).nuoc;
  const now = Date.now();
  const [records, byKey, countries] = await Promise.all([listBookings(), getExperienceIndex(), getCountries()]);
  const country = countries.find((c) => c.slug === nuoc);
  const s = schedule(records, byKey, countries, now, country?.slug);

  const tableRows = s.groups.flatMap((g) =>
    g.rows.flatMap((row) =>
      row.bars.map((bar) => ({ g, row, bar })),
    ),
  );

  return (
    <>
      <PageHead
        title="Lịch khởi hành"
        sub={`${num(s.totals.departures)} đợt có khách · ${num(s.totals.guests)} khách, ${num(s.totals.confirmedGuests)} đã xác nhận · không gồm yêu cầu đã huỷ`}
      >
        <FilterLinks
          label="Điểm đến"
          options={[
            { href: '/admin/lich', label: 'Tất cả', on: !country },
            ...countries.map((c) => ({ href: `/admin/lich?nuoc=${c.slug}`, label: c.name, on: c.slug === country?.slug })),
          ]}
        />
      </PageHead>

      <ChartCard
        title="Theo trải nghiệm"
        sub="Mỗi thanh là một đợt khởi hành, dài đúng số ngày của trải nghiệm; nhãn là tổng số khách."
        table={
          <table className="atable">
            <thead>
              <tr>
                <th>Trải nghiệm</th>
                <th>Đi</th>
                <th>Về</th>
                <th className="num">Khách</th>
                <th className="num">Đã xác nhận</th>
                <th className="num">Yêu cầu</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ g, row, bar }) => (
                <tr key={bar.key}>
                  <td>
                    {row.title}
                    <small>
                      {row.place}, {g.label}
                    </small>
                  </td>
                  <td>{vnDateShort(vnDayStart(bar.start))}</td>
                  <td>{vnDateShort(vnDayStart(bar.start) + (bar.days - 1) * DAY)}</td>
                  <td className="num">{bar.guests}</td>
                  <td className="num">{bar.confirmedGuests}</td>
                  <td className="num">{bar.bookings.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <Gantt data={s} />
      </ChartCard>

      <section className="acard">
        <header className="acard-head">
          <div>
            <h2>Chưa chốt ngày · {s.flexible.length}</h2>
            <p>Khách chọn &ldquo;Linh hoạt&rdquo; — cần tư vấn ngày trước khi xếp lịch</p>
          </div>
          <Link href="/admin/yeu-cau?khoi-hanh=linh-hoat" className="pill sm">
            Mở trong danh sách
          </Link>
        </header>
        {s.flexible.length === 0 ? (
          <p className="aempty">Không có yêu cầu nào đang chờ chốt ngày.</p>
        ) : (
          <table className="atable">
            <tbody>
              {s.flexible.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/yeu-cau/${r.id}`}>{r.name}</Link>
                    <small>
                      {r.id} · nhận {vnDateTime(r.receivedAt)}
                    </small>
                  </td>
                  <td className="num">{r.guests} khách</td>
                  <td>
                    <StatusBadge status={r.status} overdue={isOverdue(r, now)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

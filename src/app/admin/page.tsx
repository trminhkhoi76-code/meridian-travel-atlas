import type { Metadata } from 'next';
import Link from 'next/link';
import { BarList, ChartCard, ColumnChart } from '@/components/admin/charts';
import { FilterLinks, PageHead, StatTile } from '@/components/admin/bits';
import { PERIODS, dashboard, parsePeriod } from '@/lib/admin-stats';
import { hrefOf } from '@/lib/catalog';
import { getCountries, getExperienceIndex } from '@/lib/catalog-service';
import { listBookings } from '@/lib/booking-store';
import { SLA_HOURS } from '@/lib/booking';
import { hoursLabel, num, pct, vnDateTime, vnd } from '@/lib/format';

export const metadata: Metadata = { title: 'Tổng quan' };

interface Props {
  searchParams: Promise<{ ky?: string }>;
}

/** Bậc của phễu — một sắc độ, nhạt tới đậm (đã kiểm bằng bộ kiểm màu, chế độ ordinal). */
const FUNNEL_TONES = ['var(--viz-ord-1)', 'var(--viz-ord-2)', 'var(--viz-ord-3)'];

export default async function AdminDashboard({ searchParams }: Props) {
  const days = parsePeriod((await searchParams).ky);
  const now = Date.now();
  const [records, byKey, countries] = await Promise.all([listBookings(), getExperienceIndex(), getCountries()]);
  const d = dashboard(records, byKey, countries, days, now);
  const period = `${days} ngày`;

  const table = (rows: Array<{ key: string; label: string; value: number }>, head: string, money = false) => (
    <table className="atable">
      <thead>
        <tr>
          <th>{head}</th>
          <th className="num">{money ? 'Giá trị' : 'Số lượng'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.label}</td>
            <td className="num">{money ? vnd(r.value) : num(r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const received = d.funnel[0].value;

  return (
    <>
      <PageHead title="Tổng quan" sub={`Số liệu ${period} gần nhất, tính theo ngày nhận yêu cầu (giờ VN).`}>
        <FilterLinks
          label="Kỳ"
          options={PERIODS.map((p) => ({ href: `/admin?ky=${p}`, label: `${p} ngày`, on: p === days }))}
        />
      </PageHead>

      {(d.overdue.length > 0 || d.unnotified > 0) && (
        <div className="alert" role="status">
          <i aria-hidden="true">!</i>
          <div>
            {d.overdue.length > 0 && (
              <p>
                <b>{d.overdue.length} yêu cầu</b> đã quá {SLA_HOURS} giờ mà chưa ai liên hệ.{' '}
                <Link href="/admin/yeu-cau?trang-thai=OVERDUE">Xử lý ngay →</Link>
              </p>
            )}
            {d.unnotified > 0 && (
              <p>
                <b>{d.unnotified} yêu cầu</b> chưa gửi được mail báo admin — kiểm tra trong danh sách.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="kpis">
        <StatTile label="Yêu cầu mới" metric={d.kpi.requests} kind="count" period={period} />
        <StatTile
          label="Giá trị tạm tính"
          metric={d.kpi.value}
          kind="vnd"
          period={period}
          note="Không tính yêu cầu đã huỷ"
        />
        <StatTile
          label="Tỉ lệ xác nhận"
          metric={d.kpi.confirmRate}
          kind="rate"
          period={period}
          note="Trên số yêu cầu đã chốt (xác nhận hoặc huỷ)"
        />
        <StatTile
          label={`Phản hồi trong ${SLA_HOURS} giờ`}
          metric={d.kpi.withinSla}
          kind="rate"
          period={period}
          note={d.medianResponseHours !== undefined ? `Trung vị ${hoursLabel(d.medianResponseHours)}` : undefined}
        />
      </div>

      <ChartCard
        title="Yêu cầu mỗi ngày"
        sub={`${num(received)} yêu cầu trong ${period}`}
        table={table(
          [...d.daily].reverse().map((x) => ({ key: x.key, label: `${x.label} · ${x.sub}`, value: x.value })),
          'Ngày',
        )}
      >
        <ColumnChart data={d.daily} unit="yêu cầu" height={210} />
      </ChartCard>

      <div className="agrid3">
        <ChartCard
          title="Phễu xử lý"
          sub={`${num(d.cancelled)} yêu cầu đã huỷ trong kỳ`}
          table={table(d.funnel, 'Bước')}
        >
          <BarList
            data={d.funnel.map((f) => ({
              ...f,
              sub: received ? `${pct(f.value / received)} số tiếp nhận` : undefined,
            }))}
            tones={FUNNEL_TONES}
            unit="yêu cầu"
          />
        </ChartCard>
        <ChartCard title="Giá trị theo điểm đến" sub="Tạm tính, không gồm yêu cầu đã huỷ" table={table(d.byCountry, 'Quốc gia', true)}>
          <BarList data={d.byCountry} format="vnd" />
        </ChartCard>
        <ChartCard title="Lượt đặt theo phân loại" sub="Mỗi dòng trong hành trình là một lượt" table={table(d.byCat, 'Phân loại')}>
          <BarList data={d.byCat} unit="lượt" />
        </ChartCard>
      </div>

      <div className="agrid2">
        <section className="acard">
          <header className="acard-head">
            <div>
              <h2>Trải nghiệm dẫn đầu</h2>
              <p>Theo giá trị tạm tính trong kỳ</p>
            </div>
            <Link href={`/admin/danh-muc?ky=${days}`} className="chip">
              Cả danh mục
            </Link>
          </header>
          <table className="atable">
            <thead>
              <tr>
                <th>Trải nghiệm</th>
                <th className="num">Lượt</th>
                <th className="num">Khách</th>
                <th className="num">Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {d.top.map((x) => (
                <tr key={x.exp.key}>
                  <td>
                    <a href={hrefOf.experience(x.exp)} target="_blank" rel="noreferrer">
                      {x.exp.title}
                    </a>
                    <small>
                      {x.exp.city.name}, {x.exp.country.name}
                    </small>
                  </td>
                  <td className="num">{num(x.requests)}</td>
                  <td className="num">{num(x.guests)}</td>
                  <td className="num">{vnd(x.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="acard">
          <header className="acard-head">
            <div>
              <h2>Cần liên hệ</h2>
              <p>Quá {SLA_HOURS} giờ chưa phản hồi, cũ nhất trước</p>
            </div>
            <Link href="/admin/yeu-cau?trang-thai=OVERDUE" className="chip">
              Tất cả
            </Link>
          </header>
          {d.overdue.length === 0 ? (
            <p className="aempty">Không có yêu cầu nào quá hạn.</p>
          ) : (
            <table className="atable">
              <tbody>
                {d.overdue.slice(0, 6).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/yeu-cau/${r.id}`}>{r.name}</Link>
                      <small>
                        {r.id} · nhận {vnDateTime(r.receivedAt)}
                      </small>
                    </td>
                    <td className="num">{hoursLabel((now - Date.parse(r.receivedAt)) / 3600_000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

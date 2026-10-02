import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingActions from '@/components/admin/BookingActions';
import StatusBadge from '@/components/admin/StatusBadge';
import { resolveLines } from '@/lib/admin-stats';
import { CAT_LABEL, hrefOf } from '@/lib/catalog';
import { getExperienceIndex } from '@/lib/catalog-service';
import { getBooking } from '@/lib/booking-store';
import { SLA_HOURS, STATUS_LABEL, departureLabel, firstResponseHours, isOverdue } from '@/lib/booking';
import { hoursLabel, vnDateTime, vnd } from '@/lib/format';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id };
}

export default async function BookingDetail({ params }: Props) {
  const { id } = await params;
  const [record, byKey] = await Promise.all([getBooking(id), getExperienceIndex()]);
  if (!record) notFound();

  const now = Date.now();
  const lines = resolveLines(record, byKey);
  const response = firstResponseHours(record);
  const overdue = isOverdue(record, now);

  return (
    <>
      <Link href="/admin/yeu-cau" className="back">
        ← Danh sách yêu cầu
      </Link>
      <header className="ahead">
        <div>
          <h1 className="mono-id big">{record.id}</h1>
          <p>
            Nhận {vnDateTime(record.receivedAt)} ·{' '}
            {response !== undefined
              ? `phản hồi sau ${hoursLabel(response)}${response > SLA_HOURS ? ' (quá hạn)' : ''}`
              : `chưa phản hồi · đã ${hoursLabel((now - Date.parse(record.receivedAt)) / 3600_000)}`}
            {record.source === 'seed' && ' · dữ liệu mẫu'}
          </p>
        </div>
        <StatusBadge status={record.status} overdue={overdue} />
      </header>

      {!record.notified && (
        <div className="alert" role="status">
          <i aria-hidden="true">!</i>
          <p>Mail báo admin cho yêu cầu này chưa gửi được — yêu cầu vẫn được lưu đầy đủ.</p>
        </div>
      )}

      <div className="agrid-detail">
        <div>
          <section className="acard">
            <header className="acard-head">
              <h2>Khách hàng</h2>
            </header>
            <dl className="adl">
              <div>
                <dt className="kicker">Họ tên</dt>
                <dd>{record.name}</dd>
              </div>
              <div>
                <dt className="kicker">Email</dt>
                <dd>
                  <a href={`mailto:${record.email}?subject=${encodeURIComponent(`Meridian Travel · ${record.id}`)}`}>
                    {record.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="kicker">Điện thoại</dt>
                <dd>
                  <a href={`tel:${record.phone}`}>{record.phone}</a>
                </dd>
              </div>
              <div>
                <dt className="kicker">Số khách</dt>
                <dd>
                  {record.adults} người lớn{record.children ? `, ${record.children} trẻ em` : ''}
                </dd>
              </div>
              <div>
                <dt className="kicker">Khởi hành</dt>
                <dd>{departureLabel(record.departure)}</dd>
              </div>
              <div className="wide">
                <dt className="kicker">Ghi chú của khách</dt>
                <dd className="pre">{record.note || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="acard">
            <header className="acard-head">
              <h2>Hành trình · {lines.length} dòng</h2>
            </header>
            <table className="atable">
              <thead>
                <tr>
                  <th>Trải nghiệm</th>
                  <th className="num">Giá / khách</th>
                  <th className="num">× {record.guests} khách</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.exp.key}>
                    <td>
                      <a href={hrefOf.experience(l.exp)} target="_blank" rel="noreferrer">
                        {l.exp.title}
                      </a>
                      <small>
                        {CAT_LABEL[l.exp.cat]} · {l.exp.city.name}, {l.exp.country.name} · {l.exp.duration}
                      </small>
                    </td>
                    <td className="num">{vnd(l.price)}</td>
                    <td className="num">{vnd(l.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Tạm tính</td>
                  <td className="num">
                    <b>{vnd(record.estimate)}</b>
                  </td>
                </tr>
              </tfoot>
            </table>
            {lines.some((l) => l.price !== l.exp.price) && (
              <p className="anote">Giá theo lúc nhận yêu cầu; một số dòng đã đổi giá trong danh mục.</p>
            )}
          </section>
        </div>

        <div>
          <section className="acard">
            <header className="acard-head">
              <h2>Xử lý</h2>
            </header>
            <BookingActions id={record.id} status={record.status} />
          </section>

          <section className="acard">
            <header className="acard-head">
              <h2>Lịch sử</h2>
            </header>
            <ol className="timeline">
              {record.history
                .map((e, i) => ({
                  e,
                  i,
                  label:
                    i === 0
                      ? 'Nhận yêu cầu'
                      : e.status === record.history[i - 1].status
                        ? 'Ghi chú'
                        : `→ ${STATUS_LABEL[e.status]}`,
                }))
                .reverse()
                .map(({ e, i, label }) => (
                  <li key={i}>
                    <span className="kicker">{vnDateTime(e.at)}</span>
                    <b>{label}</b>
                    {e.note && <p>{e.note}</p>}
                  </li>
                ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

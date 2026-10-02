import Link from 'next/link';
import type { Metric } from '@/lib/admin-stats';
import { num, pct, vndCompact } from '@/lib/format';

/** Các mảnh dùng chung của trang admin — thuần hiển thị, render phía server. */

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="ahead">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </header>
  );
}

/** Hàng bộ lọc dạng liên kết — trạng thái lọc nằm trên URL, như phần còn lại của site. */
export function FilterLinks({
  label,
  options,
}: {
  label: string;
  options: Array<{ href: string; label: string; on: boolean }>;
}) {
  return (
    <div className="frow" role="group" aria-label={label}>
      <span className="kicker">{label}</span>
      {options.map((o) => (
        <Link key={o.href} href={o.href} className="pill sm" aria-current={o.on ? 'true' : undefined}>
          {o.label}
        </Link>
      ))}
    </div>
  );
}

type Kind = 'count' | 'vnd' | 'rate';

function fmt(v: number, kind: Kind) {
  return kind === 'vnd' ? vndCompact(v) : kind === 'rate' ? pct(v) : num(v);
}

/** Chênh lệch so với kỳ trước: phần trăm cho số đếm/tiền, điểm phần trăm cho tỉ lệ. */
function delta(m: Metric, kind: Kind) {
  if (m.cur === undefined || m.prev === undefined) return null;
  if (kind === 'rate') {
    const d = (m.cur - m.prev) * 100;
    return { up: d > 0.05, down: d < -0.05, text: `${d > 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')} điểm` };
  }
  if (m.prev === 0) return null;
  const d = (m.cur - m.prev) / m.prev;
  return { up: d > 0.0005, down: d < -0.0005, text: `${d > 0 ? '+' : ''}${pct(d)}` };
}

export function StatTile({
  label,
  metric,
  kind,
  period,
  note,
}: {
  label: string;
  metric: Metric;
  kind: Kind;
  period: string;
  note?: string;
}) {
  const d = delta(metric, kind);
  return (
    <div className="stile">
      <span className="stile-lab">{label}</span>
      <b className="stile-val">{metric.cur === undefined ? '—' : fmt(metric.cur, kind)}</b>
      <span className="stile-delta">
        {d ? (
          <>
            {/* Ở cả bốn chỉ số, tăng là tốt — mũi tên mang hướng, màu chỉ nhấn thêm. */}
            <i className={d.up ? 'good' : d.down ? 'bad' : ''} aria-hidden="true">
              {d.up ? '▲' : d.down ? '▼' : '–'}
            </i>
            {d.text} so với {period} trước
          </>
        ) : (
          <>Chưa đủ dữ liệu kỳ trước</>
        )}
      </span>
      {note && <span className="stile-note">{note}</span>}
    </div>
  );
}

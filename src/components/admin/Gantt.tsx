'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GanttBar, GanttRow, Schedule } from '@/lib/admin-stats';
import { CAT_LABEL } from '@/lib/catalog';
import { STATUS_LABEL } from '@/lib/booking';
import { vnDateShort, vnDayKey, vnDayStart, vnWeekday } from '@/lib/format';

const DAY = 24 * 3600_000;
/** Độ rộng một ngày: co giãn để cả trục vừa khung, nhưng không hẹp quá mức đọc được. */
const DAY_MIN = 18;
const DAY_MAX = 34;

interface Picked {
  row: GanttRow;
  bar: GanttBar;
}

const endLabel = (bar: GanttBar) => vnDateShort(vnDayStart(bar.start) + (bar.days - 1) * DAY);

/**
 * Lịch khởi hành dạng Gantt: mỗi hàng một trải nghiệm, mỗi thanh một đợt khởi
 * hành kéo dài đúng số ngày của trải nghiệm. Dựng bằng CSS grid (không SVG) để
 * cột nhãn dính trái khi cuộn ngang trên màn hẹp.
 */
export default function Gantt({ data }: { data: Schedule }) {
  const [hover, setHover] = useState<Picked | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);

  const days = useMemo(() => {
    const out: string[] = [];
    for (let t = vnDayStart(data.start); t <= vnDayStart(data.end); t += DAY) out.push(vnDayKey(t));
    return out;
  }, [data.start, data.end]);

  // Giá trị đầu cố định để HTML server và lần render đầu phía client khớp nhau.
  const [dayW, setDayW] = useState(26);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fit = () => {
      const label = cornerRef.current?.offsetWidth ?? 0;
      const w = Math.floor((el.clientWidth - label - 1) / days.length);
      setDayW(Math.min(DAY_MAX, Math.max(DAY_MIN, w)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [days.length]);

  // Hàng tháng: gom các ngày liền nhau cùng tháng thành một ô.
  const months = useMemo(() => {
    const out: Array<{ key: string; label: string; count: number }> = [];
    for (const k of days) {
      const m = k.slice(0, 7);
      const last = out[out.length - 1];
      if (last?.key === m) last.count++;
      else out.push({ key: m, label: `Tháng ${Number(k.slice(5, 7))}`, count: 1 });
    }
    return out;
  }, [days]);

  const offset = (key: string) => Math.round((vnDayStart(key) - vnDayStart(data.start)) / DAY);
  const todayIdx = days.indexOf(data.today);
  const timelineW = days.length * dayW;

  if (!data.groups.length) {
    return <p className="aempty">Chưa có đợt khởi hành nào có khách trong bộ lọc này.</p>;
  }

  const show = hover ?? picked;

  return (
    <>
      <div className="gantt" style={{ ['--day-w' as string]: `${dayW}px` }}>
        <div className="g-scroll" ref={scrollRef}>
          <div className="g-grid" style={{ gridTemplateColumns: `var(--g-label) ${timelineW}px` }}>
            <div className="g-corner kicker" ref={cornerRef}>
              Trải nghiệm
            </div>
            <div className="g-head">
              <div className="g-months">
                {months.map((m) => (
                  <span key={m.key} style={{ width: m.count * dayW }}>
                    {m.count * dayW >= 56 ? m.label : ''}
                  </span>
                ))}
              </div>
              <div className="g-days">
              {days.map((k, i) => {
                const dow = vnWeekday(vnDayStart(k));
                return (
                  <div
                    key={k}
                    className={
                      'g-day' +
                      (dow === 'T7' || dow === 'CN' ? ' we' : '') +
                      (i === todayIdx ? ' today' : '')
                    }
                  >
                    <small>{dow}</small>
                    <b>{Number(k.slice(8))}</b>
                  </div>
                );
              })}
              </div>
            </div>

            {data.groups.map((g) => (
              <div key={g.key} className="g-group">
                <div className="g-ghead">
                  <span>{g.label}</span>
                  <small>
                    {g.rows.length} trải nghiệm · {g.rows.reduce((s, r) => s + r.bars.reduce((a, b) => a + b.guests, 0), 0)}{' '}
                    khách
                  </small>
                </div>
                <div className="g-gfill" aria-hidden="true" />
                {g.rows.map((row) => (
                  <div key={row.key} className="g-row">
                    <div className="g-label">
                      <b>{row.title}</b>
                      <small>
                        {CAT_LABEL[row.cat]} · {row.place} · {row.duration}
                      </small>
                    </div>
                    <div className="g-track">
                      {days.map((k, i) => {
                        const dow = vnWeekday(vnDayStart(k));
                        return dow === 'T7' || dow === 'CN' ? (
                          <span key={k} className="g-we" style={{ left: i * dayW }} aria-hidden="true" />
                        ) : null;
                      })}
                      {todayIdx >= 0 && <span className="g-now" style={{ left: todayIdx * dayW + dayW / 2 }} aria-hidden="true" />}
                      {row.bars.map((bar) => {
                        const w = bar.days * dayW - 4;
                        const isPicked = picked?.bar.key === bar.key;
                        return (
                          <button
                            key={bar.key}
                            type="button"
                            className={'g-bar' + (isPicked ? ' picked' : '')}
                            style={{ left: offset(bar.start) * dayW + 2, width: w }}
                            aria-pressed={isPicked}
                            aria-label={`${row.title}, khởi hành ${vnDateShort(vnDayStart(bar.start))}, về ${endLabel(bar)}: ${bar.guests} khách, ${bar.confirmedGuests} đã xác nhận`}
                            onPointerEnter={() => setHover({ row, bar })}
                            onPointerLeave={() => setHover(null)}
                            onFocus={() => setHover({ row, bar })}
                            onBlur={() => setHover(null)}
                            onClick={() => setPicked(isPicked ? null : { row, bar })}
                          >
                            {/* Nhãn luôn ở ngoài đầu thanh: chữ trên nền màu dữ liệu không đạt 4.5:1 ở cả hai theme. */}
                            <span>{bar.guests} khách</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g-detail" aria-live="polite">
        {show ? (
          <>
            <p className="g-dhead">
              <b>
                {show.bar.guests} khách · {show.bar.confirmedGuests} đã xác nhận
              </b>
              <span>
                {show.row.title} · {vnDateShort(vnDayStart(show.bar.start))} → {endLabel(show.bar)} ·{' '}
                {show.bar.bookings.length} yêu cầu
              </span>
            </p>
            {picked && picked === show && (
              <ul className="g-blist">
                {picked.bar.bookings.map((b) => (
                  <li key={b.id}>
                    <Link href={`/admin/yeu-cau/${b.id}`} className="mono-id">
                      {b.id}
                    </Link>
                    <span>{b.name}</span>
                    <span>{b.guests} khách</span>
                    <span className="muted">{STATUS_LABEL[b.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="muted">Trỏ vào một thanh để xem chi tiết; bấm để liệt kê các yêu cầu.</p>
        )}
      </div>
    </>
  );
}

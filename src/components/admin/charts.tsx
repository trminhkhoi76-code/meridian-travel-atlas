'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { num, pct, vnd, vndCompact } from '@/lib/format';

/**
 * Biểu đồ của trang quản trị — viết tay, không thư viện. Màu lấy từ token
 * `--viz-*` trong globals.css (đã chạy bộ kiểm màu cho cả nền sáng lẫn tối);
 * chữ luôn dùng màu mực (`--ink*`), không bao giờ dùng màu của dữ liệu.
 *
 * Mọi biểu đồ nằm trong ChartCard, có nút chuyển sang bảng số: tooltip chỉ để
 * đọc nhanh, không phải cách duy nhất để thấy một con số.
 */

export type ValueFormat = 'count' | 'vnd';

const short = (v: number, f: ValueFormat) => (f === 'vnd' ? vndCompact(v) : num(v));
const full = (v: number, f: ValueFormat) => (f === 'vnd' ? vnd(v) : num(v));

export interface Datum {
  key: string;
  label: string;
  value: number;
  sub?: string;
}

/* ---------------------------------- khung ---------------------------------- */

export function ChartCard({
  title,
  sub,
  table,
  children,
  className,
}: {
  title: string;
  sub?: string;
  table: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={'acard' + (className ? ' ' + className : '')}>
      <header className="acard-head">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        <button
          type="button"
          className="pill sm"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? 'Biểu đồ' : 'Bảng'}
        </button>
      </header>
      {asTable ? <div className="acard-table">{table}</div> : children}
    </section>
  );
}

interface Tip {
  x: number;
  y: number;
  value: string;
  label: string;
}

/** Giá trị đứng trước, nhãn đứng sau — người đọc đã biết mình đang trỏ vào đâu. */
function Tooltip({ tip, width }: { tip: Tip | null; width: number }) {
  if (!tip) return null;
  const x = Math.min(Math.max(tip.x, 70), Math.max(70, width - 70));
  return (
    <div className="vtip" style={{ left: x, top: tip.y }} role="status">
      <b>{tip.value}</b>
      <span>{tip.label}</span>
    </div>
  );
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Vạch chia tròn: 0 / 5 / 10 / 15 — tối đa ~4 vạch. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/* ------------------------------- biểu đồ cột ------------------------------- */

export function ColumnChart({
  data,
  format = 'count',
  height = 200,
  unit,
}: {
  data: Datum[];
  format?: ValueFormat;
  height?: number;
  /** Đơn vị cho tooltip, ví dụ "yêu cầu". */
  unit?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const [active, setActive] = useState<number | null>(null);

  const m = { top: 20, right: 6, bottom: 24, left: 34 };
  const plotW = Math.max(40, width - m.left - m.right);
  const plotH = height - m.top - m.bottom;
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1];
  const band = plotW / Math.max(1, data.length);
  const barW = Math.max(1, Math.min(24, band - 2));
  const y = (v: number) => m.top + plotH - (v / top) * plotH;
  const cx = (i: number) => m.left + i * band + band / 2;
  const every = Math.ceil(44 / band);
  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  const column = (i: number, v: number) => {
    const h = plotH - (y(v) - m.top);
    if (h <= 0) return null;
    const x = cx(i) - barW / 2;
    const r = Math.min(4, barW / 2, h);
    const y0 = y(v);
    return `M${x},${y0 + h}V${y0 + r}Q${x},${y0} ${x + r},${y0}H${x + barW - r}Q${x + barW},${y0} ${x + barW},${y0 + r}V${y0 + h}Z`;
  };

  const d = active === null ? null : data[active];
  const tip: Tip | null = d
    ? {
        x: cx(active!),
        y: y(d.value) - 8,
        value: `${full(d.value, format)}${unit ? ' ' + unit : ''}`,
        label: d.sub ? `${d.label} · ${d.sub}` : d.label,
      }
    : null;

  return (
    <div className="vchart" ref={ref}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Biểu đồ cột, ${data.length} mốc. Dùng phím mũi tên để đọc từng cột.`}
        tabIndex={0}
        onFocus={() => setActive((a) => a ?? data.length - 1)}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          setActive((a) => {
            const cur = a ?? data.length - 1;
            return Math.min(data.length - 1, Math.max(0, cur + (e.key === 'ArrowLeft' ? -1 : 1)));
          });
        }}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="vgrid" x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} />
            <text className="vaxis" x={m.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
              {short(v, format)}
            </text>
          </g>
        ))}
        {data.map((dt, i) => {
          const path = column(i, dt.value);
          return path ? (
            <path key={dt.key} d={path} className={'vcol' + (active === i ? ' on' : '')} />
          ) : null;
        })}
        {data.map((dt, i) =>
          (data.length - 1 - i) % every === 0 ? (
            <text key={dt.key} className="vaxis" x={cx(i)} y={height - 6} textAnchor="middle">
              {dt.label}
            </text>
          ) : null,
        )}
        {data[maxIdx]?.value > 0 && (
          <text className="vlabel" x={cx(maxIdx)} y={y(data[maxIdx].value) - 6} textAnchor="middle">
            {short(data[maxIdx].value, format)}
          </text>
        )}
        {/* Vùng bắt chuột phủ cả dải của mỗi cột, không chỉ phần đã tô. */}
        {data.map((dt, i) => (
          <rect
            key={dt.key}
            x={m.left + i * band}
            y={m.top}
            width={band}
            height={plotH}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
          />
        ))}
      </svg>
      <Tooltip tip={tip} width={width} />
    </div>
  );
}

/* ------------------------------ thanh ngang -------------------------------- */

export function BarList({
  data,
  format = 'count',
  tones,
  unit,
  share = true,
}: {
  data: Datum[];
  format?: ValueFormat;
  /** Màu từng hàng (ví dụ bậc của phễu). Bỏ trống: mọi hàng cùng một màu. */
  tones?: string[];
  unit?: string;
  /** Hiện tỉ trọng trên tổng trong tooltip. */
  share?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ul className="blist" onPointerLeave={() => setActive(null)}>
      {data.map((d, i) => (
        <li
          key={d.key}
          tabIndex={0}
          className={active === i ? 'on' : undefined}
          onPointerEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          aria-label={`${d.label}: ${full(d.value, format)}${unit ? ' ' + unit : ''}`}
        >
          <span className="bl-lab">{d.label}</span>
          <span className="bl-track">
            <span
              className="bl-bar"
              style={{
                width: `calc((100% - 64px) * ${d.value / max})`,
                background: tones?.[i] ?? 'var(--viz-1)',
              }}
            />
            <span className="bl-val">{short(d.value, format)}</span>
          </span>
          {active === i && (
            <span className="vtip inline" role="status">
              <b>
                {full(d.value, format)}
                {unit ? ' ' + unit : ''}
              </b>
              <span>{d.sub ?? (share && total ? `${pct(d.value / total)} tổng` : d.label)}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

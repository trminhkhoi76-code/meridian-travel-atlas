/**
 * Số liệu cho trang quản trị — hàm thuần trên danh sách BookingRecord + danh
 * mục. Không đọc kho, không đọc đồng hồ: trang truyền `now` vào, nên cùng dữ
 * liệu luôn ra cùng số (dễ kiểm tra, và khi có backend thì phần này có thể
 * chuyển thẳng thành truy vấn SQL/aggregate).
 */

import type { Cat, Country, Experience } from './catalog';
import { CAT_LABEL, DEPARTURES, slugify } from './catalog';
import type { BookingRecord, BookingStatus } from './booking';
import { FLEXIBLE_DEPARTURE, SLA_HOURS, firstResponseHours, isOverdue } from './booking';
import { vnDateShort, vnDayKey, vnDayStart, vnWeekday } from './format';

const DAY = 24 * 3600_000;

/* --------------------------------- kỳ báo cáo ------------------------------ */

export const PERIODS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIODS)[number];

export function parsePeriod(raw: string | string[] | undefined, fallback: PeriodDays = 30): PeriodDays {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as PeriodDays) : fallback;
}

/** Kỳ tính theo ngày lịch giờ VN: "7 ngày" là hôm nay và 6 ngày trước. */
function periodBounds(days: number, now: number) {
  const to = vnDayStart(vnDayKey(now)) + DAY;
  const from = to - days * DAY;
  return { from, to, prevFrom: from - days * DAY };
}

const t = (r: BookingRecord) => Date.parse(r.receivedAt);

/* ------------------------------- dòng đã tra cứu --------------------------- */

export interface ResolvedLine {
  exp: Experience;
  /** Giá mỗi khách lúc nhận yêu cầu. */
  price: number;
  /** price × số khách của yêu cầu. */
  value: number;
}

export function resolveLines(r: BookingRecord, byKey: Map<string, Experience>): ResolvedLine[] {
  return r.lines.flatMap((l) => {
    const exp = byKey.get(l.key);
    return exp ? [{ exp, price: l.price, value: l.price * r.guests }] : [];
  });
}

/* ---------------------------------- tổng quan ------------------------------ */

export interface Metric {
  cur: number | undefined;
  prev: number | undefined;
}

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  sub?: string;
}

export interface Dashboard {
  days: PeriodDays;
  kpi: {
    requests: Metric;
    value: Metric;
    confirmRate: Metric;
    withinSla: Metric;
  };
  medianResponseHours: number | undefined;
  daily: BarDatum[];
  funnel: BarDatum[];
  cancelled: number;
  byCountry: BarDatum[];
  byCat: BarDatum[];
  top: Array<{ exp: Experience; requests: number; guests: number; value: number }>;
  overdue: BookingRecord[];
  unnotified: number;
}

function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function summarize(rs: BookingRecord[], now: number) {
  const live = rs.filter((r) => r.status !== 'CANCELLED');
  const confirmed = rs.filter((r) => r.status === 'CONFIRMED').length;
  const decided = confirmed + rs.filter((r) => r.status === 'CANCELLED').length;
  // Tính SLA trên những yêu cầu đã phân định: đã phản hồi, hoặc chưa phản hồi mà quá hạn.
  const responses = rs.map(firstResponseHours);
  const judged = rs.filter((r, i) => responses[i] !== undefined || isOverdue(r, now)).length;
  const within = responses.filter((h) => h !== undefined && h <= SLA_HOURS).length;
  return {
    requests: rs.length,
    value: live.reduce((s, r) => s + r.estimate, 0),
    confirmRate: decided ? confirmed / decided : undefined,
    withinSla: judged ? within / judged : undefined,
    responses: responses.filter((h): h is number => h !== undefined),
  };
}

export function dashboard(
  records: BookingRecord[],
  byKey: Map<string, Experience>,
  countries: Country[],
  days: PeriodDays,
  now: number,
): Dashboard {
  const { from, to, prevFrom } = periodBounds(days, now);
  const cur = records.filter((r) => t(r) >= from && t(r) < to);
  const prev = records.filter((r) => t(r) >= prevFrom && t(r) < from);
  // Kỳ trước chỉ có nghĩa khi kho có dữ liệu phủ hết kỳ đó.
  const oldest = records.reduce((m, r) => Math.min(m, t(r)), Infinity);
  const hasPrev = oldest <= prevFrom + DAY;

  const a = summarize(cur, now);
  const b = summarize(prev, now);
  const metric = (k: 'requests' | 'value' | 'confirmRate' | 'withinSla'): Metric => ({
    cur: a[k],
    prev: hasPrev ? b[k] : undefined,
  });

  const perDay = new Map<string, number>();
  for (const r of cur) perDay.set(vnDayKey(r.receivedAt), (perDay.get(vnDayKey(r.receivedAt)) ?? 0) + 1);
  const daily: BarDatum[] = [];
  for (let d = from; d < to; d += DAY) {
    const key = vnDayKey(d);
    daily.push({ key, label: vnDateShort(d), sub: vnWeekday(d), value: perDay.get(key) ?? 0 });
  }

  const responded = cur.filter((r) => firstResponseHours(r) !== undefined).length;
  const confirmed = cur.filter((r) => r.status === 'CONFIRMED').length;
  const funnel: BarDatum[] = [
    { key: 'received', label: 'Tiếp nhận', value: cur.length },
    { key: 'contacted', label: 'Đã liên hệ', value: responded },
    { key: 'confirmed', label: 'Đã xác nhận', value: confirmed },
  ];

  const live = cur.filter((r) => r.status !== 'CANCELLED');
  const countryValue = new Map<string, number>();
  const catCount = new Map<Cat, number>();
  const expAgg = new Map<string, { exp: Experience; requests: number; guests: number; value: number }>();
  for (const r of live) {
    for (const l of resolveLines(r, byKey)) {
      countryValue.set(l.exp.country.key, (countryValue.get(l.exp.country.key) ?? 0) + l.value);
      catCount.set(l.exp.cat, (catCount.get(l.exp.cat) ?? 0) + 1);
      const agg = expAgg.get(l.exp.key) ?? { exp: l.exp, requests: 0, guests: 0, value: 0 };
      agg.requests += 1;
      agg.guests += r.guests;
      agg.value += l.value;
      expAgg.set(l.exp.key, agg);
    }
  }

  const byCountry = countries
    .map((c) => ({ key: c.key, label: c.name, value: countryValue.get(c.key) ?? 0 }))
    .sort((x, y) => y.value - x.value);
  const byCat = (Object.keys(CAT_LABEL) as Cat[])
    .map((c) => ({ key: c, label: CAT_LABEL[c], value: catCount.get(c) ?? 0 }))
    .sort((x, y) => y.value - x.value);

  return {
    days,
    kpi: {
      requests: metric('requests'),
      value: metric('value'),
      confirmRate: metric('confirmRate'),
      withinSla: metric('withinSla'),
    },
    medianResponseHours: median(a.responses),
    daily,
    funnel,
    cancelled: cur.filter((r) => r.status === 'CANCELLED').length,
    byCountry,
    byCat,
    top: [...expAgg.values()].sort((x, y) => y.value - x.value).slice(0, 8),
    overdue: records
      .filter((r) => isOverdue(r, now))
      .sort((x, y) => x.receivedAt.localeCompare(y.receivedAt)),
    unnotified: records.filter((r) => !r.notified).length,
  };
}

/* ------------------------------ lịch khởi hành ----------------------------- */

/** Số ngày lịch một trải nghiệm chiếm: "2 đêm" -> 3, "2 ngày" -> 2, "4 giờ" -> 1. */
export function durationDays(duration: string): number {
  const nights = /(\d+)\s*đêm/.exec(duration);
  if (nights) return Number(nights[1]) + 1;
  const days = /(\d+)\s*ngày/.exec(duration);
  if (days) return Number(days[1]);
  return 1;
}

export interface GanttBooking {
  id: string;
  name: string;
  guests: number;
  status: BookingStatus;
}

export interface GanttBar {
  key: string;
  /** Khoá ngày "2026-10-09". */
  start: string;
  days: number;
  guests: number;
  confirmedGuests: number;
  bookings: GanttBooking[];
}

export interface GanttRow {
  key: string;
  title: string;
  cat: Cat;
  place: string;
  duration: string;
  bars: GanttBar[];
}

export interface GanttGroup {
  key: string;
  label: string;
  rows: GanttRow[];
}

export interface Schedule {
  /** Khoá ngày đầu và cuối (bao gồm) của trục thời gian. */
  start: string;
  end: string;
  today: string;
  groups: GanttGroup[];
  flexible: BookingRecord[];
  totals: { departures: number; guests: number; confirmedGuests: number };
}

export function schedule(
  records: BookingRecord[],
  byKey: Map<string, Experience>,
  countries: Country[],
  now: number,
  countrySlug?: string,
): Schedule {
  const isoOf = new Map(DEPARTURES.map((d) => [d.date, d.iso]));
  const live = records.filter((r) => r.status !== 'CANCELLED');
  const bars = new Map<string, GanttBar & { exp: Experience }>();

  for (const r of live) {
    const iso = isoOf.get(r.departure);
    if (!iso) continue;
    for (const l of resolveLines(r, byKey)) {
      if (countrySlug && l.exp.country.slug !== countrySlug) continue;
      const key = `${l.exp.key}@${iso}`;
      const bar = bars.get(key) ?? {
        key,
        exp: l.exp,
        start: iso,
        days: durationDays(l.exp.duration),
        guests: 0,
        confirmedGuests: 0,
        bookings: [],
      };
      bar.guests += r.guests;
      if (r.status === 'CONFIRMED') bar.confirmedGuests += r.guests;
      bar.bookings.push({ id: r.id, name: r.name, guests: r.guests, status: r.status });
      bars.set(key, bar);
    }
  }

  const groups: GanttGroup[] = [];
  for (const c of countries) {
    if (countrySlug && c.slug !== countrySlug) continue;
    const rows: GanttRow[] = [];
    for (const city of c.cities) {
      for (const e of city.experiences) {
        const own = [...bars.values()]
          .filter((b) => b.exp === e)
          .sort((x, y) => x.start.localeCompare(y.start))
          .map(({ exp: _exp, ...bar }) => bar);
        if (own.length) {
          rows.push({ key: e.key, title: e.title, cat: e.cat, place: city.name, duration: e.duration, bars: own });
        }
      }
    }
    if (rows.length) groups.push({ key: c.key, label: c.name, rows });
  }

  const today = vnDayKey(now);
  const all = [...bars.values()];
  const firstDep = DEPARTURES[0].iso;
  const lastEnd = all.reduce(
    (m, b) => Math.max(m, vnDayStart(b.start) + (b.days - 1) * DAY),
    vnDayStart(DEPARTURES[DEPARTURES.length - 1].iso),
  );
  // Trục chạy từ hôm nay (hoặc ngày khởi hành đầu, nếu hôm nay đã qua nó) tới ngày về muộn nhất + 2.
  const startMs = Math.min(vnDayStart(today), vnDayStart(firstDep)) - DAY;

  return {
    start: vnDayKey(startMs),
    end: vnDayKey(lastEnd + 2 * DAY),
    today,
    groups,
    flexible: live
      .filter((r) => r.departure === FLEXIBLE_DEPARTURE)
      .filter((r) => !countrySlug || resolveLines(r, byKey).some((l) => l.exp.country.slug === countrySlug)),
    totals: {
      departures: all.length,
      guests: all.reduce((s, b) => s + b.guests, 0),
      confirmedGuests: all.reduce((s, b) => s + b.confirmedGuests, 0),
    },
  };
}

/* ------------------------------ hiệu quả danh mục -------------------------- */

export interface ExperienceStat {
  exp: Experience;
  requests: number;
  guests: number;
  value: number;
  confirmRate: number | undefined;
}

export const CATALOG_SORTS = { 'gia-tri': 'Giá trị', 'yeu-cau': 'Yêu cầu', gia: 'Giá', ten: 'Tên' } as const;
export type CatalogSort = keyof typeof CATALOG_SORTS;

export function catalogStats(
  records: BookingRecord[],
  countries: Country[],
  byKey: Map<string, Experience>,
  days: PeriodDays | undefined,
  now: number,
  sort: CatalogSort,
): ExperienceStat[] {
  const from = days ? periodBounds(days, now).from : -Infinity;
  const agg = new Map<string, { requests: number; guests: number; value: number; confirmed: number; decided: number }>();
  for (const r of records) {
    if (t(r) < from) continue;
    for (const l of resolveLines(r, byKey)) {
      const a = agg.get(l.exp.key) ?? { requests: 0, guests: 0, value: 0, confirmed: 0, decided: 0 };
      if (r.status === 'CONFIRMED') a.confirmed++;
      if (r.status === 'CONFIRMED' || r.status === 'CANCELLED') a.decided++;
      if (r.status !== 'CANCELLED') {
        a.requests++;
        a.guests += r.guests;
        a.value += l.value;
      }
      agg.set(l.exp.key, a);
    }
  }

  const rows = countries.flatMap((c) =>
    c.cities.flatMap((city) =>
      city.experiences.map((exp) => {
        const a = agg.get(exp.key);
        return {
          exp,
          requests: a?.requests ?? 0,
          guests: a?.guests ?? 0,
          value: a?.value ?? 0,
          confirmRate: a?.decided ? a.confirmed / a.decided : undefined,
        };
      }),
    ),
  );

  const by: Record<CatalogSort, (x: ExperienceStat, y: ExperienceStat) => number> = {
    'gia-tri': (x, y) => y.value - x.value,
    'yeu-cau': (x, y) => y.requests - x.requests,
    gia: (x, y) => y.exp.price - x.exp.price,
    ten: (x, y) => x.exp.title.localeCompare(y.exp.title, 'vi'),
  };
  return rows.sort(by[sort]);
}

/* ------------------------------ lọc danh sách ------------------------------ */

export interface BookingFilter {
  status?: BookingStatus | 'OVERDUE';
  country?: string;
  departure?: string;
  q?: string;
}

export function filterBookings(
  records: BookingRecord[],
  byKey: Map<string, Experience>,
  f: BookingFilter,
  now: number,
): BookingRecord[] {
  const q = f.q ? slugify(f.q) : '';
  return records.filter((r) => {
    if (f.status === 'OVERDUE' ? !isOverdue(r, now) : f.status && r.status !== f.status) return false;
    if (f.departure && r.departure !== f.departure) return false;
    if (f.country && !resolveLines(r, byKey).some((l) => l.exp.country.slug === f.country)) return false;
    if (q) {
      const hay = slugify(`${r.id} ${r.name} ${r.email} ${r.phone}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

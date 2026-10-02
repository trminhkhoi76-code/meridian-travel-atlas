/**
 * Dữ liệu mẫu cho trang quản trị — ~190 ngày yêu cầu đặt chỗ giả, để biểu đồ
 * có gì mà vẽ trước khi có khách thật. Chỉ dùng phía server, qua booking-store.
 *
 * Sinh bằng PRNG có seed cố định, nên cùng một ngày khởi động luôn ra cùng một
 * bộ số. Mốc thời gian neo vào "bây giờ" (không phải một ngày cố định) để
 * "7 / 30 / 90 ngày qua" luôn có dữ liệu. Tên, email (@example.*) và số điện
 * thoại đều là giả.
 */

import type { Country, Experience } from './catalog';
import { DEPARTURES, slugify } from './catalog';
import type { BookingEvent, BookingRecord, BookingStatus } from './booking';
import { FLEXIBLE_DEPARTURE } from './booking';
import { vnDayKey } from './format';

// Đủ dài để kỳ 90 ngày còn có "kỳ trước" mà so sánh.
const DAYS = 190;
const HOUR = 3600_000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const DEM = ['Văn', 'Thị', 'Minh', 'Thu', 'Hoàng', 'Ngọc', 'Thanh', 'Đức', 'Quốc', 'Bảo', 'Gia', 'Hải', 'Anh', 'Phương', 'Khánh'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu', 'Hoa', 'Huy', 'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Trung', 'Tú', 'Vy', 'Yến', 'Uyên'];
const MAIL = ['example.com', 'example.net', 'example.org'];
const GUEST_NOTES = ['Ăn chay', 'Có người lớn tuổi, cần hỗ trợ đi lại', 'Muốn phòng liền kề', 'Kỷ niệm ngày cưới', 'Dị ứng hải sản', 'Đi cùng em bé 2 tuổi'];
const CONTACT_NOTES = ['Đã gọi, gửi báo giá qua email', 'Khách hỏi thêm về thị thực', 'Đã nhắn Zalo, chờ khách phản hồi'];
const CONFIRM_NOTES = ['Khách đã chuyển cọc 30%', 'Đã chốt phương án bay', undefined];
const CANCEL_NOTES = ['Khách đổi kế hoạch', 'Không liên lạc được sau 3 lần gọi', 'Giá vé máy bay tăng, khách hoãn'];

/** Tỉ trọng quan tâm theo quốc gia — nước không có trong bảng lấy 1. */
const COUNTRY_WEIGHT: Record<string, number> = {
  'nhat-ban': 4,
  'viet-nam': 3,
  'han-quoc': 2.5,
  uc: 1.5,
  'thuy-si': 1.2,
  'ma-roc': 0.8,
};

export function buildSeedBookings(countries: Country[], now: number): BookingRecord[] {
  const rand = mulberry32(20260929);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const weighted = <T,>(xs: readonly T[], w: (x: T) => number) => {
    const total = xs.reduce((s, x) => s + w(x), 0);
    let r = rand() * total;
    for (const x of xs) if ((r -= w(x)) <= 0) return x;
    return xs[xs.length - 1];
  };
  const poisson = (lambda: number) => {
    let k = 0;
    for (let p = Math.exp(-lambda), s = p, u = rand(); u > s; k++) s += p *= lambda / (k + 1);
    return k;
  };

  const expsOf = (c: Country) => c.cities.flatMap((t) => t.experiences);
  // Rẻ thì nhiều người đặt hơn.
  const expWeight = (e: Experience) => 1 / Math.sqrt(e.price / 1e6);

  const records: BookingRecord[] = [];
  const today = Date.parse(vnDayKey(now) + 'T00:00:00+07:00');

  for (let d = DAYS - 1; d >= 0; d--) {
    const dayStart = today - d * 24 * HOUR;
    const weekday = new Date(dayStart + 7 * HOUR).getUTCDay();
    // Tăng dần về gần hiện tại, cuối tuần đông hơn.
    const lambda = (1.4 + 2.6 * (1 - d / DAYS)) * (weekday === 0 || weekday === 6 ? 1.35 : 1);

    for (let n = poisson(lambda); n > 0; n--) {
      const received = dayStart + (7 + rand() * 16) * HOUR;
      if (received > now) continue;

      const country = weighted(countries, (c) => COUNTRY_WEIGHT[c.slug] ?? 1);
      const count = weighted([1, 2, 3], (k) => ({ 1: 55, 2: 32, 3: 13 })[k]!);
      const chosen: Experience[] = [];
      while (chosen.length < count) {
        const pool = expsOf(rand() < 0.85 ? country : pick(countries)).filter((e) => !chosen.includes(e));
        if (pool.length) chosen.push(weighted(pool, expWeight));
      }

      const adults = weighted([1, 2, 3, 4], (k) => ({ 1: 2, 2: 5, 3: 2, 4: 1 })[k]!);
      const children = weighted([0, 1, 2], (k) => ({ 0: 7, 1: 2, 2: 1 })[k]!);
      const guests = adults + children;

      // Chỉ nhận ngày khởi hành còn cách lúc đặt ít nhất 3 ngày.
      const open = DEPARTURES.filter((x) => Date.parse(x.iso + 'T00:00:00+07:00') - received > 72 * HOUR);
      const departure =
        open.length && rand() < 0.82 ? weighted(open, (x) => 1 / (1 + open.indexOf(x))).date : FLEXIBLE_DEPARTURE;

      const ho = pick(HO);
      const ten = pick(TEN);
      const name = `${ho} ${pick(DEM)} ${ten}`;

      const history: BookingEvent[] = [{ at: new Date(received).toISOString(), status: 'NEW' }];
      let status: BookingStatus = 'NEW';
      const r = rand();
      const respondH = r < 0.65 ? 0.5 + rand() * 7.5 : r < 0.85 ? 8 + rand() * 16 : 24 + rand() * 36;
      const decideH = 12 + rand() * 108;
      // Một ít yêu cầu gần đây bị sót, không ai gọi lại — để hàng "quá hạn" có gì mà xử lý.
      const missed = now - received < 10 * 24 * HOUR && rand() < 0.05;
      if (!missed && received + respondH * HOUR <= now) {
        status = 'CONTACTED';
        history.push({ at: new Date(received + respondH * HOUR).toISOString(), status, note: pick(CONTACT_NOTES) });
        if (received + (respondH + decideH) * HOUR <= now) {
          status = rand() < 0.72 ? 'CONFIRMED' : 'CANCELLED';
          history.push({
            at: new Date(received + (respondH + decideH) * HOUR).toISOString(),
            status,
            note: pick(status === 'CONFIRMED' ? CONFIRM_NOTES : CANCEL_NOTES),
          });
        }
      }

      const day = vnDayKey(received).slice(2).replace(/-/g, '');
      const lines = chosen.map((e) => ({ key: e.key, price: e.price }));
      records.push({
        id: `MT-${day}-${Math.floor(rand() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`,
        receivedAt: new Date(received).toISOString(),
        name,
        email: `${slugify(ten)}.${slugify(ho)}${Math.floor(rand() * 90 + 10)}@${pick(MAIL)}`,
        phone: '09' + Math.floor(rand() * 1e8).toString().padStart(8, '0'),
        adults,
        children,
        departure,
        note: rand() < 0.3 ? pick(GUEST_NOTES) : '',
        guests,
        estimate: lines.reduce((s, l) => s + l.price, 0) * guests,
        lines,
        status,
        history,
        notified: true,
        source: 'seed',
      });
    }
  }

  return records.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

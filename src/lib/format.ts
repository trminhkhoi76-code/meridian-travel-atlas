/** Định dạng số và toạ độ. Viết tay thay vì Intl để server và client luôn ra
 *  cùng một chuỗi — tránh lệch khi hydrate. */

function groupThousands(value: number): string {
  const digits = Math.round(Math.abs(value)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return (value < 0 ? '-' : '') + out;
}

/** 3900000 -> "3.900.000 ₫" */
export function vnd(value: number): string {
  return groupThousands(value) + ' ₫';
}

/** 3900000 -> "3,9 tr" — cho nhãn gọn ("từ 450k") trên thẻ và ghim bản đồ. */
export function vndShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const s = (m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, ''));
    return s.replace('.', ',') + ' tr';
  }
  return groupThousands(value / 1000) + 'k';
}

const decimal = (value: number, digits: number) => value.toFixed(digits).replace('.', ',');

/** "10,26° B · 103,94° Đ" — gọn, cho thẻ thông tin địa điểm. */
export function coordShort([lng, lat]: [number, number]): string {
  return `${decimal(Math.abs(lat), 2)}° ${lat >= 0 ? 'B' : 'N'} · ${decimal(Math.abs(lng), 2)}° ${lng >= 0 ? 'Đ' : 'T'}`;
}

/** 0.4 -> "Dưới 1 km", 6.2 -> "Khoảng 6 km", 63 -> "Khoảng 63 km". */
export function kmLabel(km: number): string {
  return km < 1 ? 'Dưới 1 km' : `Khoảng ${Math.round(km)} km`;
}

export function ratingLabel(rating: number): string {
  return rating.toFixed(1).replace('.', ',');
}

/** 1284 -> "1.284" */
export function num(value: number): string {
  return groupThousands(value);
}

/** Số tiền gọn cho trục và ô số liệu: 1250000000 -> "1,25 tỷ", 18900000 -> "18,9 tr". */
export function vndCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  // Chỉ bỏ số 0 sau dấu thập phân — "120" phải giữ nguyên, "18.0" thành "18".
  const trim = (s: string) =>
    (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s).replace('.', ',');
  if (abs >= 1e9) return sign + trim((abs / 1e9).toFixed(abs >= 1e10 ? 1 : 2)) + ' tỷ';
  if (abs >= 1e6) return sign + trim((abs / 1e6).toFixed(abs >= 1e8 ? 0 : 1)) + ' tr';
  if (abs >= 1e3) return sign + Math.round(abs / 1e3) + 'k';
  return sign + Math.round(abs).toString();
}

/** 0.725 -> "72,5%"; làm tròn tới một chữ số lẻ, bỏ ",0". */
export function pct(ratio: number): string {
  return (Math.round(ratio * 1000) / 10).toFixed(1).replace(/\.0$/, '').replace('.', ',') + '%';
}

/* ----------------------------- ngày giờ (giờ VN) --------------------------- */

const VN_OFFSET = 7 * 3600_000;
const pad2 = (n: number) => n.toString().padStart(2, '0');
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Luôn quy về UTC+7, không phụ thuộc múi giờ của máy chủ hay trình duyệt. */
function vn(t: string | number | Date): Date {
  return new Date(new Date(t).getTime() + VN_OFFSET);
}

/** "2026-09-29" — khoá ngày theo giờ VN, dùng để gom số liệu theo ngày. */
export function vnDayKey(t: string | number | Date): string {
  const d = vn(t);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Mốc 00:00 giờ VN của một khoá ngày "2026-09-29", tính bằng ms. */
export function vnDayStart(dayKey: string): number {
  return Date.parse(dayKey + 'T00:00:00Z') - VN_OFFSET;
}

/** "29.09" */
export function vnDateShort(t: string | number | Date): string {
  const d = vn(t);
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}`;
}

/** "29.09.2026" */
export function vnDate(t: string | number | Date): string {
  const d = vn(t);
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** "29.09.2026 14:05" */
export function vnDateTime(t: string | number | Date): string {
  const d = vn(t);
  return `${vnDate(t)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** "T3" … "CN" */
export function vnWeekday(t: string | number | Date): string {
  return WEEKDAY[vn(t).getUTCDay()];
}

/** Số giờ -> "45 phút", "5 giờ", "2 ngày 3 giờ". */
export function hoursLabel(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} phút`;
  if (hours < 24) return `${Math.round(hours)} giờ`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return rest ? `${days} ngày ${rest} giờ` : `${days} ngày`;
}

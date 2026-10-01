/**
 * Yêu cầu đặt chỗ — hình dạng dữ liệu, luật kiểm tra và hàm gửi, dùng chung
 * cho form phía client và route handler `POST /api/booking-requests`. Cùng một
 * hàm `validateBooking` chạy ở cả hai phía, nên thông báo lỗi luôn khớp nhau.
 *
 * File này không được import gì chỉ-có-ở-server: form (client) cũng dùng nó.
 */

import { DEPARTURES } from './catalog';

/** Đổi sang URL của backend thật khi có — form không cần sửa gì thêm. */
export const BOOKING_ENDPOINT = process.env.NEXT_PUBLIC_BOOKING_ENDPOINT ?? '/api/booking-requests';

/** Khách chưa chốt ngày, để chuyên viên đề xuất. */
export const FLEXIBLE_DEPARTURE = 'linh-hoat';

export const GUEST_LIMIT = { adults: [1, 20], children: [0, 20] } as const;
const MAX_ITEMS = 30;
const MAX_NOTE = 1000;

export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  /** Một trong `DEPARTURES[].date`, hoặc `FLEXIBLE_DEPARTURE`. */
  departure: string;
  note: string;
  /** Khoá trải nghiệm (`Experience.key`) trong hành trình. */
  items: string[];
}

export type BookingField = keyof BookingRequest;
export type BookingErrors = Partial<Record<BookingField, string>>;

/** Server trả về khi đã nhận và chuyển yêu cầu tới hộp thư admin. */
export interface BookingReceipt {
  id: string;
  receivedAt: string;
  guests: number;
  /** Tạm tính do server tự cộng lại từ danh mục — không tin số client gửi lên. */
  estimate: number;
}

export type ValidationResult =
  | { ok: true; value: BookingRequest }
  | { ok: false; errors: BookingErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?\d{9,15}$/;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function int(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isInteger(n) ? n : NaN;
}

/** Bỏ khoảng trắng, dấu chấm, gạch nối, ngoặc: "090 123.45-67" -> "0901234567". */
export function normalizePhone(v: string): string {
  return v.replace(/[\s.\-()]/g, '');
}

export function departureLabel(value: string): string {
  if (value === FLEXIBLE_DEPARTURE) return 'Linh hoạt';
  const d = DEPARTURES.find((x) => x.date === value);
  return d ? `${d.date} · ${d.day}` : value;
}

export function validateBooking(raw: unknown): ValidationResult {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: BookingErrors = {};

  const name = text(src.name).replace(/\s+/g, ' ');
  if (name.length < 2) errors.name = 'Vui lòng nhập họ tên.';
  else if (name.length > 80) errors.name = 'Họ tên tối đa 80 ký tự.';

  const email = text(src.email).toLowerCase();
  if (!email) errors.email = 'Vui lòng nhập email.';
  else if (email.length > 120 || !EMAIL.test(email)) errors.email = 'Email chưa đúng định dạng.';

  const phone = normalizePhone(text(src.phone));
  if (!phone) errors.phone = 'Vui lòng nhập số điện thoại.';
  else if (!PHONE.test(phone)) errors.phone = 'Số điện thoại gồm 9–15 chữ số.';

  const adults = int(src.adults);
  const [aMin, aMax] = GUEST_LIMIT.adults;
  if (!(adults >= aMin && adults <= aMax)) errors.adults = `Người lớn từ ${aMin} đến ${aMax}.`;

  const children = int(src.children);
  const [cMin, cMax] = GUEST_LIMIT.children;
  if (!(children >= cMin && children <= cMax)) errors.children = `Trẻ em từ ${cMin} đến ${cMax}.`;

  const departure = text(src.departure);
  if (departure !== FLEXIBLE_DEPARTURE && !DEPARTURES.some((d) => d.date === departure)) {
    errors.departure = 'Vui lòng chọn ngày khởi hành.';
  }

  const note = text(src.note);
  if (note.length > MAX_NOTE) errors.note = `Ghi chú tối đa ${MAX_NOTE} ký tự.`;

  const items = Array.isArray(src.items)
    ? [...new Set(src.items.filter((k): k is string => typeof k === 'string' && k !== ''))]
    : [];
  if (items.length === 0) errors.items = 'Hành trình đang trống.';
  else if (items.length > MAX_ITEMS) errors.items = `Tối đa ${MAX_ITEMS} trải nghiệm mỗi yêu cầu.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, email, phone, adults, children, departure, note, items } };
}

export class BookingSubmitError extends Error {
  constructor(message: string, readonly errors: BookingErrors = {}) {
    super(message);
    this.name = 'BookingSubmitError';
  }
}

/** Gửi yêu cầu. Ném `BookingSubmitError` kèm lỗi từng trường nếu server từ chối. */
export async function submitBooking(
  request: BookingRequest & { website?: string },
): Promise<BookingReceipt> {
  let res: Response;
  try {
    res = await fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new BookingSubmitError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }

  const body: unknown = await res.json().catch(() => null);
  if (res.ok && body && typeof body === 'object' && 'id' in body) return body as BookingReceipt;

  const { error, errors } = (body ?? {}) as { error?: string; errors?: BookingErrors };
  throw new BookingSubmitError(error ?? 'Chưa gửi được yêu cầu. Vui lòng thử lại.', errors);
}

/* --------------------------- phía quản trị (admin) ------------------------- */

/** Mã trạng thái giữ ASCII; nhãn tiếng Việt ở STATUS_LABEL. */
export const BOOKING_STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đang tư vấn',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
};

/** Các bước chuyển hợp lệ — huỷ rồi vẫn mở lại được, về "Đang tư vấn". */
export const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  NEW: ['CONTACTED', 'CONFIRMED', 'CANCELLED'],
  CONTACTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: ['CONTACTED'],
};

/** Cam kết với khách: liên hệ lại trong 24 giờ. */
export const SLA_HOURS = 24;

export interface BookingEvent {
  at: string;
  status: BookingStatus;
  note?: string;
}

/** Một yêu cầu đã lưu. Giá từng dòng được chụp lại lúc nhận, để danh mục đổi giá sau
 *  không làm sai số liệu cũ. */
export interface BookingRecord extends Omit<BookingRequest, 'items'> {
  id: string;
  receivedAt: string;
  guests: number;
  estimate: number;
  lines: Array<{ key: string; price: number }>;
  status: BookingStatus;
  /** Sự kiện đầu tiên luôn là NEW lúc nhận; thêm một dòng mỗi lần đổi trạng thái hoặc ghi chú. */
  history: BookingEvent[];
  /** Mail báo admin đã gửi được chưa — gửi hỏng vẫn lưu yêu cầu. */
  notified: boolean;
  source: 'web' | 'seed';
}

/** Giờ từ lúc nhận tới lần xử lý đầu tiên; `undefined` nếu chưa ai đụng tới. */
export function firstResponseHours(r: BookingRecord): number | undefined {
  const first = r.history.find((e, i) => i > 0 && e.status !== 'NEW');
  if (!first) return undefined;
  return (Date.parse(first.at) - Date.parse(r.receivedAt)) / 3600_000;
}

export function isOverdue(r: BookingRecord, now: number): boolean {
  return r.status === 'NEW' && now - Date.parse(r.receivedAt) > SLA_HOURS * 3600_000;
}

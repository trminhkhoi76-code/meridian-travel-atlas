/**
 * Kho yêu cầu đặt chỗ — lớp truy cập DUY NHẤT, chỉ dùng phía server (route
 * handler, trang admin, server action). Cùng vai trò với catalog-service.ts.
 *
 * Hiện là bản GIẢ LẬP trong bộ nhớ: dữ liệu mẫu (booking-seed.ts) cộng các yêu
 * cầu thật gửi từ lúc server khởi động. Khởi động lại là mất; trên môi trường
 * serverless mỗi instance còn giữ một bản riêng. Khi có backend, chỉ cần thay
 * thân các hàm dưới đây bằng lời gọi DB/API — mọi nơi gọi không phải đổi gì.
 */

import type { BookingEvent, BookingRecord, BookingStatus } from './booking';
import { NEXT_STATUS } from './booking';
import { buildSeedBookings } from './booking-seed';
import { getCountries } from './catalog-service';

// Neo trên globalThis để HMR của `next dev` nạp lại module mà không xoá dữ liệu.
const g = globalThis as typeof globalThis & { __meridianBookings?: Promise<BookingRecord[]> };

function all(): Promise<BookingRecord[]> {
  g.__meridianBookings ??= getCountries().then((countries) => buildSeedBookings(countries, Date.now()));
  return g.__meridianBookings;
}

/** Mới nhất trước. */
export async function listBookings(): Promise<BookingRecord[]> {
  return all();
}

export async function getBooking(id: string): Promise<BookingRecord | undefined> {
  return (await all()).find((r) => r.id === id);
}

export async function saveBooking(record: BookingRecord): Promise<void> {
  const records = await all();
  records.unshift(record);
}

export async function markNotified(id: string, notified: boolean): Promise<void> {
  const record = await getBooking(id);
  if (record) record.notified = notified;
}

export type UpdateResult =
  | { ok: true; record: BookingRecord }
  | { ok: false; error: string };

/** Đổi trạng thái và/hoặc thêm ghi chú nội bộ; mỗi lần gọi thêm một dòng lịch sử. */
export async function updateBooking(
  id: string,
  change: { status?: BookingStatus; note?: string },
): Promise<UpdateResult> {
  const record = await getBooking(id);
  if (!record) return { ok: false, error: 'Không tìm thấy yêu cầu.' };

  const note = change.note?.trim() || undefined;
  const status = change.status ?? record.status;
  if (status !== record.status && !NEXT_STATUS[record.status].includes(status)) {
    return { ok: false, error: 'Không thể chuyển sang trạng thái này.' };
  }
  if (status === record.status && !note) {
    return { ok: false, error: 'Chưa có thay đổi nào.' };
  }

  const event: BookingEvent = { at: new Date().toISOString(), status, ...(note ? { note } : {}) };
  record.status = status;
  record.history.push(event);
  return { ok: true, record };
}

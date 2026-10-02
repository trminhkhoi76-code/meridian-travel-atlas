/**
 * Đọc/ghi bộ lọc danh sách yêu cầu trên URL — dùng chung cho trang
 * /admin/yeu-cau và route xuất CSV, để file xuất ra đúng những gì đang thấy.
 */

import type { BookingFilter } from './admin-stats';
import { BOOKING_STATUSES } from './booking';
import type { BookingStatus } from './booking';

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(sp: Params, key: string): string | undefined {
  const v = sp instanceof URLSearchParams ? sp.get(key) : sp[key];
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s : undefined;
}

export function parseBookingFilter(sp: Params): BookingFilter {
  const status = get(sp, 'trang-thai');
  return {
    status:
      status === 'OVERDUE' || (BOOKING_STATUSES as readonly string[]).includes(status ?? '')
        ? (status as BookingStatus | 'OVERDUE')
        : undefined,
    country: get(sp, 'nuoc'),
    departure: get(sp, 'khoi-hanh'),
    q: get(sp, 'q')?.slice(0, 80),
  };
}

export function filterQuery(f: BookingFilter, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (f.q) q.set('q', f.q);
  if (f.status) q.set('trang-thai', f.status);
  if (f.country) q.set('nuoc', f.country);
  if (f.departure) q.set('khoi-hanh', f.departure);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return q.toString();
}

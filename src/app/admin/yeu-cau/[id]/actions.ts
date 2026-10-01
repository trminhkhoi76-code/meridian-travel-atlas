'use server';

import { revalidatePath } from 'next/cache';
import { BOOKING_STATUSES } from '@/lib/booking';
import type { BookingStatus } from '@/lib/booking';
import { updateBooking } from '@/lib/booking-store';

export interface ActionState {
  ok: boolean | null;
  message?: string;
  /** Tăng mỗi lần lưu thành công — form dùng làm `key` để xoá ô ghi chú. */
  version: number;
}

/**
 * Đổi trạng thái / thêm ghi chú nội bộ. Server action POST về chính URL
 * /admin/yeu-cau/[id], nên luôn nằm sau Basic Auth của middleware.
 */
export async function updateBookingAction(prev: ActionState, form: FormData): Promise<ActionState> {
  const id = String(form.get('id') ?? '');
  // `intent`: có JS (xem BookingActions); `status`: nút submit khi không có JS.
  const rawStatus = form.get('intent') || form.get('status');
  const note = String(form.get('note') ?? '').slice(0, 500);
  const status =
    typeof rawStatus === 'string' && (BOOKING_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as BookingStatus)
      : undefined;

  const result = await updateBooking(id, { status, note });
  if (!result.ok) return { ok: false, message: result.error, version: prev.version };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: status ? 'Đã cập nhật trạng thái.' : 'Đã lưu ghi chú.', version: prev.version + 1 };
}

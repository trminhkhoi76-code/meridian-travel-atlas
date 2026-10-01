import { filterBookings, resolveLines } from '@/lib/admin-stats';
import { parseBookingFilter } from '@/lib/admin-filter';
import { getExperienceIndex } from '@/lib/catalog-service';
import { listBookings } from '@/lib/booking-store';
import { STATUS_LABEL, departureLabel, firstResponseHours } from '@/lib/booking';
import { vnDateTime, vnDayKey } from '@/lib/format';

/** Ô CSV: bọc ngoặc kép, và chặn công thức Excel (=, +, -, @) từ dữ liệu khách nhập. */
function cell(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

/** GET /admin/yeu-cau/csv?… — cùng bộ lọc với trang danh sách. Middleware chỉ cho ROLE_ADMIN vào /admin. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filter = parseBookingFilter(url.searchParams);
  const now = Date.now();
  const [records, byKey] = await Promise.all([listBookings(), getExperienceIndex()]);
  const rows = filterBookings(records, byKey, filter, now);

  const head = [
    'Mã', 'Nhận lúc', 'Họ tên', 'Email', 'Điện thoại', 'Người lớn', 'Trẻ em', 'Khởi hành',
    'Hành trình', 'Tạm tính (VND)', 'Trạng thái', 'Phản hồi đầu (giờ)', 'Ghi chú của khách', 'Nguồn',
  ];
  const body = rows.map((r) => {
    const h = firstResponseHours(r);
    return [
      r.id,
      vnDateTime(r.receivedAt),
      r.name,
      r.email,
      r.phone,
      r.adults,
      r.children,
      departureLabel(r.departure),
      resolveLines(r, byKey).map((l) => l.exp.title).join(' | '),
      r.estimate,
      STATUS_LABEL[r.status],
      h === undefined ? '' : h.toFixed(1),
      r.note,
      r.source === 'seed' ? 'mẫu' : 'web',
    ]
      .map(cell)
      .join(',');
  });

  // BOM để Excel mở đúng tiếng Việt.
  const csv = '﻿' + [head.map(cell).join(','), ...body].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="yeu-cau-${vnDayKey(now)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

import { getExperienceByKey } from '@/lib/catalog-service';
import type { Experience } from '@/lib/catalog';
import type { BookingReceipt } from '@/lib/booking';
import { validateBooking } from '@/lib/booking';
import { bookingId, composeBookingMail } from '@/lib/booking-mail';
import { adminRecipients, getMailer } from '@/lib/mailer';

/**
 * POST /api/booking-requests — nhận yêu cầu đặt chỗ từ /hanh-trinh và gửi mail
 * báo về hộp thư admin. API GIẢ LẬP: chưa lưu ở đâu, mailer chỉ ghi log (xem
 * lib/mailer.ts). Hợp đồng request/response nằm ở lib/booking.ts — backend thật
 * chỉ cần giữ đúng hợp đồng đó.
 *
 *   201 BookingReceipt
 *   400 { error }            body không phải JSON
 *   422 { error, errors }    sai dữ liệu, lỗi theo từng trường
 *   502 { error }            gửi mail thất bại
 */
export async function POST(request: Request) {
  const raw: unknown = await request.json().catch(() => undefined);
  if (raw === undefined) {
    return Response.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const now = new Date();
  const receivedAt = now.toISOString();

  // Bẫy bot: ô `website` bị ẩn khỏi người thật. Có giá trị thì trả như thành công
  // để bot không dò ra, nhưng không gửi gì.
  const website = raw && typeof raw === 'object' ? (raw as { website?: unknown }).website : undefined;
  if (typeof website === 'string' && website.trim() !== '') {
    const fake: BookingReceipt = { id: bookingId(now), receivedAt, guests: 0, estimate: 0 };
    return Response.json(fake, { status: 201 });
  }

  const result = validateBooking(raw);
  if (!result.ok) {
    return Response.json(
      { error: 'Vui lòng kiểm tra lại thông tin.', errors: result.errors },
      { status: 422 },
    );
  }
  const booking = result.value;

  // Giá luôn lấy lại từ danh mục phía server, không tin số client gửi lên.
  const lines = (await Promise.all(booking.items.map(getExperienceByKey))).filter(
    (e): e is Experience => Boolean(e),
  );
  if (lines.length !== booking.items.length) {
    return Response.json(
      {
        error: 'Một số trải nghiệm không còn trong danh mục.',
        errors: { items: 'Hãy tải lại trang để cập nhật hành trình.' },
      },
      { status: 422 },
    );
  }

  const guests = booking.adults + booking.children;
  const receipt: BookingReceipt = {
    id: bookingId(now),
    receivedAt,
    guests,
    estimate: lines.reduce((sum, e) => sum + e.price, 0) * guests,
  };

  try {
    await getMailer().send(composeBookingMail(adminRecipients(), booking, lines, receipt));
  } catch (err) {
    console.error('[booking-requests] gửi mail thất bại', receipt.id, err);
    return Response.json(
      { error: 'Chưa gửi được yêu cầu. Vui lòng thử lại sau ít phút.' },
      { status: 502 },
    );
  }

  return Response.json(receipt, { status: 201 });
}

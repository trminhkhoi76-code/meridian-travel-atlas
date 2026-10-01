/**
 * Soạn mail báo yêu cầu đặt chỗ mới cho admin — chỉ dùng phía server.
 * Mọi chuỗi do khách nhập đều được escape trước khi vào bản HTML.
 */

import type { Experience } from './catalog';
import { CAT_LABEL } from './catalog';
import type { BookingReceipt, BookingRequest } from './booking';
import { departureLabel } from './booking';
import { vnDateTime, vnDayKey, vnd } from './format';
import type { MailMessage } from './mailer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "MT-260929-7K3Q" — ngày nhận (giờ VN) + 4 ký tự ngẫu nhiên, đủ để đọc qua điện thoại. */
export function bookingId(now: Date): string {
  const day = vnDayKey(now).slice(2).replace(/-/g, '');
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `MT-${day}-${rand}`;
}

const experienceUrl = (e: Experience) => `${SITE_URL}/${e.country.slug}/${e.city.slug}/${e.slug}`;

export function composeBookingMail(
  to: string[],
  request: BookingRequest,
  lines: Experience[],
  receipt: BookingReceipt,
): MailMessage {
  const guests =
    `${request.adults} người lớn` + (request.children > 0 ? `, ${request.children} trẻ em` : '');
  const perGuest = lines.reduce((sum, e) => sum + e.price, 0);

  const contact: Array<[string, string]> = [
    ['Mã yêu cầu', receipt.id],
    ['Thời điểm', vnDateTime(receipt.receivedAt) + ' (giờ VN)'],
    ['Họ tên', request.name],
    ['Email', request.email],
    ['Điện thoại', request.phone],
    ['Số khách', guests],
    ['Khởi hành', departureLabel(request.departure)],
  ];

  const text = [
    `Yêu cầu đặt chỗ mới ${receipt.id}`,
    '',
    ...contact.map(([k, v]) => `${k}: ${v}`),
    '',
    `Hành trình (${lines.length} dòng):`,
    ...lines.map(
      (e, i) =>
        `${i + 1}. ${e.title} — ${e.city.name}, ${e.country.name} · ${e.duration} · ` +
        `${vnd(e.price)}/khách\n   ${experienceUrl(e)}`,
    ),
    '',
    `Tạm tính: ${vnd(perGuest)}/khách × ${receipt.guests} khách = ${vnd(receipt.estimate)}`,
    '',
    'Ghi chú của khách:',
    request.note || '(không có)',
    '',
    'Trả lời mail này để phản hồi trực tiếp cho khách. Cam kết xác nhận trong 24 giờ.',
  ].join('\n');

  const cell = 'padding:6px 12px 6px 0;vertical-align:top';
  const html = `<!doctype html>
<html lang="vi"><body style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:14px;color:#1f1b17;line-height:1.5">
<h2 style="font-weight:500;margin:0 0 12px">Yêu cầu đặt chỗ mới · ${escapeHtml(receipt.id)}</h2>
<table style="border-collapse:collapse;margin:0 0 18px">
${contact
  .map(
    ([k, v]) =>
      `<tr><td style="${cell};color:#6c6459">${escapeHtml(k)}</td><td style="${cell}">${escapeHtml(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<h3 style="font-weight:500;margin:0 0 6px">Hành trình · ${lines.length} dòng</h3>
<table style="border-collapse:collapse;margin:0 0 12px">
${lines
  .map(
    (e) =>
      `<tr><td style="${cell}"><a href="${escapeHtml(experienceUrl(e))}" style="color:#c2492b">${escapeHtml(e.title)}</a><br>` +
      `<small style="color:#6c6459">${escapeHtml(`${CAT_LABEL[e.cat]} · ${e.city.name}, ${e.country.name} · ${e.duration}`)}</small></td>` +
      `<td style="${cell};text-align:right;white-space:nowrap">${escapeHtml(vnd(e.price))}/khách</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin:0 0 18px"><b>Tạm tính: ${escapeHtml(vnd(receipt.estimate))}</b>
<span style="color:#6c6459"> (${escapeHtml(vnd(perGuest))}/khách × ${receipt.guests} khách)</span></p>
<h3 style="font-weight:500;margin:0 0 6px">Ghi chú của khách</h3>
<p style="margin:0 0 18px;white-space:pre-wrap">${request.note ? escapeHtml(request.note) : '<i style="color:#9b9284">(không có)</i>'}</p>
<p style="color:#9b9284;font-size:12px">Trả lời mail này để phản hồi trực tiếp cho khách. Cam kết xác nhận trong 24 giờ.</p>
</body></html>`;

  return {
    to,
    replyTo: request.email,
    subject: `[Đặt chỗ] ${receipt.id} · ${request.name} · ${lines.length} trải nghiệm`,
    text,
    html,
  };
}

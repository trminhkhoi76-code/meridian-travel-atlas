/**
 * Cổng gửi mail — chỉ dùng phía server (route handler).
 *
 * Hiện là bản GIẢ LẬP: không gửi thật, chỉ chờ một nhịp cho giống mạng rồi ghi
 * log. Khi có backend thật, chỉ cần thay thân `getMailer()` (SES, SMTP, hoặc gọi
 * API của backend) — route handler và form không phải đổi gì.
 */

export interface MailMessage {
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<{ messageId: string }>;
}

/** Hộp thư nhận yêu cầu đặt chỗ; nhiều địa chỉ thì ngăn bằng dấu phẩy. */
export function adminRecipients(): string[] {
  return (process.env.BOOKING_ADMIN_EMAIL ?? 'dat-cho@meridian.example')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const mockMailer: Mailer = {
  async send(message) {
    await new Promise((r) => setTimeout(r, 500));
    const messageId = `mock-${Date.now().toString(36)}`;
    // Nội dung mail có thông tin cá nhân của khách — chỉ in toàn văn khi chạy dev.
    if (process.env.NODE_ENV === 'production') {
      console.info('[mailer:mock]', messageId, '→', message.to.join(', '), '·', message.subject);
    } else {
      console.info(
        `\n[mailer:mock] ${messageId}\nTo: ${message.to.join(', ')}\nReply-To: ${message.replyTo ?? '-'}\n` +
          `Subject: ${message.subject}\n\n${message.text}\n`,
      );
    }
    return { messageId };
  },
};

export function getMailer(): Mailer {
  return mockMailer;
}

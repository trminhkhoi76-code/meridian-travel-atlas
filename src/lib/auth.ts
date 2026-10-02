/**
 * Hợp đồng đăng nhập dùng chung cho form (client), server action và middleware —
 * như booking.ts với yêu cầu đặt chỗ. Không gọi mạng ở đây: phần nói chuyện với
 * auth-service nằm ở auth-service.ts (chỉ chạy phía server).
 */

export const ACCESS_COOKIE = 'mt_at';
export const REFRESH_COOKIE = 'mt_rt';

export const LOGIN_PATH = '/dang-nhap';
export const REGISTER_PATH = '/dang-ky';
export const ACCOUNT_PATH = '/tai-khoan';
export const ACCOUNT_PATHS = [LOGIN_PATH, REGISTER_PATH, ACCOUNT_PATH];

export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

/** Đọc từ access token, không gọi mạng — chỉ để hiển thị, không dùng để phân quyền. */
export interface SessionUser {
  id: number;
  email: string;
  role: Role;
}

export type CredentialField = 'email' | 'password';
export type CredentialErrors = Partial<Record<CredentialField, string>>;

export interface Credentials {
  email: string;
  password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** BCrypt của auth-service chỉ nhận tối đa 72 byte — tiếng Việt có dấu tốn 2–3 byte mỗi chữ. */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 8;

export function utf8Length(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Cùng luật với auth-service (`@Email`, mật khẩu ≥ 8 ký tự), thêm giới hạn 72 byte mà
 * auth-service chưa tự kiểm: vượt quá thì nó trả 500 thay vì 400.
 */
export function validateCredentials(
  raw: { email?: unknown; password?: unknown },
  mode: 'login' | 'register',
): { ok: true; value: Credentials } | { ok: false; errors: CredentialErrors } {
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  const errors: CredentialErrors = {};

  if (!email) errors.email = 'Nhập email.';
  else if (!EMAIL_RE.test(email) || email.length > 255) errors.email = 'Email chưa đúng định dạng.';

  if (!password) errors.password = 'Nhập mật khẩu.';
  else if (utf8Length(password) > PASSWORD_MAX_BYTES) errors.password = 'Mật khẩu quá dài (tối đa 72 byte).';
  else if (mode === 'register' && password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { email, password } };
}

/**
 * Chỉ cho quay về đường dẫn nội bộ: `//evil.com` và `/\evil.com` đều bị trình duyệt hiểu
 * là host khác, nên chặn cả hai.
 */
export function safeNext(next: unknown, fallback = ACCOUNT_PATH): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }
  if (ACCOUNT_PATHS.some((p) => next === p || next.startsWith(p + '?'))) return fallback;
  return next;
}

interface JwtPayload {
  sub?: string;
  exp?: number;
  uid?: number;
  role?: string;
  token_type?: string;
}

/**
 * Giải mã phần payload, KHÔNG kiểm chữ ký (FE không giữ secret của auth-service). Chỉ dùng
 * để đọc hạn và hiển thị; quyết định quyền luôn hỏi lại auth-service qua `/api/users/me`.
 */
export function decodeJwt(token: string): JwtPayload | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}

/** Còn hạn ít nhất `skewSeconds` nữa không — làm mới sớm để request đang bay không hết hạn giữa chừng. */
export function isFresh(token: string | undefined, skewSeconds = 30, now = Date.now()): boolean {
  const exp = token ? decodeJwt(token)?.exp : undefined;
  return typeof exp === 'number' && exp * 1000 - skewSeconds * 1000 > now;
}

export function sessionFromToken(token: string | undefined): SessionUser | null {
  if (!token || !isFresh(token, 0)) return null;
  const p = decodeJwt(token);
  if (!p || p.token_type !== 'ACCESS' || !p.sub || typeof p.uid !== 'number') return null;
  return { id: p.uid, email: p.sub, role: p.role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER' };
}

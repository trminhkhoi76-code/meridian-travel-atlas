'use server';

import { redirect } from 'next/navigation';
import type { CredentialErrors } from '@/lib/auth';
import { safeNext, validateCredentials } from '@/lib/auth';
import * as authService from '@/lib/auth-service';
import { clearSessionCookies, setSessionCookies } from '@/lib/session';

export interface AuthFormState {
  error?: string;
  errors?: CredentialErrors;
  /** Giữ lại email đã gõ khi trả lỗi (mật khẩu thì không). */
  email?: string;
}

async function authenticate(mode: 'login' | 'register', form: FormData): Promise<AuthFormState> {
  const email = String(form.get('email') ?? '');
  const result = validateCredentials({ email, password: form.get('password') }, mode);
  if (!result.ok) return { errors: result.errors, email };

  try {
    const tokens = await (mode === 'login' ? authService.login : authService.register)(result.value);
    await setSessionCookies(tokens);
  } catch (err) {
    return { error: authService.describeAuthError(err), email };
  }
  // redirect() ném lỗi điều hướng — phải nằm ngoài try/catch ở trên.
  redirect(safeNext(form.get('next')));
}

export async function loginAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  return authenticate('login', form);
}

export async function registerAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  return authenticate('register', form);
}

/**
 * Chỉ xoá cookie phía trình duyệt: auth-service chưa có endpoint thu hồi token, nên
 * refresh token đã lộ vẫn dùng được tới khi hết hạn.
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookies();
  redirect('/');
}

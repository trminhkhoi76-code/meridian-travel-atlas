'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { LOGIN_PATH, PASSWORD_MIN_LENGTH, REGISTER_PATH } from '@/lib/auth';
import type { CredentialField } from '@/lib/auth';
import { loginAction, registerAction } from '@/app/tai-khoan/actions';
import type { AuthFormState } from '@/app/tai-khoan/actions';

interface Props {
  mode: 'login' | 'register';
  /** Đường dẫn quay về sau khi đăng nhập — server action kiểm lại bằng safeNext(). */
  next?: string;
}

/**
 * Form đăng nhập / đăng ký, gửi bằng server action nên chạy được cả khi chưa có JS.
 *
 * Không disable ô nhập khi đang gửi: React đặt trạng thái pending trước khi dựng
 * FormData, và ô bị disable không được gửi lên.
 */
export default function AuthForm({ mode, next }: Props) {
  const login = mode === 'login';
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(login ? loginAction : registerAction, {});
  const errors = state.errors ?? {};
  const switchHref = (login ? REGISTER_PATH : LOGIN_PATH) + (next ? `?next=${encodeURIComponent(next)}` : '');

  const aria = (f: CredentialField) => ({
    id: `auth-${f}`,
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': errors[f] ? `auth-${f}-err` : undefined,
  });

  return (
    <div className="narrow">
      <div className="panel panel-pad enter">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title-m" style={{ fontSize: 32 }}>
            {login ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p className="muted">
            {login
              ? 'Đăng nhập để điền sẵn liên hệ khi gửi yêu cầu đặt chỗ.'
              : 'Một tài khoản cho mọi hành trình — email dùng để nhân viên liên hệ xác nhận.'}
          </p>
        </div>

        {state.error && (
          <p className="formerr" role="alert">
            {state.error}
          </p>
        )}

        <form className="form" action={formAction} noValidate aria-busy={pending}>
          <input type="hidden" name="next" value={next ?? ''} />
          <div className={'field' + (errors.email ? ' invalid' : '')}>
            <label htmlFor="auth-email">Email</label>
            <input
              {...aria('email')}
              key={state.email}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              defaultValue={state.email}
              maxLength={255}
              required
            />
            {errors.email && (
              <p className="ferr" id="auth-email-err">
                {errors.email}
              </p>
            )}
          </div>
          <div className={'field' + (errors.password ? ' invalid' : '')}>
            <label htmlFor="auth-password">{login ? 'Mật khẩu' : `Mật khẩu · ít nhất ${PASSWORD_MIN_LENGTH} ký tự`}</label>
            <input {...aria('password')} name="password" type="password" autoComplete={login ? 'current-password' : 'new-password'} required />
            {errors.password && (
              <p className="ferr" id="auth-password-err">
                {errors.password}
              </p>
            )}
          </div>
          <button type="submit" className="btn-p btn-lg press" disabled={pending} aria-busy={pending}>
            {pending ? 'Đang xử lý…' : login ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
      <p className="switch-line">
        {login ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <Link href={switchHref}>{login ? 'Tạo tài khoản' : 'Đăng nhập'}</Link>
      </p>
    </div>
  );
}

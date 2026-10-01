'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { hrefOf } from '@/lib/catalog';
import { LOGIN_PATH, PASSWORD_MIN_LENGTH, REGISTER_PATH } from '@/lib/auth';
import type { CredentialField } from '@/lib/auth';
import { loginAction, registerAction } from '@/app/tai-khoan/actions';
import type { AuthFormState } from '@/app/tai-khoan/actions';

const FORM_ID = 'auth-form';

interface Props {
  mode: 'login' | 'register';
  /** Đường dẫn quay về sau khi đăng nhập — server action kiểm lại bằng safeNext(). */
  next?: string;
}

/**
 * Form đăng nhập / đăng ký, gửi bằng server action nên chạy được cả khi chưa có JS.
 * Nút gửi nằm ở `.pfoot`, nối với form qua `form=` như ItineraryPanel.
 *
 * Không disable ô nhập khi đang gửi: React đặt trạng thái pending trước khi dựng
 * FormData, và ô bị disable không được gửi lên.
 */
export default function AuthForm({ mode, next }: Props) {
  const login = mode === 'login';
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    login ? loginAction : registerAction,
    {},
  );
  const errors = state.errors ?? {};
  const switchHref = (login ? REGISTER_PATH : LOGIN_PATH) + (next ? `?next=${encodeURIComponent(next)}` : '');

  const aria = (f: CredentialField) => ({
    id: `auth-${f}`,
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': errors[f] ? `auth-${f}-err` : undefined,
  });

  return (
    <>
      <div className="pbody">
        <Link href={hrefOf.world()} className="back">
          ← Thế giới
        </Link>
        <h1 className="ptitle sm">{login ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p className="pdesc">
          {login
            ? 'Đăng nhập để điền sẵn liên hệ khi gửi yêu cầu đặt chỗ.'
            : 'Một tài khoản cho mọi hành trình — email dùng để chuyên viên liên hệ xác nhận.'}
        </p>

        {state.error && (
          <p className="formerr" role="alert">
            {state.error}
          </p>
        )}

        <form id={FORM_ID} className="bform" action={formAction} noValidate aria-busy={pending}>
          <input type="hidden" name="next" value={next ?? ''} />

          <div className={'field' + (errors.email ? ' invalid' : '')}>
            <label htmlFor="auth-email" className="mono">
              Email
            </label>
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
            <label htmlFor="auth-password" className="mono">
              {login ? 'Mật khẩu' : `Mật khẩu · ít nhất ${PASSWORD_MIN_LENGTH} ký tự`}
            </label>
            <input
              {...aria('password')}
              name="password"
              type="password"
              autoComplete={login ? 'current-password' : 'new-password'}
              required
            />
            {errors.password && (
              <p className="ferr" id="auth-password-err">
                {errors.password}
              </p>
            )}
          </div>
        </form>

        <p className="authswitch">
          {login ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <Link href={switchHref}>{login ? 'Tạo tài khoản' : 'Đăng nhập'}</Link>
        </p>
      </div>

      <div className="pfoot">
        <div className="amt">
          <span className="mono">{login ? 'Chào mừng trở lại' : 'Miễn phí · không cần thẻ'}</span>
        </div>
        <button type="submit" form={FORM_ID} className="btn" disabled={pending} aria-busy={pending}>
          {pending ? 'Đang xử lý…' : login ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </div>
    </>
  );
}

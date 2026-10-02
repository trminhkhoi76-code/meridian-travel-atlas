'use client';

import type { FormEvent, ReactNode } from 'react';
import { DEPARTURES } from '@/lib/catalog';
import type { BookingErrors, BookingField } from '@/lib/booking';
import { FLEXIBLE_DEPARTURE, GUEST_LIMIT } from '@/lib/booking';

export interface BookingDraft {
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  departure: string;
  note: string;
  /** Bẫy bot — người thật không thấy ô này. */
  website: string;
}

export const EMPTY_DRAFT: BookingDraft = {
  name: '',
  email: '',
  phone: '',
  adults: 2,
  children: 0,
  departure: DEPARTURES[0].date,
  note: '',
  website: '',
};

/** Thứ tự các trường trên form — dùng để đưa focus tới lỗi đầu tiên. */
export const FIELD_ORDER: BookingField[] = ['name', 'email', 'phone', 'adults', 'children', 'departure', 'note'];
export const fieldId = (f: BookingField) => `bk-${f}`;

interface Props {
  id: string;
  draft: BookingDraft;
  errors: BookingErrors;
  disabled: boolean;
  onChange: <K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function Field({ field, label, error, children }: { field: BookingField; label: string; error?: string; children: ReactNode }) {
  return (
    <div className={'field' + (error ? ' invalid' : '')}>
      <label htmlFor={fieldId(field)}>{label}</label>
      {children}
      {error && (
        <p className="ferr" id={`${fieldId(field)}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

function Stepper({
  field,
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  field: 'adults' | 'children';
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <span className="lab" id={`${fieldId(field)}-lab`}>
        {label}
      </span>
      <div className="stepper" role="group" aria-labelledby={`${fieldId(field)}-lab`}>
        <button
          type="button"
          id={fieldId(field)}
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= min}
          aria-label={`Bớt ${label.toLowerCase()}`}
        >
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={`Thêm ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}

/** Form liên hệ của yêu cầu đặt chỗ. Nút gửi nằm ngoài form (khung tóm tắt), nối qua `form={id}`. */
export default function BookingForm({ id, draft, errors, disabled, onChange, onSubmit }: Props) {
  const aria = (f: BookingField) => ({
    id: fieldId(f),
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': errors[f] ? `${fieldId(f)}-err` : undefined,
  });

  const departures = [
    ...DEPARTURES.map((d) => ({ value: d.date, big: d.date, small: d.day })),
    { value: FLEXIBLE_DEPARTURE, big: 'Linh hoạt', small: 'Tư vấn thêm' },
  ];

  return (
    <form id={id} className="form" noValidate onSubmit={onSubmit}>
      <fieldset disabled={disabled}>
        <Field field="name" label="Họ và tên" error={errors.name}>
          <input {...aria('name')} name="name" autoComplete="name" value={draft.name} onChange={(e) => onChange('name', e.target.value)} maxLength={80} />
        </Field>

        <div className="pair">
          <Field field="email" label="Email" error={errors.email}>
            <input
              {...aria('email')}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={draft.email}
              onChange={(e) => onChange('email', e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field field="phone" label="Số điện thoại" error={errors.phone}>
            <input
              {...aria('phone')}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="090 123 4567"
              value={draft.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              maxLength={24}
            />
          </Field>
        </div>

        <div className="pair">
          <Stepper
            field="adults"
            label="Người lớn"
            value={draft.adults}
            min={GUEST_LIMIT.adults[0]}
            max={GUEST_LIMIT.adults[1]}
            disabled={disabled}
            onChange={(v) => onChange('adults', v)}
          />
          <Stepper
            field="children"
            label="Trẻ em"
            value={draft.children}
            min={GUEST_LIMIT.children[0]}
            max={GUEST_LIMIT.children[1]}
            disabled={disabled}
            onChange={(v) => onChange('children', v)}
          />
        </div>

        <div className={'field' + (errors.departure ? ' invalid' : '')}>
          <span className="lab" id={`${fieldId('departure')}-lab`}>
            Ngày khởi hành
          </span>
          <div className="seg" role="group" aria-labelledby={`${fieldId('departure')}-lab`}>
            {departures.map((d, i) => (
              <button
                key={d.value}
                id={i === 0 ? fieldId('departure') : undefined}
                type="button"
                className="press"
                aria-pressed={draft.departure === d.value}
                onClick={() => onChange('departure', d.value)}
              >
                <b>{d.big}</b>
                <small>{d.small}</small>
              </button>
            ))}
          </div>
          {errors.departure && <p className="ferr">{errors.departure}</p>}
        </div>

        <Field field="note" label="Ghi chú · không bắt buộc" error={errors.note}>
          <textarea
            {...aria('note')}
            name="note"
            rows={3}
            placeholder="Dị ứng thực phẩm, cần hỗ trợ đi lại, muốn phòng liền kề…"
            value={draft.note}
            onChange={(e) => onChange('note', e.target.value)}
            maxLength={1000}
          />
        </Field>

        <div className="hp" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={(e) => onChange('website', e.target.value)} />
          </label>
        </div>
      </fieldset>
    </form>
  );
}

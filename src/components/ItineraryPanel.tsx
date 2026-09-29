'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Experience } from '@/lib/catalog';
import { hrefOf } from '@/lib/catalog';
import type { BookingErrors, BookingReceipt } from '@/lib/booking';
import { BookingSubmitError, submitBooking, validateBooking } from '@/lib/booking';
import { vnd } from '@/lib/format';
import { swatch } from '@/lib/swatch';
import BookingForm, { EMPTY_DRAFT, FIELD_ORDER, fieldId } from './BookingForm';
import type { BookingDraft } from './BookingForm';
import { useItinerary } from './ItineraryProvider';

const FORM_ID = 'booking-form';

type Step = 'review' | 'form' | 'sent';

interface Sent {
  receipt: BookingReceipt;
  email: string;
  lines: Experience[];
}

function Line({ line, onRemove }: { line: Experience; onRemove?: () => void }) {
  return (
    <div className="cartrow">
      <span className="sw" style={{ background: swatch(line.cat) }} aria-hidden="true" />
      <span className="txt">
        <b>{line.title}</b>
        <small>
          {line.city.name}, {line.country.name} · {line.duration}
        </small>
      </span>
      <span className="amt">{vnd(line.price)}</span>
      {onRemove && (
        <button
          type="button"
          className="x"
          onClick={onRemove}
          aria-label={`Bỏ ${line.title} khỏi hành trình`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * Ba bước trên cùng một URL: xem lại hành trình → điền thông tin → đã gửi.
 * Nút gửi nằm ở `.pfoot`, tách khỏi <form> trong `.pbody`, nên nối với form
 * qua thuộc tính `form=` — và toàn bộ state phải ở component này.
 */
export default function ItineraryPanel() {
  const { keys, lines, total, remove, clear } = useItinerary();
  const [step, setStep] = useState<Step>('review');
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);

  const guests = draft.adults + draft.children;

  function change<K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    // Chỉ báo lỗi khi đang gõ sau lần bấm gửi đầu tiên — trước đó để khách điền yên.
    if (attempted) {
      const result = validateBooking({ ...next, items: keys });
      setErrors(result.ok ? {} : result.errors);
    }
  }

  function focusFirstError(errs: BookingErrors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) document.getElementById(fieldId(first))?.focus();
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setAttempted(true);
    setFailure(null);

    const result = validateBooking({ ...draft, items: keys });
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const receipt = await submitBooking({ ...result.value, website: draft.website });
      setSent({ receipt, email: result.value.email, lines });
      clear();
      setStep('sent');
    } catch (err) {
      const submitError =
        err instanceof BookingSubmitError
          ? err
          : new BookingSubmitError('Chưa gửi được yêu cầu. Vui lòng thử lại.');
      setErrors(submitError.errors);
      setFailure(submitError.message);
      focusFirstError(submitError.errors);
    } finally {
      setSending(false);
    }
  }

  if (step === 'sent' && sent) {
    return (
      <>
        <div className="pbody" key="sent">
          <Link href={hrefOf.world()} className="back">
            ← Thế giới
          </Link>
          <h1 className="ptitle sm">Đã gửi yêu cầu</h1>
          <p className="pdesc">
            Chuyên viên sẽ liên hệ qua <b>{sent.email}</b> trong vòng 24 giờ để xác nhận từng dòng,
            kèm phương án bay và giấy tờ cần thiết. Chưa thu bất kỳ khoản nào.
          </p>
          <div className="receipt">
            <span className="mono">Mã yêu cầu</span>
            <b>{sent.receipt.id}</b>
          </div>
          {sent.lines.map((line) => (
            <Line key={line.key} line={line} />
          ))}
          <div className="total">
            <span className="mono">Tạm tính · {sent.receipt.guests} khách</span>
            <b>{vnd(sent.receipt.estimate)}</b>
          </div>
        </div>
        <div className="pfoot">
          <div className="amt">
            <span className="mono">Giữ lại mã để tra cứu</span>
          </div>
          <Link href={hrefOf.world()} className="btn">
            Tiếp tục khám phá
          </Link>
        </div>
      </>
    );
  }

  if (step === 'form' && lines.length > 0) {
    return (
      <>
        <div className="pbody" key="form">
          <button type="button" className="back" onClick={() => setStep('review')}>
            ← Hành trình
          </button>
          <h1 className="ptitle sm">Thông tin đặt chỗ</h1>
          <p className="pdesc">
            {lines.length} trải nghiệm · {vnd(total)} mỗi khách. Để lại liên hệ, chuyên viên sẽ gọi
            lại trong 24 giờ — chưa thu bất kỳ khoản nào.
          </p>

          {failure && (
            <p className="formerr" role="alert">
              {failure}
              {errors.items && <> {errors.items}</>}
            </p>
          )}

          <BookingForm
            id={FORM_ID}
            draft={draft}
            errors={errors}
            disabled={sending}
            onChange={change}
            onSubmit={submit}
          />
        </div>

        <div className="pfoot">
          <div className="amt">
            <span className="mono">Tạm tính · {guests} khách</span>
            <b>{vnd(total * guests)}</b>
          </div>
          <button
            key="submit"
            type="submit"
            form={FORM_ID}
            className="btn"
            disabled={sending}
            aria-busy={sending}
          >
            {sending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pbody" key="review">
        <Link href={hrefOf.world()} className="back">
          ← Thế giới
        </Link>
        <h1 className="ptitle sm">Hành trình của bạn</h1>
        <p className="pdesc">
          Chưa thu bất kỳ khoản nào. Chuyên viên sẽ xác nhận từng dòng trong vòng 24 giờ, kèm phương
          án bay và giấy tờ cần thiết.
        </p>

        {lines.length === 0 ? (
          <p className="empty">
            Chưa có gì ở đây. Hãy đi sâu vào một thành phố rồi thêm một trải nghiệm.
          </p>
        ) : (
          <>
            {lines.map((line) => (
              <Line key={line.key} line={line} onRemove={() => remove(line.key)} />
            ))}
            <div className="total">
              <span className="mono">Tạm tính · {lines.length} dòng</span>
              <b>{vnd(total)}</b>
            </div>
          </>
        )}
      </div>

      {lines.length > 0 && (
        <div className="pfoot">
          <div className="amt">
            <span className="mono">Tổng cộng · mỗi khách</span>
            <b>{vnd(total)}</b>
          </div>
          {/* `key` khác nút gửi ở bước form: React flush state ngay trong lúc click, nên nếu
              tái dùng cùng một <button> thì nó đã thành type=submit trước khi trình duyệt
              chạy hành vi mặc định — và form trống bị gửi luôn. */}
          <button key="next" type="button" className="btn" onClick={() => setStep('form')}>
            Gửi yêu cầu đặt chỗ
          </button>
        </div>
      )}
    </>
  );
}

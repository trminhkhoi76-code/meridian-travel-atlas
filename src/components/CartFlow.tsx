'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Experience } from '@/lib/catalog';
import { CAT_LABEL, hrefOf } from '@/lib/catalog';
import type { BookingErrors, BookingReceipt } from '@/lib/booking';
import { BookingSubmitError, SLA_HOURS, departureLabel, submitBooking, validateBooking } from '@/lib/booking';
import { vnd } from '@/lib/format';
import * as T from '@/lib/trip';
import BookingForm, { EMPTY_DRAFT, FIELD_ORDER, fieldId } from './BookingForm';
import type { BookingDraft } from './BookingForm';
import { IconCheck, IconInfo, IconTrash } from './Icons';
import Photo from './Photo';
import { useSession } from './SessionProvider';
import { useTrip } from './TripProvider';

const FORM_ID = 'booking-form';
type Step = 'cart' | 'form' | 'sent';

interface Sent {
  receipt: BookingReceipt;
  email: string;
  lines: Experience[];
}

function StepsBar({ step }: { step: Step }) {
  const steps: Array<[Step, string]> = [
    ['cart', 'Giỏ hàng'],
    ['form', 'Thông tin liên hệ'],
    ['sent', 'Gửi yêu cầu'],
  ];
  const at = steps.findIndex(([s]) => s === step);
  return (
    <ol className="stepsbar" aria-label="Các bước đặt chỗ">
      {steps.map(([s, label], i) => (
        <li key={s} style={{ display: 'contents' }}>
          {i > 0 && <span className="bar" aria-hidden="true" />}
          <span
            className={i < at ? 'done' : undefined}
            aria-current={i === at ? 'step' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: i === at ? 'var(--ink)' : 'var(--ink-2)', fontWeight: i === at ? 600 : 400 }}
          >
            <span className="n" style={i <= at ? { background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff' } : undefined}>
              {i < at ? <IconCheck size={14} /> : i + 1}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Ba bước trên cùng một URL: giỏ → thông tin liên hệ → đã gửi. Form ở cột chính,
 * nút gửi ở khung tóm tắt (và thanh dưới cùng trên điện thoại), nối qua `form=`.
 *
 * Nút "Tiếp tục" của bước giỏ và nút gửi của bước form mang `key` khác nhau có chủ
 * ý: React 19 flush state ngay trong click, nên nếu tái dùng cùng một <button> thì
 * nó đã thành type=submit trước khi trình duyệt chạy hành vi mặc định — và form
 * trống bị gửi luôn.
 */
export default function CartFlow() {
  const { ready, trip, cartLines, cartTotal, removeFromCart, update } = useTrip();
  const { user: session } = useSession();
  const [step, setStep] = useState<Step>('cart');
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [leaving, setLeaving] = useState<string[]>([]);

  const guests = trip.adults + trip.children;
  const plan = T.schedule(trip.stops);
  const whenOf = (e: Experience) => plan.stops.find((s) => s.stop.items.includes(e.key))?.label;
  const tripExps = trip.stops.flatMap((s) => s.items.filter(T.isExperienceKey));

  function openForm() {
    // Số khách và ngày đi lấy từ hành trình; đã đăng nhập thì điền sẵn email (không đè email khách đã gõ).
    setDraft((d) => ({
      ...d,
      adults: trip.adults,
      children: trip.children,
      departure: trip.departure,
      email: d.email || session?.email || '',
    }));
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function change<K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (field === 'adults' || field === 'children') update((s) => T.setGuests(s, next.adults, next.children));
    if (field === 'departure') update((s) => T.setDeparture(s, next.departure));
    // Chỉ báo lỗi khi đang gõ sau lần bấm gửi đầu tiên — trước đó để khách điền yên.
    if (attempted) {
      const result = validateBooking({ ...next, items: trip.cart });
      setErrors(result.ok ? {} : result.errors);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setAttempted(true);
    setFailure(null);
    const result = validateBooking({ ...draft, items: trip.cart });
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const receipt = await submitBooking({ ...result.value, website: draft.website });
      setSent({ receipt, email: result.value.email, lines: cartLines });
      update((s) => ({ ...s, cart: [] }));
      setStep('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const submitError = err instanceof BookingSubmitError ? err : new BookingSubmitError('Chưa gửi được yêu cầu. Vui lòng thử lại.');
      setErrors(submitError.errors);
      setFailure(submitError.message);
      const first = FIELD_ORDER.find((f) => submitError.errors[f]);
      if (first) document.getElementById(fieldId(first))?.focus();
    } finally {
      setSending(false);
    }
  }

  if (step === 'sent' && sent) {
    return (
      <>
        <StepsBar step="sent" />
        <h1 className="title-m cart-h1">Đã gửi yêu cầu</h1>
        <div className="cart-grid">
          <div className="cart-main panel panel-pad pop">
            <p className="lede" style={{ fontSize: 16 }}>
              Nhân viên sẽ liên hệ qua <b>{sent.email}</b> trong vòng {SLA_HOURS} giờ để xác nhận từng trải nghiệm, kèm phương án
              bay và giấy tờ cần thiết. Chưa thu bất kỳ khoản nào.
            </p>
            <div className="receipt">
              <span>Mã yêu cầu — giữ lại để tra cứu</span>
              <b>{sent.receipt.id}</b>
            </div>
            <dl className="sum">
              {sent.lines.map((l) => (
                <div key={l.key}>
                  <dt>
                    {l.title} · {l.city.name}
                  </dt>
                  <dd>{vnd(l.price)}</dd>
                </div>
              ))}
              <div className="total">
                <dt>Tạm tính · {sent.receipt.guests} khách</dt>
                <dd>{vnd(sent.receipt.estimate)}</dd>
              </div>
            </dl>
            <div className="actions">
              <Link href="/" className="btn-p press">
                Tiếp tục khám phá
              </Link>
              <Link href="/hanh-trinh" className="btn-s press">
                Xem hành trình
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!ready) {
    return (
      <>
        <StepsBar step="cart" />
        <h1 className="title-m cart-h1">Giỏ hàng</h1>
        <p className="note" aria-busy="true">
          Đang mở giỏ hàng…
        </p>
      </>
    );
  }

  if (cartLines.length === 0) {
    return (
      <>
        <StepsBar step="cart" />
        <h1 className="title-m cart-h1">Giỏ hàng</h1>
        <div className="empty pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, borderStyle: 'solid' }}>
          <b style={{ fontSize: 20, color: 'var(--ink)' }}>Giỏ hàng đang trống</b>
          <span style={{ maxWidth: 420 }}>Thêm trải nghiệm từ trang thành phố, hoặc đặt cả một hành trình bạn đã lưu.</span>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Link href="/" className="btn-p press">
              Khám phá điểm đến
            </Link>
            {tripExps.length > 0 && (
              <button type="button" className="btn-s press" onClick={() => update(T.bookAll)}>
                Đặt cả hành trình ({tripExps.length})
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  const total = cartTotal * guests;
  const summary = (cta: React.ReactNode) => (
    <div className="panel panel-pad panel-float">
      <h2 className="h3" style={{ fontSize: 18 }}>
        Tóm tắt
      </h2>
      <dl className="sum">
        <div>
          <dt>{cartLines.length} trải nghiệm · mỗi khách</dt>
          <dd>{vnd(cartTotal)}</dd>
        </div>
        <div>
          <dt>Số khách</dt>
          <dd>{guests}</dd>
        </div>
        <div>
          <dt>Khởi hành</dt>
          <dd>{departureLabel(trip.departure)}</dd>
        </div>
        <div className="total">
          <dt>Tạm tính</dt>
          <dd>
            <span className="flash" key={total}>
              {vnd(total)}
            </span>
          </dd>
        </div>
      </dl>
      {cta}
      <ul className="checks">
        <li>
          <IconCheck size={16} />
          Chưa trừ tiền ở bước này
        </li>
        <li>
          <IconCheck size={16} />
          Nhân viên xác nhận chỗ trong {SLA_HOURS} giờ
        </li>
        <li>
          <IconCheck size={16} />
          Thanh toán sau khi nhận xác nhận
        </li>
      </ul>
    </div>
  );

  const nextBtn = (
    <button key="next" type="button" className="btn-p btn-lg press" onClick={openForm}>
      Tiếp tục: thông tin liên hệ
    </button>
  );
  const submitBtn = (
    <button key="submit" type="submit" form={FORM_ID} className="btn-p btn-lg press" disabled={sending} aria-busy={sending}>
      {sending ? 'Đang gửi…' : 'Gửi yêu cầu đặt chỗ'}
    </button>
  );

  return (
    <>
      <StepsBar step={step} />
      <h1 className="title-m cart-h1">{step === 'cart' ? `Giỏ hàng (${cartLines.length})` : 'Thông tin liên hệ'}</h1>
      <div className="cart-grid">
        <div className="cart-main">
          {step === 'cart' ? (
            <section className="panel cart-box enter" aria-labelledby="h-trip">
              <header>
                <div>
                  <h2 id="h-trip">{trip.name}</h2>
                  <span>
                    {departureLabel(trip.departure) === 'Linh hoạt' ? 'Ngày đi linh hoạt' : `Khởi hành ${departureLabel(trip.departure)}`} ·{' '}
                    {guests} khách
                  </span>
                </div>
                <Link href="/hanh-trinh">Mở hành trình</Link>
              </header>
              <ul>
                {cartLines.map((l, i) => (
                  <li
                    key={l.key}
                    className={'cline' + (leaving.includes(l.key) ? ' leaving' : ' cardin')}
                    style={{ animationDelay: leaving.includes(l.key) ? '0ms' : `${120 + i * 70}ms` }}
                  >
                    <Photo label={l.place.name} seed={l.key} caption={false} />
                    <div>
                      <span className="k">
                        {CAT_LABEL[l.cat]} · {l.city.name}
                      </span>
                      <Link className="t" href={hrefOf.experience(l)}>
                        {l.title}
                      </Link>
                      <small>{[whenOf(l), l.duration].filter(Boolean).join(' · ')}</small>
                    </div>
                    <b>{vnd(l.price)}</b>
                    <button
                      type="button"
                      className="icon-btn press"
                      aria-label={`Bỏ ${l.title} khỏi giỏ`}
                      disabled={leaving.includes(l.key)}
                      onClick={() => {
                        setLeaving((x) => [...x, l.key]);
                        setTimeout(() => {
                          removeFromCart(l.key);
                          setLeaving((x) => x.filter((k) => k !== l.key));
                        }, 340);
                      }}
                    >
                      <IconTrash size={18} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="cart-foot info" style={{ borderRadius: 0, background: 'transparent' }}>
                <IconInfo size={18} />
                <span>Vé máy bay giữa các thành phố chưa có trong giỏ. Nhân viên sẽ gợi ý chuyến bay khi xác nhận.</span>
              </div>
            </section>
          ) : (
            <section className="panel panel-pad enter" aria-label="Thông tin liên hệ">
              <p className="muted">
                {cartLines.length} trải nghiệm · {vnd(cartTotal)} mỗi khách. Để lại liên hệ, nhân viên sẽ gọi lại trong {SLA_HOURS} giờ — chưa thu
                bất kỳ khoản nào.
              </p>
              {failure && (
                <p className="formerr" role="alert">
                  {failure}
                  {errors.items && <> {errors.items}</>}
                </p>
              )}
              <BookingForm id={FORM_ID} draft={draft} errors={errors} disabled={sending} onChange={change} onSubmit={submit} />
              <button type="button" className="linklike" style={{ alignSelf: 'flex-start' }} onClick={() => setStep('cart')}>
                ← Quay lại giỏ hàng
              </button>
            </section>
          )}
        </div>
        <aside className="cart-side" aria-label="Tóm tắt đơn">
          {summary(step === 'cart' ? nextBtn : submitBtn)}
        </aside>
      </div>
      <div className="mobile-pay">
        <div>
          <span>
            Tạm tính · {cartLines.length} trải nghiệm
            <b>{vnd(total)}</b>
          </span>
          <small>
            Chưa trừ tiền
            <br />
            Chưa gồm vé bay
          </small>
        </div>
        {step === 'cart' ? (
          <button key="m-next" type="button" className="btn-p btn-lg press" onClick={openForm}>
            Tiếp tục: thông tin liên hệ
          </button>
        ) : (
          <button key="m-submit" type="submit" form={FORM_ID} className="btn-p btn-lg press" disabled={sending} aria-busy={sending}>
            {sending ? 'Đang gửi…' : 'Gửi yêu cầu đặt chỗ'}
          </button>
        )}
      </div>
    </>
  );
}

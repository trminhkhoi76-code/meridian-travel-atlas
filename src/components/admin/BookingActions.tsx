'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/admin/yeu-cau/[id]/actions';
import { updateBookingAction } from '@/app/admin/yeu-cau/[id]/actions';
import type { BookingStatus } from '@/lib/booking';
import { NEXT_STATUS, STATUS_LABEL } from '@/lib/booking';

const VERB: Partial<Record<BookingStatus, string>> = {
  CONTACTED: 'Đánh dấu đã liên hệ',
  CONFIRMED: 'Xác nhận đặt chỗ',
  CANCELLED: 'Huỷ yêu cầu',
};

type Pick = (s: BookingStatus | '') => void;

/**
 * Nút đang bị `disabled` (lúc pending) thì trình duyệt bỏ name/value của nó khỏi
 * FormData — mà React đã bật pending trước khi dựng FormData. Nên lựa chọn được
 * ghi thẳng vào input ẩn `intent` ngay trong onClick. name/value trên nút vẫn giữ
 * để form chạy được khi không có JS.
 *
 * "Huỷ yêu cầu" không submit: nó chỉ mở hộp thoại xác nhận (`ConfirmCancel`).
 */
function Buttons({
  status,
  pick,
  askCancel,
  cancelRef,
}: {
  status: BookingStatus;
  pick: Pick;
  askCancel: () => void;
  cancelRef: Ref<HTMLButtonElement>;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="bact-btns">
      {NEXT_STATUS[status].map((s) =>
        s === 'CANCELLED' ? (
          <button
            key={s}
            ref={cancelRef}
            type="button"
            className="btn-s btn-sm bact-danger"
            aria-haspopup="dialog"
            disabled={pending}
            onClick={askCancel}
          >
            {VERB.CANCELLED}…
          </button>
        ) : (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            className="btn-p btn-sm"
            disabled={pending}
            onClick={() => pick(s)}
          >
            {status === 'CANCELLED' && s === 'CONTACTED' ? 'Mở lại yêu cầu' : (VERB[s] ?? STATUS_LABEL[s])}
          </button>
        ),
      )}
      <button type="submit" className="btn-s btn-sm" disabled={pending} onClick={() => pick('')}>
        Chỉ lưu ghi chú
      </button>
    </div>
  );
}

/** Nút trong hộp thoại — phải nằm trong <form> để đọc được trạng thái pending. */
function ConfirmButtons({ keepRef, close, confirm }: { keepRef: Ref<HTMLButtonElement>; close: () => void; confirm: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="dlg-foot">
      <button ref={keepRef} type="button" className="btn-s btn-sm" disabled={pending} onClick={close}>
        Không, giữ yêu cầu
      </button>
      <button
        type="submit"
        name="status"
        value="CANCELLED"
        className="btn-sm bact-danger-solid"
        disabled={pending}
        aria-busy={pending}
        onClick={confirm}
      >
        {pending ? 'Đang huỷ…' : 'Huỷ yêu cầu'}
      </button>
    </div>
  );
}

function PendingGuard({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => onChange(pending), [pending, onChange]);
  return null;
}

export default function BookingActions({ id, status, customer }: { id: string; status: BookingStatus; customer: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateBookingAction, { ok: null, version: 0 });
  const intent = useRef<HTMLInputElement>(null);
  const confirmed = useRef<HTMLInputElement>(null);
  const note = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const message = useRef<HTMLParagraphElement>(null);
  const pending = useRef(false);
  /** Kết quả lúc mở hộp thoại: kết quả nào khác cái này là của lần huỷ trong hộp thoại. */
  const [asking, setAsking] = useState<ActionState | null>(null);
  const [withNote, setWithNote] = useState(false);

  const pick: Pick = (s) => {
    if (intent.current) intent.current.value = s;
  };

  function askCancel() {
    setAsking(state);
    setWithNote(Boolean(note.current?.value.trim()));
    dialog.current?.showModal();
    // Mặc định chọn lối thoát an toàn: Enter/Space ngay lập tức không huỷ.
    keep.current?.focus();
  }

  const answered = asking !== null && state !== asking;

  // Huỷ xong: đóng hộp thoại, đưa focus tới thông báo kết quả (nút mở hộp thoại
  // đã biến mất vì trạng thái đổi). Lỗi thì giữ hộp thoại mở, báo lỗi trong đó.
  useEffect(() => {
    if (!answered || !state.ok) return;
    dialog.current?.close();
    message.current?.focus();
  }, [answered, state]);

  return (
    <form action={action} className="bact">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" ref={intent} defaultValue="" />
      {/* Chỉ nút xác nhận trong hộp thoại ghi vào đây; server từ chối huỷ nếu thiếu. */}
      <input type="hidden" name="confirm" ref={confirmed} defaultValue="" />
      <PendingGuard onChange={(p) => (pending.current = p)} />
      <label>
        <span className="kicker">Ghi chú nội bộ · khách không thấy</span>
        <textarea
          key={state.version}
          ref={note}
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Đã gọi lúc 10:30, khách hẹn chuyển cọc…"
        />
      </label>
      <Buttons status={status} pick={pick} askCancel={askCancel} cancelRef={opener} />
      {state.message && (asking === null || (answered && state.ok)) && (
        <p ref={message} tabIndex={-1} className={state.ok ? 'bact-ok' : 'formerr'} role="status">
          {state.message}
        </p>
      )}

      <dialog
        ref={dialog}
        className="dlg bact-dlg"
        aria-labelledby="bact-dlg-title"
        aria-describedby="bact-dlg-desc"
        onCancel={(e) => {
          // Đang gửi thì Escape không đóng — kết quả sẽ hiện ngay trong hộp thoại.
          if (pending.current) e.preventDefault();
        }}
        onClose={() => {
          setAsking(null);
          if (confirmed.current) confirmed.current.value = '';
          pick('');
          if (document.activeElement === document.body) (opener.current ?? message.current)?.focus();
        }}
      >
        <div className="dlg-head">
          <h2 id="bact-dlg-title">Huỷ yêu cầu này?</h2>
        </div>
        <div className="bact-dlg-body">
          <dl className="adl">
            <div>
              <dt className="kicker">Mã yêu cầu</dt>
              <dd className="mono-id">{id}</dd>
            </div>
            <div>
              <dt className="kicker">Khách hàng</dt>
              <dd>{customer}</dd>
            </div>
            <div className="wide">
              <dt className="kicker">Trạng thái</dt>
              <dd>
                {STATUS_LABEL[status]} → <b>{STATUS_LABEL.CANCELLED}</b>
              </dd>
            </div>
          </dl>
          <p id="bact-dlg-desc">
            Yêu cầu sẽ chuyển sang “{STATUS_LABEL.CANCELLED}”, được ghi vào lịch sử và không còn tính trong các số liệu
            đang xử lý. Khách không nhận thông báo tự động. Sau này vẫn mở lại được, nhưng về “
            {STATUS_LABEL.CONTACTED}” chứ không về trạng thái hiện tại.
          </p>
          {withNote && <p className="anote">Ghi chú đang nhập sẽ được lưu kèm lần huỷ này.</p>}
          {answered && !state.ok && state.message && (
            <p className="formerr" role="alert">
              Chưa huỷ được: {state.message} Yêu cầu vẫn giữ nguyên trạng thái.
            </p>
          )}
        </div>
        <ConfirmButtons
          keepRef={keep}
          close={() => dialog.current?.close()}
          confirm={() => {
            pick('CANCELLED');
            if (confirmed.current) confirmed.current.value = id;
          }}
        />
      </dialog>
    </form>
  );
}

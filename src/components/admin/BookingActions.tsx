'use client';

import { useActionState, useRef } from 'react';
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

/**
 * Nút đang bị `disabled` (lúc pending) thì trình duyệt bỏ name/value của nó khỏi
 * FormData — mà React đã bật pending trước khi dựng FormData. Nên lựa chọn được
 * ghi thẳng vào input ẩn `intent` ngay trong onClick. name/value trên nút vẫn giữ
 * để form chạy được khi không có JS.
 */
function Buttons({ status, pick }: { status: BookingStatus; pick: (s: BookingStatus | '') => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="bact-btns">
      {NEXT_STATUS[status].map((s) => (
        <button
          key={s}
          type="submit"
          name="status"
          value={s}
          className={s === 'CANCELLED' ? 'btn-s btn-sm' : 'btn-p btn-sm'}
          disabled={pending}
          onClick={() => pick(s)}
        >
          {status === 'CANCELLED' && s === 'CONTACTED' ? 'Mở lại yêu cầu' : (VERB[s] ?? STATUS_LABEL[s])}
        </button>
      ))}
      <button type="submit" className="btn-s btn-sm" disabled={pending} onClick={() => pick('')}>
        Chỉ lưu ghi chú
      </button>
    </div>
  );
}

export default function BookingActions({ id, status }: { id: string; status: BookingStatus }) {
  const [state, action] = useActionState<ActionState, FormData>(updateBookingAction, { ok: null, version: 0 });
  const intent = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="bact">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" ref={intent} defaultValue="" />
      <label>
        <span className="kicker">Ghi chú nội bộ · khách không thấy</span>
        <textarea
          key={state.version}
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Đã gọi lúc 10:30, khách hẹn chuyển cọc…"
        />
      </label>
      <Buttons
        status={status}
        pick={(s) => {
          if (intent.current) intent.current.value = s;
        }}
      />
      {state.message && (
        <p className={state.ok ? 'bact-ok' : 'formerr'} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

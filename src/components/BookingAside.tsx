'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEPARTURES } from '@/lib/catalog';
import { GUEST_LIMIT } from '@/lib/booking';
import { vnd } from '@/lib/format';
import { setDeparture, setGuests } from '@/lib/trip';
import { useCatalog } from './CatalogProvider';
import { IconBag, IconCheck, IconPlus } from './Icons';
import { useTrip } from './TripProvider';

/**
 * Khung đặt chỗ ở trang trải nghiệm. Ngày đi và số khách là của cả chuyến (lưu
 * trong hành trình), nên đổi ở đây thì giỏ hàng và form gửi yêu cầu cũng đổi theo.
 * Giá là giá mỗi khách — đúng như server tính tạm tính (giá × số khách).
 */
export default function BookingAside({ experienceKey }: { experienceKey: string }) {
  const { byKey } = useCatalog();
  const { trip, ready, update, addToCart, inCart, inTrip, toggleSaved } = useTrip();
  const e = byKey.get(experienceKey)!;
  const [justAdded, setJustAdded] = useState(0);

  const departure = ready && DEPARTURES.some((d) => d.date === trip.departure) ? trip.departure : DEPARTURES[0].date;
  const adults = ready ? trip.adults : 2;
  const added = ready && inCart(e.key);
  const saved = ready && inTrip(e.key);
  const [aMin, aMax] = GUEST_LIMIT.adults;

  return (
    <aside className="side-4 enter d2" aria-label="Đặt chỗ">
      <div className="panel panel-float book">
        <div className="amount">
          <span>Giá mỗi khách</span>
          <b>{vnd(e.price)}</b>
        </div>
        <fieldset>
          <legend>Chọn ngày khởi hành</legend>
          {DEPARTURES.map((d) => {
            const on = d.date === departure;
            return (
              <button
                key={d.date}
                type="button"
                className="dateopt press"
                aria-pressed={on}
                onClick={() => update((s) => setDeparture(s, d.date))}
              >
                <span>
                  <b>{d.date}</b>
                  <small>{d.day}</small>
                </span>
                <em>{on ? 'Đã chọn' : ''}</em>
              </button>
            );
          })}
        </fieldset>
        <div className="guests">
          <span>
            <b>{adults} khách</b>
            <small>Tạm tính {vnd(e.price * (adults + (ready ? trip.children : 0)))}</small>
          </span>
          <div className="stepper compact" role="group" aria-label="Số người lớn">
            <button type="button" aria-label="Bớt một khách" disabled={adults <= aMin} onClick={() => update((s) => setGuests(s, s.adults - 1, s.children))}>
              −
            </button>
            <output aria-live="polite">{adults}</output>
            <button type="button" aria-label="Thêm một khách" disabled={adults >= aMax} onClick={() => update((s) => setGuests(s, s.adults + 1, s.children))}>
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {added ? (
            <Link href="/gio-hang" className={'btn-p btn-lg addbtn press' + (justAdded ? ' done' : '')}>
              <IconCheck size={20} />
              Đã có trong giỏ · Xem giỏ
              {justAdded > 0 && (
                <span className="plus1" key={justAdded} aria-hidden="true">
                  +1
                </span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              className="btn-p btn-lg addbtn press"
              onClick={() => {
                addToCart(e, { quiet: true });
                setJustAdded((n) => n + 1);
              }}
            >
              <IconBag size={20} />
              Thêm vào giỏ
            </button>
          )}
          <button
            type="button"
            className="btn-s btn-lg press"
            aria-pressed={saved}
            onClick={() => toggleSaved(e.key, e.title)}
          >
            {saved ? <IconCheck size={18} /> : <IconPlus size={18} />}
            {saved ? 'Đã có trong hành trình' : 'Thêm vào hành trình'}
          </button>
        </div>
        <p className="note">Chưa trừ tiền. Nhân viên xác nhận chỗ trước, bạn thanh toán sau khi nhận xác nhận.</p>
      </div>
      {justAdded > 0 && added && (
        <div className="inline-toast" role="status" key={justAdded}>
          <IconCheck size={20} />
          <span>Đã thêm vào giỏ · khởi hành {departure}</span>
          <Link href="/gio-hang">Xem giỏ</Link>
        </div>
      )}
    </aside>
  );
}

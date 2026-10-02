'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { City, Experience, Place } from '@/lib/catalog';
import { CAT_LABEL, DEPARTURES, distanceKm, hrefOf } from '@/lib/catalog';
import { FLEXIBLE_DEPARTURE } from '@/lib/booking';
import { kmLabel, vnd } from '@/lib/format';
import * as T from '@/lib/trip';
import { useCatalog } from './CatalogProvider';
import { IconBag, IconCalendar, IconClose, IconDown, IconPencil, IconPlane, IconTrash, IconUp } from './Icons';
import Photo from './Photo';
import SampleTripButton from './SampleTripButton';
import TripMap from './TripMap';
import { useTrip } from './TripProvider';

type Item = { kind: 'e'; e: Experience } | { kind: 'p'; p: Place };

/** Trình lập hành trình — chia theo ngày, có chặng di chuyển, bản đồ tuyến và tóm tắt chi phí. */
export default function TripPlanner() {
  const router = useRouter();
  const { countries, cities, byKey, places } = useCatalog();
  const { ready, trip, update, inCart, addToCart, notify } = useTrip();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [pickCity, setPickCity] = useState('');

  if (!ready) {
    return (
      <div className="trip-head" aria-busy="true">
        <div>
          <span className="note">Đang mở hành trình…</span>
        </div>
      </div>
    );
  }

  const plan = T.schedule(trip.stops);
  const stopCities = trip.stops.map((s) => cities.get(s.city)!).filter(Boolean);
  const resolve = (key: string): Item | null => {
    const e = byKey.get(key);
    if (e) return { kind: 'e', e };
    const p = places.get(key);
    return p ? { kind: 'p', p } : null;
  };
  const allItems = trip.stops.flatMap((s) => s.items.map(resolve)).filter((x): x is Item => Boolean(x));
  const exps = allItems.flatMap((x) => (x.kind === 'e' ? [x.e] : []));
  const free = allItems.filter((x) => x.kind === 'p').length;
  const perGuest = exps.reduce((n, e) => n + e.price, 0);
  const guests = trip.adults + trip.children;
  const inCartCount = exps.filter((e) => inCart(e.key)).length;

  const header = (
    <header className="trip-head enter">
      <div>
        <span className="note">Hành trình của tôi · lưu trên trình duyệt này</span>
        <div className="trip-title">
          {editing ? (
            <input
              aria-label="Tên hành trình"
              autoFocus
              maxLength={80}
              defaultValue={trip.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                update((s) => ({ ...s, name: name || T.DEFAULT_TRIP_NAME }));
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
          ) : (
            <>
              <h1 className="title-m">{trip.name}</h1>
              <button type="button" className="icon-btn press" aria-label="Đổi tên hành trình" onClick={() => setEditing(true)}>
                <IconPencil size={18} />
              </button>
            </>
          )}
        </div>
        <div className="chips-info">
          <label>
            <IconCalendar size={15} />
            <span className="sr-only">Ngày khởi hành</span>
            <select
              value={trip.departure}
              onChange={(e) => update((s) => T.setDeparture(s, e.target.value))}
              style={{ border: 0, background: 'transparent', padding: 0, fontSize: 13 }}
            >
              {DEPARTURES.map((d) => (
                <option key={d.date} value={d.date}>
                  Khởi hành {d.date}
                </option>
              ))}
              <option value={FLEXIBLE_DEPARTURE}>Ngày đi linh hoạt</option>
            </select>
          </label>
          {plan.totalDays > 0 && <span>{plan.totalDays} ngày</span>}
          <span>{guests} khách</span>
          <span>{stopCities.length} thành phố</span>
        </div>
      </div>
    </header>
  );

  if (trip.stops.length === 0) {
    return (
      <>
        {header}
        <div className="empty pop">
          <p>
            <b>Hành trình đang trống.</b>
          </p>
          <p style={{ marginTop: 8 }}>
            Bấm “Lưu” ở thành phố, địa điểm hay trải nghiệm để thêm vào đây — hoặc bắt đầu từ một hành trình mẫu:
          </p>
          <div className="actions" style={{ justifyContent: 'center', marginTop: 16 }}>
            {countries.map((c) => (
              <SampleTripButton key={c.key} countryKey={c.key} className="pill press">
                {c.name}
              </SampleTripButton>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link href="/" className="btn-p press">
              Khám phá điểm đến
            </Link>
          </p>
        </div>
      </>
    );
  }

  const addable = (city: City, have: string[]) => [
    ...city.experiences.filter((e) => !have.includes(e.key)).map((e) => ({ key: e.key, label: e.title, meta: vnd(e.price), e })),
    ...city.places
      .filter((p) => p.experiences.length === 0 && !have.includes(p.key))
      .map((p) => ({ key: p.key, label: p.name, meta: 'Tự do', e: undefined })),
  ];

  return (
    <>
      {header}
      <div className="trip-grid">
        <ol className="days">
          {plan.stops.map(({ stop, index, label }) => {
            const city = cities.get(stop.city)!;
            const items = stop.items.map(resolve).filter((x): x is Item => Boolean(x));
            const leg = index > 0 ? plan.legs[index - 1] : null;
            const options = addable(city, stop.items);
            return (
              <li key={stop.city} style={{ display: 'contents' }}>
                {leg && (
                  <div className="day travel reveal">
                    <div className="day-rail">
                      <span className="dot">
                        <IconPlane size={18} />
                      </span>
                      <small>Ngày {leg.day}</small>
                    </div>
                    <section className="day-card">
                      <div className="day-top">
                        <h2>Di chuyển</h2>
                        <span className="note">
                          {cities.get(leg.from)!.name} → {city.name}
                        </span>
                      </div>
                      <div className="travel-line">
                        <IconPlane size={18} />
                        {kmLabel(distanceKm(cities.get(leg.from)!.coord, city.coord))} đường chim bay · chưa gồm vé
                      </div>
                    </section>
                  </div>
                )}
                <div className="day reveal">
                  <div className="day-rail">
                    <span className="dot">{index + 1}</span>
                    <small>{label}</small>
                  </div>
                  <section className="day-card" aria-labelledby={`stop-${stop.city}`}>
                    <div className="day-top">
                      <h2 id={`stop-${stop.city}`}>
                        <Link href={hrefOf.city(city)}>{city.name}</Link>{' '}
                        <span className="note" style={{ fontWeight: 400 }}>
                          · {city.country.name}
                        </span>
                      </h2>
                      <div className="day-tools">
                        <div className="stepper compact" role="group" aria-label={`Số ngày ở ${city.name}`}>
                          <button
                            type="button"
                            aria-label="Bớt một ngày"
                            disabled={stop.days <= 1}
                            onClick={() => update((s) => T.setStopDays(s, index, stop.days - 1))}
                          >
                            −
                          </button>
                          <output aria-live="polite" style={{ minWidth: 56, fontSize: 13 }}>
                            {stop.days} ngày
                          </output>
                          <button
                            type="button"
                            aria-label="Thêm một ngày"
                            disabled={stop.days >= T.MAX_STOP_DAYS}
                            onClick={() => update((s) => T.setStopDays(s, index, stop.days + 1))}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="icon-btn sm press"
                          aria-label={`Đưa ${city.name} lên trước`}
                          disabled={index === 0}
                          onClick={() => update((s) => T.moveStop(s, index, -1))}
                        >
                          <IconUp size={18} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn sm press"
                          aria-label={`Đưa ${city.name} xuống sau`}
                          disabled={index === trip.stops.length - 1}
                          onClick={() => update((s) => T.moveStop(s, index, 1))}
                        >
                          <IconDown size={18} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn sm press"
                          aria-label={`Bỏ ${city.name} khỏi hành trình`}
                          onClick={() => {
                            update((s) => T.removeStop(s, index));
                            notify(`Đã bỏ ${city.name} khỏi hành trình`);
                          }}
                        >
                          <IconTrash size={18} />
                        </button>
                      </div>
                    </div>

                    {items.map((it) => {
                      const key = it.kind === 'e' ? it.e.key : it.p.key;
                      return (
                        <div className="titem" key={key}>
                          <Photo label={it.kind === 'e' ? it.e.place.name : it.p.name} seed={key} caption={false} />
                          <div>
                            <span className="k">
                              {it.kind === 'e' ? `${CAT_LABEL[it.e.cat]} · ${it.e.duration}` : `Địa điểm · ${it.p.kind.split(' · ')[0]}`}
                            </span>
                            <Link className="t" href={it.kind === 'e' ? hrefOf.experience(it.e) : hrefOf.place(it.p)}>
                              {it.kind === 'e' ? it.e.title : it.p.name}
                            </Link>
                          </div>
                          {it.kind === 'p' ? (
                            <span className="st st-free">Tự do</span>
                          ) : inCart(it.e.key) ? (
                            <span className="st st-cart">Trong giỏ</span>
                          ) : (
                            <button type="button" className="btn-s btn-sm press" onClick={() => addToCart(it.e)}>
                              <IconBag size={16} />
                              Thêm vào giỏ
                            </button>
                          )}
                          <b className="amt">{it.kind === 'e' ? vnd(it.e.price) : 'Miễn phí'}</b>
                          <button
                            type="button"
                            className="icon-btn sm press"
                            style={{ border: 0, background: 'transparent' }}
                            aria-label={`Bỏ ${it.kind === 'e' ? it.e.title : it.p.name} khỏi ngày này`}
                            onClick={() => update((s) => T.removeItem(s, key))}
                          >
                            <IconClose size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {items.length === 0 && <p className="note">Chưa có mục nào ở {city.name}.</p>}

                    {options.length > 0 && (
                      <div className="addhere">
                        <button
                          type="button"
                          className="btn-dash"
                          style={{ width: '100%' }}
                          aria-expanded={adding === stop.city}
                          onClick={() => setAdding(adding === stop.city ? null : stop.city)}
                        >
                          + Thêm vào ngày này
                        </button>
                        {adding === stop.city && (
                          <div className="addhere-menu pop">
                            {options.map((o) => (
                              <button
                                key={o.key}
                                type="button"
                                onClick={() => {
                                  update((s) => T.addItem(s, o.key, o.e));
                                  setAdding(null);
                                }}
                              >
                                <span>{o.label}</span>
                                <small>{o.meta}</small>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              </li>
            );
          })}
          <li className="day">
            <div className="day-rail" />
            <form
              className="day-card"
              style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!pickCity) return;
                update((s) => T.addCity(s, pickCity));
                setPickCity('');
              }}
            >
              <label className="field" style={{ flexGrow: 1 }}>
                <span className="sr-only">Thêm thành phố</span>
                <select className="select" value={pickCity} onChange={(e) => setPickCity(e.target.value)} style={{ height: 44 }}>
                  <option value="">Thêm một thành phố…</option>
                  {countries.map((c) => (
                    <optgroup key={c.key} label={c.name}>
                      {c.cities
                        .filter((t) => !trip.stops.some((s) => s.city === t.key))
                        .map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-s press" disabled={!pickCity}>
                Thêm
              </button>
            </form>
          </li>
        </ol>

        <aside className="trip-side" aria-label="Bản đồ và chi phí">
          <TripMap cities={stopCities} />
          <div className="panel panel-pad">
            <h2 className="h3" style={{ fontSize: 18 }}>
              Tóm tắt chi phí
            </h2>
            <dl className="sum">
              <div>
                <dt>{exps.length} trải nghiệm có thể đặt · mỗi khách</dt>
                <dd>{vnd(perGuest)}</dd>
              </div>
              {free > 0 && (
                <div>
                  <dt>{free} địa điểm tự do</dt>
                  <dd>Miễn phí</dd>
                </div>
              )}
              {plan.legs.length > 0 && (
                <div>
                  <dt>{plan.legs.length} chặng di chuyển</dt>
                  <dd className="muted" style={{ fontWeight: 400 }}>
                    Chưa gồm
                  </dd>
                </div>
              )}
              <div className="total">
                <dt>Tạm tính · {guests} khách</dt>
                <dd>{vnd(perGuest * guests)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn-p btn-lg press"
              disabled={exps.length === 0}
              onClick={() => {
                update(T.bookAll);
                router.push('/gio-hang');
              }}
            >
              Đặt cả hành trình
            </button>
            <span className="note">
              {exps.length === 0
                ? 'Thêm ít nhất một trải nghiệm để đặt.'
                : inCartCount === exps.length
                  ? `Cả ${exps.length} trải nghiệm đã có trong giỏ. Bạn vẫn đổi được thứ tự ngày trước khi gửi yêu cầu.`
                  : `${inCartCount}/${exps.length} trải nghiệm đã trong giỏ — “Đặt cả hành trình” thêm nốt phần còn lại.`}
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

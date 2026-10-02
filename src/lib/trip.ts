/**
 * Hành trình + giỏ hàng của khách — một object thuần, lưu ở localStorage phía
 * client (TripProvider). Mọi phép biến đổi là hàm thuần ở đây để TripProvider
 * chỉ còn việc đọc/ghi.
 *
 * - Hành trình: danh sách điểm dừng theo thứ tự đi, mỗi điểm dừng là một thành
 *   phố với số ngày và các mục đã lưu (trải nghiệm hoặc địa điểm tự do).
 * - Giỏ hàng: các trải nghiệm sẽ gửi trong một yêu cầu đặt chỗ. Thêm vào giỏ luôn
 *   kéo theo thêm vào hành trình; bỏ khỏi giỏ thì mục vẫn nằm trong hành trình.
 *
 * Khoá mục là khoá của danh mục: `c0t2e0` (trải nghiệm), `c0t2p0` (địa điểm),
 * nên suy ra được thành phố (`c0t2`) mà không cần tra.
 */

import type { City, Country, Experience } from './catalog';
import { DEPARTURES, byRating } from './catalog';
import { FLEXIBLE_DEPARTURE, GUEST_LIMIT } from './booking';

export interface TripStop {
  /** City.key */
  city: string;
  days: number;
  /** Experience.key hoặc Place.key */
  items: string[];
}

export interface TripState {
  v: 1;
  name: string;
  /** Một trong `DEPARTURES[].date`, hoặc `FLEXIBLE_DEPARTURE`. */
  departure: string;
  adults: number;
  children: number;
  stops: TripStop[];
  /** Experience.key — theo thứ tự thêm. */
  cart: string[];
}

export const DEFAULT_TRIP_NAME = 'Hành trình của tôi';
export const MAX_STOP_DAYS = 14;

export function emptyTrip(): TripState {
  return {
    v: 1,
    name: DEFAULT_TRIP_NAME,
    departure: DEPARTURES[0].date,
    adults: 2,
    children: 0,
    stops: [],
    cart: [],
  };
}

export const isExperienceKey = (key: string) => /e\d+$/.test(key);
export const cityKeyOf = (key: string) => key.replace(/[ep]\d+$/, '');

/** "2 đêm" / "2 ngày" -> 2; giờ, buổi -> 1. */
export function daysFor(experience: Experience): number {
  const m = /(\d+)\s*(đêm|ngày)/.exec(experience.duration);
  return m ? Number(m[1]) : 1;
}

function withStop(state: TripState, cityKey: string): TripState {
  if (state.stops.some((s) => s.city === cityKey)) return state;
  return { ...state, stops: [...state.stops, { city: cityKey, days: 1, items: [] }] };
}

/** Thêm một mục (trải nghiệm/địa điểm) vào điểm dừng của thành phố nó thuộc về. */
export function addItem(state: TripState, key: string, experience?: Experience): TripState {
  const cityKey = cityKeyOf(key);
  const next = withStop(state, cityKey);
  return {
    ...next,
    stops: next.stops.map((s) => {
      if (s.city !== cityKey || s.items.includes(key)) return s;
      const days = experience ? Math.min(MAX_STOP_DAYS, Math.max(s.days, daysFor(experience))) : s.days;
      return { ...s, days, items: [...s.items, key] };
    }),
  };
}

export function addCity(state: TripState, cityKey: string): TripState {
  return withStop(state, cityKey);
}

export function removeItem(state: TripState, key: string): TripState {
  return { ...state, stops: state.stops.map((s) => ({ ...s, items: s.items.filter((k) => k !== key) })) };
}

export function removeStop(state: TripState, index: number): TripState {
  return { ...state, stops: state.stops.filter((_, i) => i !== index) };
}

export function moveStop(state: TripState, index: number, delta: -1 | 1): TripState {
  const to = index + delta;
  if (to < 0 || to >= state.stops.length) return state;
  const stops = [...state.stops];
  [stops[index], stops[to]] = [stops[to], stops[index]];
  return { ...state, stops };
}

export function setStopDays(state: TripState, index: number, days: number): TripState {
  const d = Math.max(1, Math.min(MAX_STOP_DAYS, Math.round(days)));
  return { ...state, stops: state.stops.map((s, i) => (i === index ? { ...s, days: d } : s)) };
}

export function addToCart(state: TripState, experience: Experience): TripState {
  const next = addItem(state, experience.key, experience);
  return next.cart.includes(experience.key) ? next : { ...next, cart: [...next.cart, experience.key] };
}

export function removeFromCart(state: TripState, key: string): TripState {
  return { ...state, cart: state.cart.filter((k) => k !== key) };
}

/** "Đặt cả hành trình": mọi trải nghiệm trong hành trình vào giỏ, giữ thứ tự ngày. */
export function bookAll(state: TripState): TripState {
  const keys = state.stops.flatMap((s) => s.items.filter(isExperienceKey));
  return { ...state, cart: [...new Set([...state.cart, ...keys])] };
}

export function setGuests(state: TripState, adults: number, children: number): TripState {
  const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.max(lo, Math.min(hi, Math.round(v)));
  return { ...state, adults: clamp(adults, GUEST_LIMIT.adults), children: clamp(children, GUEST_LIMIT.children) };
}

export function setDeparture(state: TripState, departure: string): TripState {
  const ok = departure === FLEXIBLE_DEPARTURE || DEPARTURES.some((d) => d.date === departure);
  return ok ? { ...state, departure } : state;
}

/**
 * Hành trình mẫu của một quốc gia: đi qua các thành phố theo thứ tự trong danh mục,
 * mỗi nơi lấy trải nghiệm được đánh giá cao nhất. Chỉ là điểm xuất phát để khách sửa.
 */
export function sampleTrip(country: Country, base: TripState): TripState {
  let next: TripState = { ...base, name: `${country.name} · ${country.cities.map((c) => c.name).join(' → ')}`, stops: [] };
  for (const city of country.cities) {
    const top = [...city.experiences].sort(byRating)[0];
    next = top ? addItem(next, top.key, top) : addCity(next, city.key);
  }
  return next;
}

export interface ScheduledStop {
  stop: TripStop;
  index: number;
  /** "Ngày 1–2" */
  label: string;
  first: number;
  last: number;
}

export interface ScheduledLeg {
  from: string;
  to: string;
  day: number;
}

/**
 * Xếp ngày: mỗi điểm dừng chiếm `days` ngày liền nhau, giữa hai điểm dừng có một
 * ngày di chuyển. Không phải lịch trình tối ưu — chỉ để khách thấy chuyến đi dài bao lâu.
 */
export function schedule(stops: TripStop[]): { stops: ScheduledStop[]; legs: ScheduledLeg[]; totalDays: number } {
  const out: ScheduledStop[] = [];
  const legs: ScheduledLeg[] = [];
  let day = 1;
  stops.forEach((stop, index) => {
    if (index > 0) {
      legs.push({ from: stops[index - 1].city, to: stop.city, day });
      day += 1;
    }
    const first = day;
    const last = day + stop.days - 1;
    out.push({ stop, index, first, last, label: first === last ? `Ngày ${first}` : `Ngày ${first}–${last}` });
    day = last + 1;
  });
  return { stops: out, legs, totalDays: Math.max(0, day - 1) };
}

/** Đọc dữ liệu đã lưu (hoặc bản cũ: mảng khoá của /hanh-trinh trước đây), bỏ khoá không còn trong danh mục. */
export function parseTrip(
  raw: unknown,
  legacy: unknown,
  lookup: { experience: (key: string) => Experience | undefined; hasPlace: (key: string) => boolean; city: (key: string) => City | undefined },
): TripState {
  const base = emptyTrip();
  const valid = (k: unknown): k is string =>
    typeof k === 'string' && (isExperienceKey(k) ? Boolean(lookup.experience(k)) : lookup.hasPlace(k));

  const withLegacy = (state: TripState) => {
    // Bản trước: `meridian.hanh-trinh` là mảng khoá trải nghiệm = giỏ hàng. Gộp vào giỏ.
    if (!Array.isArray(legacy)) return state;
    for (const key of legacy) {
      const e = typeof key === 'string' ? lookup.experience(key) : undefined;
      if (e) state = addToCart(state, e);
    }
    return state;
  };

  if (raw && typeof raw === 'object' && (raw as TripState).v === 1) {
    const r = raw as Partial<TripState>;
    let state: TripState = {
      ...base,
      name: typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 80) : base.name,
      stops: Array.isArray(r.stops)
        ? r.stops
            .filter((s): s is TripStop => Boolean(s) && typeof s.city === 'string' && Boolean(lookup.city(s.city)))
            .map((s) => ({
              city: s.city,
              days: Number.isFinite(s.days) ? Math.max(1, Math.min(MAX_STOP_DAYS, s.days)) : 1,
              items: Array.isArray(s.items) ? s.items.filter(valid).filter((k) => cityKeyOf(k) === s.city) : [],
            }))
        : [],
      cart: Array.isArray(r.cart) ? [...new Set(r.cart.filter((k): k is string => valid(k) && isExperienceKey(k)))] : [],
    };
    state = setDeparture(state, typeof r.departure === 'string' ? r.departure : base.departure);
    state = setGuests(state, Number(r.adults ?? base.adults), Number(r.children ?? base.children));
    return withLegacy(state);
  }
  return withLegacy(base);
}

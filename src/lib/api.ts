/**
 * Hình dạng dữ liệu trả về từ API (`/api/countries/...`) — hợp đồng cho client
 * bên ngoài và cho backend thật sau này. Khác Country/City/Place/Experience ở chỗ không có
 * tham chiếu ngược tới cha — JSON (và việc truyền prop từ Server Component sang
 * Client Component) không chịu được vòng tham chiếu. Trải nghiệm trỏ về địa
 * điểm bằng `place` (slug trong cùng thành phố).
 */

import type { Cat, City, Country, Experience, LngLat, Place } from './catalog';

export interface ApiExperience {
  key: string;
  slug: string;
  title: string;
  cat: Cat;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  blurb: string;
  place: string;
}

export interface ApiPlace {
  key: string;
  slug: string;
  name: string;
  kind: string;
  coord: LngLat;
  blurb: string;
}

export interface ApiCity {
  key: string;
  slug: string;
  name: string;
  coord: LngLat;
  blurb: string;
  from: number;
  places: ApiPlace[];
  experiences: ApiExperience[];
}

export interface ApiCountry {
  key: string;
  slug: string;
  id: string;
  name: string;
  native: string;
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  from: number;
  cities: ApiCity[];
}

export type ApiCountrySummary = Omit<ApiCountry, 'cities'>;
export type ApiCitySummary = Omit<ApiCity, 'experiences' | 'places'>;

export function toApiExperience(e: Experience): ApiExperience {
  const { key, slug, title, cat, duration, price, rating, reviews, blurb } = e;
  return { key, slug, title, cat, duration, price, rating, reviews, blurb, place: e.place.slug };
}

export function toApiPlace(p: Place): ApiPlace {
  const { key, slug, name, kind, coord, blurb } = p;
  return { key, slug, name, kind, coord, blurb };
}

export function toApiCity(c: City): ApiCity {
  return {
    ...toApiCitySummary(c),
    places: c.places.map(toApiPlace),
    experiences: c.experiences.map(toApiExperience),
  };
}

export function toApiCitySummary(c: City): ApiCitySummary {
  const { key, slug, name, coord, blurb, from } = c;
  return { key, slug, name, coord, blurb, from };
}

/** Cắt tham chiếu ngược tới cha để có thể JSON.stringify / truyền qua RSC boundary. */
export function toApiCountry(c: Country): ApiCountry {
  return { ...toApiCountrySummary(c), cities: c.cities.map(toApiCity) };
}

export function toApiCountrySummary(c: Country): ApiCountrySummary {
  const { key, slug, id, name, native, season, flight, visa, currency, blurb, from } = c;
  return { key, slug, id, name, native, season, flight, visa, currency, blurb, from };
}

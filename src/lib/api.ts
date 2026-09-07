/**
 * Hình dạng dữ liệu qua lại giữa API (`/api/countries/...`) và phía client —
 * dùng chung bởi route handler (serialize) và CatalogProvider (hydrate), để
 * hai bên luôn khớp nhau. Khác Country/City/Experience ở chỗ không có
 * tham chiếu ngược tới cha (city.country, experience.city/country) — JSON
 * (và việc truyền prop từ Server Component sang Client Component) không
 * chịu được vòng tham chiếu.
 */

import type { Cat, City, Country, Experience } from './catalog';

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
}

export interface ApiCity {
  key: string;
  slug: string;
  name: string;
  coord: [number, number];
  blurb: string;
  from: number;
  experiences: ApiExperience[];
}

export interface ApiCountry {
  key: string;
  slug: string;
  id: string;
  name: string;
  native: string;
  coord: [number, number];
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  from: number;
  cities: ApiCity[];
}

export type ApiCountrySummary = Omit<ApiCountry, 'cities'>;
export type ApiCitySummary = Omit<ApiCity, 'experiences'>;

export function toApiExperience(e: Experience): ApiExperience {
  const { key, slug, title, cat, duration, price, rating, reviews, blurb } = e;
  return { key, slug, title, cat, duration, price, rating, reviews, blurb };
}

export function toApiCity(c: City): ApiCity {
  const { key, slug, name, coord, blurb, from } = c;
  return { key, slug, name, coord, blurb, from, experiences: c.experiences.map(toApiExperience) };
}

export function toApiCitySummary(c: City): ApiCitySummary {
  const { key, slug, name, coord, blurb, from } = c;
  return { key, slug, name, coord, blurb, from };
}

/** Cắt tham chiếu ngược tới cha để có thể JSON.stringify / truyền qua RSC boundary. */
export function toApiCountry(c: Country): ApiCountry {
  const { key, slug, id, name, native, coord, season, flight, visa, currency, blurb, from } = c;
  return {
    key, slug, id, name, native, coord, season, flight, visa, currency, blurb, from,
    cities: c.cities.map(toApiCity),
  };
}

export function toApiCountrySummary(c: Country): ApiCountrySummary {
  const { key, slug, id, name, native, coord, season, flight, visa, currency, blurb, from } = c;
  return { key, slug, id, name, native, coord, season, flight, visa, currency, blurb, from };
}

/** Dựng lại tham chiếu ngược (city.country, experience.city/country) phía client. */
export function hydrateCountries(raw: ApiCountry[]): Country[] {
  return raw.map((rc) => {
    const country = { ...rc, cities: [] } as unknown as Country;
    country.cities = rc.cities.map((rt) => {
      const city = { ...rt, experiences: [], country } as unknown as City;
      city.experiences = rt.experiences.map((re) => ({ ...re, city, country }) as Experience);
      return city;
    });
    return country;
  });
}

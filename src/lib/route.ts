import { findCity, findCountry, findExperience } from './catalog';
import type { City, Country, Experience } from './catalog';
import type { Level } from './geo';
import { JA_ALIASES } from './ja';
import type { Lang } from './ja';

export const ITINERARY_SEGMENT = 'hanh-trinh';

export interface RouteState {
  level: Level;
  isItinerary: boolean;
  lang: Lang;
  country?: Country;
  city?: City;
  experience?: Experience;
}

/** URL chính là trạng thái zoom, nên chỉ cần đọc pathname là dựng lại được cảnh. */
export function resolveRoute(pathname: string, countries: Country[]): RouteState {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (segments[0] === ITINERARY_SEGMENT) {
    return { level: 'world', isItinerary: true, lang: 'vi' };
  }

  // Bản tiếng Nhật chỉ có ở cấp quốc gia — segment thứ hai trở đi không khớp gì.
  const jaSlug = JA_ALIASES[segments[0]];
  if (jaSlug && segments.length === 1) {
    const country = findCountry(countries, jaSlug);
    if (country) return { level: 'country', isItinerary: false, lang: 'ja', country };
  }

  const country = findCountry(countries, segments[0]);
  const city = findCity(country, segments[1]);
  const experience = findExperience(city, segments[2]);

  const level: Level = experience ? 'experience' : city ? 'city' : country ? 'country' : 'world';
  return { level, isItinerary: false, lang: 'vi', country, city, experience };
}

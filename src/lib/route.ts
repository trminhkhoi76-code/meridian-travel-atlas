import { findCity, findCountry, findExperience } from './catalog';
import type { City, Country, Experience } from './catalog';
import type { Level } from './geo';

export const ITINERARY_SEGMENT = 'hanh-trinh';

export interface RouteState {
  level: Level;
  isItinerary: boolean;
  country?: Country;
  city?: City;
  experience?: Experience;
}

/** URL chính là trạng thái zoom, nên chỉ cần đọc pathname là dựng lại được cảnh. */
export function resolveRoute(pathname: string, countries: Country[]): RouteState {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (segments[0] === ITINERARY_SEGMENT) {
    return { level: 'world', isItinerary: true };
  }

  const country = findCountry(countries, segments[0]);
  const city = findCity(country, segments[1]);
  const experience = findExperience(city, segments[2]);

  const level: Level = experience ? 'experience' : city ? 'city' : country ? 'country' : 'world';
  return { level, isItinerary: false, country, city, experience };
}

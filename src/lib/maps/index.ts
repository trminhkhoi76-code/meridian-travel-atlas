import type { City, Country } from '../catalog';
import type { MapRegion } from '../map';
import regions from './regions.json';

/**
 * Bản đồ vẽ sẵn cho trang SSG. File JSON do `npm run maps` sinh ra — chạy lại
 * mỗi khi đổi toạ độ trong seed.ts. Chỉ import phía server: trang nào chỉ
 * nhúng đúng vùng của trang đó.
 */
const data = regions as { cities: Record<string, MapRegion>; countries: Record<string, MapRegion> };

export function cityMap(city: City): MapRegion {
  const region = data.cities[`${city.country.slug}/${city.slug}`];
  if (!region) throw new Error(`Chưa có bản đồ cho ${city.country.slug}/${city.slug} — chạy npm run maps`);
  return region;
}

export function countryMap(country: Country): MapRegion {
  const region = data.countries[country.slug];
  if (!region) throw new Error(`Chưa có bản đồ cho ${country.slug} — chạy npm run maps`);
  return region;
}

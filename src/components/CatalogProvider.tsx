'use client';

import { createContext, useContext } from 'react';
import type { City, Country, Experience, Place } from '@/lib/catalog';
import { buildCatalog } from '@/lib/seed';

interface CatalogValue {
  countries: Country[];
  byKey: Map<string, Experience>;
  places: Map<string, Place>;
  cities: Map<string, City>;
  totalCities: number;
  totalExperiences: number;
}

/**
 * Danh mục phía client, dựng một lần từ seed.ts ngay trong bundle JS.
 *
 * Vì sao không nhận qua prop từ layout như trước: dữ liệu truyền từ layout bị nhúng
 * vào payload RSC của MỌI route — kể cả các route Next prefetch ngầm cho từng link
 * trên màn hình (~45 KB × mỗi link). Nằm trong chunk JS thì trình duyệt tải và cache
 * đúng một lần. Đổi lại: khi thay seed bằng API thật, phải đổi cả chỗ này (tải
 * /api/countries một lần rồi cache), không chỉ catalog-service.ts.
 */
function build(): CatalogValue {
  const countries = buildCatalog();
  const byKey = new Map<string, Experience>();
  const places = new Map<string, Place>();
  const cities = new Map<string, City>();
  let totalExperiences = 0;
  for (const country of countries) {
    for (const city of country.cities) {
      cities.set(city.key, city);
      totalExperiences += city.experiences.length;
      for (const experience of city.experiences) byKey.set(experience.key, experience);
      for (const place of city.places) places.set(place.key, place);
    }
  }
  return { countries, byKey, places, cities, totalCities: cities.size, totalExperiences };
}

const CATALOG = build();
const Ctx = createContext<CatalogValue>(CATALOG);

export function useCatalog(): CatalogValue {
  return useContext(Ctx);
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={CATALOG}>{children}</Ctx.Provider>;
}

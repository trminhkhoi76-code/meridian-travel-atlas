'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Country, Experience } from '@/lib/catalog';
import type { ApiCountry } from '@/lib/api';
import { hydrateCountries } from '@/lib/api';

interface CatalogValue {
  countries: Country[];
  byKey: Map<string, Experience>;
  totalCities: number;
  totalExperiences: number;
}

const Ctx = createContext<CatalogValue | null>(null);

export function useCatalog(): CatalogValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useCatalog phải nằm trong <CatalogProvider>');
  return value;
}

/**
 * Nhận danh mục đã lấy từ API phía server (layout.tsx) rồi dựng lại thành
 * cây Country/City/Experience có tham chiếu ngược tới cha, dùng chung cho
 * mọi client component (quả cầu, hành trình, mục lục...).
 */
export function CatalogProvider({
  initial,
  children,
}: {
  initial: ApiCountry[];
  children: React.ReactNode;
}) {
  const value = useMemo<CatalogValue>(() => {
    const countries = hydrateCountries(initial);
    const byKey = new Map<string, Experience>();
    let totalCities = 0;
    let totalExperiences = 0;
    for (const country of countries) {
      totalCities += country.cities.length;
      for (const city of country.cities) {
        totalExperiences += city.experiences.length;
        for (const experience of city.experiences) byKey.set(experience.key, experience);
      }
    }
    return { countries, byKey, totalCities, totalExperiences };
  }, [initial]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hrefOf } from '@/lib/catalog';
import { getCity, getCountries } from '@/lib/catalog-service';
import { cityMap } from '@/lib/maps';
import CityExplorer from '@/components/CityExplorer';
import Crumbs from '@/components/Crumbs';

interface Props {
  params: Promise<{ country: string; city: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCountries()).flatMap((country) =>
    country.cities.map((city) => ({ country: country.slug, city: city.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, city: citySlug } = await params;
  const city = await getCity(countrySlug, citySlug);
  if (!city) return {};
  return {
    title: `${city.name}, ${city.country.name}`,
    description: city.blurb,
    alternates: { canonical: hrefOf.city(city) },
  };
}

/** Cấp 2 · Thành phố. */
export default async function CityPage({ params }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const city = await getCity(countrySlug, citySlug);
  if (!city) notFound();

  return (
    <main className="container page">
      <Crumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: city.country.name, href: hrefOf.country(city.country) },
          { label: city.name },
        ]}
      />
      <CityExplorer cityKey={city.key} map={cityMap(city)} />
    </main>
  );
}

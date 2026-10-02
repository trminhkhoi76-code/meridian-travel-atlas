import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hrefOf } from '@/lib/catalog';
import { getCountries, getCountry } from '@/lib/catalog-service';
import { countryMap } from '@/lib/maps';
import CountryView from '@/components/CountryView';

interface Props {
  params: Promise<{ country: string }>;
}

// Mọi quốc gia đều prerender; slug lạ là 404 ngay, không render động.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCountries()).map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = await getCountry((await params).country);
  if (!country) return {};
  return {
    title: country.name,
    description: country.blurb,
    alternates: { canonical: hrefOf.country(country) },
  };
}

export default async function CountryPage({ params }: Props) {
  const country = await getCountry((await params).country);
  if (!country) notFound();
  return <CountryView country={country} map={countryMap(country)} />;
}

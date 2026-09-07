import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hrefOf } from '@/lib/catalog';
import { getCity, getCountries } from '@/lib/catalog-service';
import { coordLabel } from '@/lib/format';
import CityExperienceRows from '@/components/CityExperienceRows';

interface Props {
  params: Promise<{ country: string; city: string }>;
}

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

export default async function CityPanel({ params }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const city = await getCity(countrySlug, citySlug);
  if (!city) notFound();
  const country = city.country;

  const rows = city.experiences.map((experience) => ({
    key: experience.key,
    href: hrefOf.experience(experience),
    title: experience.title,
    cat: experience.cat,
    duration: experience.duration,
    price: experience.price,
    rating: experience.rating,
    reviews: experience.reviews,
  }));

  return (
    <div className="pbody">
      <Link href={hrefOf.country(country)} className="back">
        ← {country.name}
      </Link>
      <p className="mono">{coordLabel(city.coord)}</p>
      <h1 className="ptitle">{city.name}</h1>
      <p className="pdesc">{city.blurb}</p>

      <div className="sechead">
        <span className="mono">{city.experiences.length} trải nghiệm</span>
        <span className="mono">Mỗi khách</span>
      </div>
      <CityExperienceRows rows={rows} />
    </div>
  );
}

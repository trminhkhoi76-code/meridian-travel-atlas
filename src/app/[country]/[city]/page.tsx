import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CAT_LABEL, COUNTRIES, findCity, findCountry, hrefOf } from '@/lib/catalog';
import { coordLabel, ratingLabel, vnd } from '@/lib/format';
import { swatch } from '@/lib/swatch';

interface Props {
  params: Promise<{ country: string; city: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.flatMap((country) =>
    country.cities.map((city) => ({ country: country.slug, city: city.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, city: citySlug } = await params;
  const city = findCity(findCountry(countrySlug), citySlug);
  if (!city) return {};
  return {
    title: `${city.name}, ${city.country.name}`,
    description: city.blurb,
    alternates: { canonical: hrefOf.city(city) },
  };
}

export default async function CityPanel({ params }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const country = findCountry(countrySlug);
  const city = findCity(country, citySlug);
  if (!country || !city) notFound();

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
      <div className="rows">
        {city.experiences.map((experience) => (
          <Link key={experience.key} href={hrefOf.experience(experience)} className="row">
            <span className="sw" style={{ background: swatch(experience.cat) }} aria-hidden="true" />
            <span className="txt">
              <b>{experience.title}</b>
              <small>
                {CAT_LABEL[experience.cat]} · {experience.duration} ·{' '}
                {ratingLabel(experience.rating)} ★ ({experience.reviews})
              </small>
            </span>
            <span className="pr">
              <b>{vnd(experience.price)}</b>
              <small>mỗi khách</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

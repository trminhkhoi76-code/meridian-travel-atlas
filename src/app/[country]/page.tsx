import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COUNTRIES, findCountry, hrefOf } from '@/lib/catalog';
import { coordLabel, vnd } from '@/lib/format';

interface Props {
  params: Promise<{ country: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = findCountry((await params).country);
  if (!country) return {};
  return {
    title: country.name,
    description: country.blurb,
    alternates: { canonical: hrefOf.country(country) },
  };
}

export default async function CountryPanel({ params }: Props) {
  const country = findCountry((await params).country);
  if (!country) notFound();

  const experiences = country.cities.reduce((n, city) => n + city.experiences.length, 0);

  return (
    <div className="pbody">
      <Link href={hrefOf.world()} className="back">
        ← Thế giới
      </Link>
      <p className="mono">{coordLabel(country.coord)}</p>
      <h1 className="ptitle">{country.name}</h1>
      <p className="pnative">{country.native}</p>
      <p className="pdesc">{country.blurb}</p>

      <dl className="meta">
        <div>
          <dt className="mono">Mùa đẹp nhất</dt>
          <dd>{country.season}</dd>
        </div>
        <div>
          <dt className="mono">Đường bay</dt>
          <dd>{country.flight}</dd>
        </div>
        <div>
          <dt className="mono">Thị thực</dt>
          <dd>{country.visa}</dd>
        </div>
        <div>
          <dt className="mono">Tiền tệ</dt>
          <dd>{country.currency}</dd>
        </div>
      </dl>

      <div className="sechead">
        <span className="mono">
          {country.cities.length} thành phố · {experiences} trải nghiệm
        </span>
        <span className="mono">Giá từ</span>
      </div>
      <div className="rows">
        {country.cities.map((city) => (
          <Link key={city.key} href={hrefOf.city(city)} className="row">
            <span className="txt">
              <b>{city.name}</b>
              <small>{city.blurb}</small>
            </span>
            <span className="pr">
              <b>{vnd(city.from)}</b>
              <small>{city.experiences.length} trải nghiệm</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

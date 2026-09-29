import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hrefOf } from '@/lib/catalog';
import { getCountry } from '@/lib/catalog-service';
import { coordLabelJa, vnd } from '@/lib/format';
import { JA_ALIASES, JA_COUNTRY, JA_PATH, JA_UI } from '@/lib/ja';

/** `/nhat-ban-ja` — trang Nhật Bản bằng tiếng Nhật; `resolveRoute` đưa quả cầu về cùng cảnh với `/nhat-ban`. */
const SLUG = JA_ALIASES[JA_PATH.slice(1)];

export async function generateMetadata(): Promise<Metadata> {
  const country = await getCountry(SLUG);
  const ja = JA_COUNTRY[SLUG];
  if (!country || !ja) return {};
  return {
    title: ja.name,
    description: ja.blurb,
    alternates: {
      canonical: JA_PATH,
      languages: { vi: hrefOf.country(country), ja: JA_PATH },
    },
    openGraph: { locale: 'ja_JP' },
  };
}

export default async function CountryPanelJa() {
  const country = await getCountry(SLUG);
  const ja = JA_COUNTRY[SLUG];
  if (!country || !ja) notFound();

  const experiences = country.cities.reduce((n, city) => n + city.experiences.length, 0);

  return (
    <div className="pbody" lang="ja">
      <Link href={hrefOf.world()} className="back">
        ← {JA_UI.world}
      </Link>
      <p className="mono">{coordLabelJa(country.coord)}</p>
      <h1 className="ptitle">{ja.name}</h1>
      <p className="pnative">{country.name}</p>
      <p className="pdesc">{ja.blurb}</p>

      <dl className="meta">
        <div>
          <dt className="mono">{JA_UI.bestSeason}</dt>
          <dd>{ja.season}</dd>
        </div>
        <div>
          <dt className="mono">{JA_UI.flight}</dt>
          <dd>{ja.flight}</dd>
        </div>
        <div>
          <dt className="mono">{JA_UI.visa}</dt>
          <dd>{ja.visa}</dd>
        </div>
        <div>
          <dt className="mono">{JA_UI.currency}</dt>
          <dd>{ja.currency}</dd>
        </div>
      </dl>

      <div className="sechead">
        <span className="mono">
          {JA_UI.cities(country.cities.length)} · {JA_UI.experiences(experiences)}
        </span>
        <span className="mono">{JA_UI.priceFrom}</span>
      </div>
      <div className="rows">
        {country.cities.map((city) => {
          const jc = ja.cities[city.slug];
          return (
            <Link key={city.key} href={hrefOf.city(city)} className="row">
              <span className="txt">
                <b>{jc?.name ?? city.name}</b>
                <small>{jc?.blurb ?? city.blurb}</small>
              </span>
              <span className="pr">
                <b>{vnd(city.from)}</b>
                <small>{JA_UI.experiences(city.experiences.length)}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

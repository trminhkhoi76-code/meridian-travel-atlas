import Link from 'next/link';
import type { Cat, City, Country, Experience } from '@/lib/catalog';
import { CAT_LABEL, CAT_NOUN, hrefOf } from '@/lib/catalog';
import { ratingLabel, vnd, vndShort } from '@/lib/format';
import { CatIcon, Star } from './Icons';
import Photo from './Photo';

/**
 * Thẻ dùng chung. Không dùng hook nên chạy được ở cả Server lẫn Client Component.
 * `style` cho phép trang truyền animation-delay khi xếp so le.
 */

export function Rating({ e, extra }: { e: Experience; extra?: string }) {
  return (
    <span className="rating">
      <Star />
      <b>{ratingLabel(e.rating)}</b> ({e.reviews}){extra ? ` · ${extra}` : ''}
    </span>
  );
}

export function ExperienceCard({ e, style, showCat = true }: { e: Experience; style?: React.CSSProperties; showCat?: boolean }) {
  return (
    <Link href={hrefOf.experience(e)} className="xcard lift reveal" style={style}>
      <Photo label={e.place.name} seed={e.key}>
        {showCat && <span className="tag-on">{CAT_LABEL[e.cat]}</span>}
      </Photo>
      <div className="xcard-body">
        <span className="where">
          {e.city.name}, {e.country.name}
        </span>
        <b className="t">{e.title}</b>
        <Rating e={e} extra={e.duration} />
        <span className="price">{vnd(e.price)}</span>
      </div>
    </Link>
  );
}

/** Thẻ ngang gọn: dùng ở trang quốc gia, "gần đây" ở trang địa điểm. */
export function ExperienceRow({
  e,
  meta,
  small,
  className = 'cardin',
  style,
}: {
  e: Experience;
  meta?: string;
  small?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link href={hrefOf.experience(e)} className={`hcard lift ${small ? 'sm ' : ''}${className}`} style={style}>
      <Photo label={e.place.name} seed={e.key} caption={false} />
      <div className="hcard-body">
        <span className="k">{meta ?? `${CAT_LABEL[e.cat]} · ${e.city.name}`}</span>
        <b className="t">{e.title}</b>
        <Rating e={e} extra={e.duration} />
        <span className="price">{vnd(e.price)}</span>
      </div>
    </Link>
  );
}

export function CityCard({ city }: { city: City }) {
  const cats = [...new Set(city.experiences.map((e) => e.cat))];
  return (
    <Link href={hrefOf.city(city)} className="ccard lift reveal">
      <Photo label={city.places[0]?.name ?? city.name} seed={city.key} />
      <div className="ccard-body">
        <div className="ccard-top">
          <b>{city.name}</b>
          <span>
            từ <b>{vndShort(city.from)}</b>
          </span>
        </div>
        <p>{city.blurb}</p>
        <div className="ccard-cats">
          {cats.map((c) => (
            <span key={c}>{CAT_LABEL[c]}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function CountryCard({ country }: { country: Country }) {
  return (
    <Link href={hrefOf.country(country)} className="cocard reveal">
      <Photo label={country.cities[0].name} seed={country.key} />
      <div>
        <b>{country.name}</b>
        <small>{country.native}</small>
        <div className="from">
          từ <b>{vndShort(country.from)}</b>
        </div>
      </div>
    </Link>
  );
}

export function CategoryCard({ cat, count }: { cat: Cat; count: number }) {
  return (
    <Link href={hrefOf.category(cat)} className="catcard lift reveal">
      <span className="cat-ic">
        <CatIcon cat={cat} />
      </span>
      <span>
        <b>{CAT_LABEL[cat]}</b>
        <small>
          {count} {CAT_NOUN[cat]}
        </small>
      </span>
    </Link>
  );
}

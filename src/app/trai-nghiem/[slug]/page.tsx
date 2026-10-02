import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CAT_INCLUDES, CAT_LABEL, allExperiences, distanceKm, hrefOf } from '@/lib/catalog';
import { getCountries, getExperience } from '@/lib/catalog-service';
import { kmLabel, ratingLabel } from '@/lib/format';
import { GALLERY } from '@/lib/gallery';
import { cityMap } from '@/lib/maps';
import { projectPct } from '@/lib/map';
import BookingAside from '@/components/BookingAside';
import Crumbs from '@/components/Crumbs';
import { IconCheck, IconChevronRight, IconClock, IconPin, IconUpload, Star } from '@/components/Icons';
import MapView from '@/components/MapView';
import Photo from '@/components/Photo';
import { UploadButton } from '@/components/UploadDialog';
import XpGallery from '@/components/XpGallery';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return allExperiences(await getCountries()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getExperience((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title} — ${e.city.name}`,
    description: e.blurb,
    alternates: { canonical: hrefOf.experience(e) },
  };
}

/** Cấp 4 · Trải nghiệm — sản phẩm bán, luôn gắn với một địa điểm. */
export default async function ExperiencePage({ params }: Props) {
  const e = await getExperience((await params).slug);
  if (!e) notFound();
  const { place, city, country } = e;
  const map = cityMap(city);
  const photos = GALLERY.filter((g) => g.place === place.key).slice(0, 4);
  const labels = [...new Set([e.title, place.name, ...city.places.filter((p) => p !== place).map((p) => p.name)])].slice(0, 5);

  // Dữ liệu có cấu trúc cho kết quả tìm kiếm — giá và đánh giá lấy từ đúng bản ghi đang bán.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: e.title,
    description: e.blurb,
    category: CAT_LABEL[e.cat],
    offers: { '@type': 'Offer', price: e.price, priceCurrency: 'VND', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: e.rating, reviewCount: e.reviews },
  };

  return (
    <main className="container page">
      <div className="progress" aria-hidden="true" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: country.name, href: hrefOf.country(country) },
          { label: city.name, href: hrefOf.city(city) },
          { label: place.name, href: hrefOf.place(place) },
          { label: e.title },
        ]}
      />

      <div className="split">
        <div className="main-8" style={{ gap: 32 }}>
          <XpGallery labels={labels} seed={e.key} />

          <header className="xp-head enter d1">
            <Link href={hrefOf.category(e.cat)} className="tag" style={{ textDecoration: 'none' }}>
              {CAT_LABEL[e.cat]}
            </Link>
            <h1 className="title-m">{e.title}</h1>
            <div className="xp-meta">
              <span>
                <Star size={16} />
                <b>{ratingLabel(e.rating)}</b> · {e.reviews} đánh giá
              </span>
              <span>
                <IconClock size={16} />
                {e.duration}
              </span>
              <Link href={hrefOf.place(place)}>
                <IconPin size={16} />
                {place.name}, {city.name}
              </Link>
            </div>
          </header>

          <section aria-labelledby="h-desc" className="block reveal">
            <h2 id="h-desc" className="h3">
              {e.cat === 'STAY' ? 'Bạn sẽ ở đâu' : 'Bạn sẽ làm gì'}
            </h2>
            <p>{e.blurb}</p>
          </section>

          <section aria-labelledby="h-inc" className="block reveal">
            <h2 id="h-inc" className="h3">
              Đã bao gồm
            </h2>
            <ul className="incl">
              {CAT_INCLUDES[e.cat].map((item) => (
                <li key={item}>
                  <IconCheck size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="h-loc" className="block reveal">
            <h2 id="h-loc" className="h3">
              Vị trí
            </h2>
            <Link href={hrefOf.place(place)} className="loccard lift">
              <MapView region={map} label={`${place.name} trên bản đồ`} note={null}>
                <span className="pin is-sel" style={{ ...projectPct(map, place.coord), width: 18, height: 18 }} aria-hidden="true" />
              </MapView>
              <div>
                <span className="kicker">Địa điểm</span>
                <b>{place.name}</b>
                <span>
                  {place.kind} · {kmLabel(distanceKm(place.coord, city.coord)).toLowerCase()} từ trung tâm {city.name}
                </span>
              </div>
              <IconChevronRight />
            </Link>
          </section>

          <section aria-labelledby="h-photos" className="block reveal">
            <div className="sec-head">
              <h2 id="h-photos" className="h3">
                Ảnh khách chia sẻ ở {place.name}
              </h2>
              <Link href={hrefOf.gallery()}>Xem tất cả</Link>
            </div>
            <div className="ugc4">
              {photos.map((g) => (
                <Photo key={g.id} label={`${place.name}, ảnh của ${g.author}`} seed={place.key + g.id} caption={false}>
                  <span className="sample-tag">Ảnh mẫu</span>
                </Photo>
              ))}
              <UploadButton place={place.key} className="add-photo">
                <IconUpload size={24} />
                Đăng ảnh ở {place.name}
              </UploadButton>
            </div>
          </section>
        </div>

        <BookingAside experienceKey={e.key} />
      </div>
    </main>
  );
}

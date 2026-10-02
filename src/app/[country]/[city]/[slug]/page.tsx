import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { hrefOf } from '@/lib/catalog';
import { getCountries, getExperienceIn, getPlace } from '@/lib/catalog-service';
import { cityMap } from '@/lib/maps';
import PlaceView from '@/components/PlaceView';

interface Props {
  params: Promise<{ country: string; city: string; slug: string }>;
}

/**
 * Cấp 3 · Địa điểm. Cùng vị trí URL này trước đây là trang trải nghiệm
 * (`/nhat-ban/kyoto/ryokan-arashiyama`) — slug khớp trải nghiệm thì chuyển hẳn
 * (308) sang `/trai-nghiem/<slug>` để link cũ và chỉ mục tìm kiếm không gãy.
 * seed.ts đảm bảo slug địa điểm không trùng slug trải nghiệm trong cùng thành phố.
 */
export async function generateStaticParams() {
  return (await getCountries()).flatMap((country) =>
    country.cities.flatMap((city) => city.places.map((p) => ({ country: country.slug, city: city.slug, slug: p.slug }))),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city, slug } = await params;
  const place = await getPlace(country, city, slug);
  if (!place) return {};
  return {
    title: `${place.name} — ${place.city.name}`,
    description: place.blurb,
    alternates: { canonical: hrefOf.place(place) },
  };
}

export default async function PlacePage({ params }: Props) {
  const { country, city, slug } = await params;
  const place = await getPlace(country, city, slug);
  if (!place) {
    const legacy = await getExperienceIn({ country, city }, slug);
    if (legacy) permanentRedirect(hrefOf.experience(legacy));
    notFound();
  }
  return <PlaceView place={place} map={cityMap(place.city)} />;
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CAT_LABEL, COUNTRIES, findCity, findCountry, findExperience, hrefOf } from '@/lib/catalog';
import ExperiencePanel from '@/components/ExperiencePanel';

interface Props {
  params: Promise<{ country: string; city: string; experience: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.flatMap((country) =>
    country.cities.flatMap((city) =>
      city.experiences.map((experience) => ({
        country: country.slug,
        city: city.slug,
        experience: experience.slug,
      })),
    ),
  );
}

async function resolve(params: Props['params']) {
  const { country: countrySlug, city: citySlug, experience: experienceSlug } = await params;
  const country = findCountry(countrySlug);
  const city = findCity(country, citySlug);
  return findExperience(city, experienceSlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experience = await resolve(params);
  if (!experience) return {};
  return {
    title: `${experience.title} — ${experience.city.name}`,
    description: experience.blurb,
    alternates: { canonical: hrefOf.experience(experience) },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const experience = await resolve(params);
  if (!experience) notFound();

  // Dữ liệu có cấu trúc cho kết quả tìm kiếm — giá và đánh giá lấy từ đúng bản ghi đang bán.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: experience.title,
    description: experience.blurb,
    category: CAT_LABEL[experience.cat],
    offers: {
      '@type': 'Offer',
      price: experience.price,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: experience.rating,
      reviewCount: experience.reviews,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExperiencePanel experienceKey={experience.key} />
    </>
  );
}

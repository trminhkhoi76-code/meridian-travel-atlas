import { getExperience } from '@/lib/catalog-service';
import { toApiCitySummary, toApiCountrySummary, toApiExperience } from '@/lib/api';

interface Params {
  params: Promise<{ country: string; city: string; experience: string }>;
}

/** GET /api/countries/:country/cities/:city/experiences/:experience — chi tiết một trải nghiệm. */
export async function GET(_req: Request, { params }: Params) {
  const { country: countrySlug, city: citySlug, experience: experienceSlug } = await params;
  const experience = await getExperience(countrySlug, citySlug, experienceSlug);
  if (!experience) {
    return Response.json({ error: 'Không tìm thấy trải nghiệm' }, { status: 404 });
  }
  return Response.json({
    country: toApiCountrySummary(experience.country),
    city: toApiCitySummary(experience.city),
    experience: toApiExperience(experience),
  });
}

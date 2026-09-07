import { getCity } from '@/lib/catalog-service';
import { toApiCity, toApiCountrySummary } from '@/lib/api';

interface Params {
  params: Promise<{ country: string; city: string }>;
}

/** GET /api/countries/:country/cities/:city — chi tiết một thành phố, gồm trải nghiệm. */
export async function GET(_req: Request, { params }: Params) {
  const { country: countrySlug, city: citySlug } = await params;
  const city = await getCity(countrySlug, citySlug);
  if (!city) {
    return Response.json({ error: 'Không tìm thấy thành phố' }, { status: 404 });
  }
  return Response.json({
    country: toApiCountrySummary(city.country),
    city: toApiCity(city),
  });
}

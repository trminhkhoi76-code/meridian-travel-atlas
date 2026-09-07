import { getCountries } from '@/lib/catalog-service';
import { toApiCountry } from '@/lib/api';

/** GET /api/countries — toàn bộ danh mục (nước → thành phố → trải nghiệm). */
export async function GET() {
  const countries = await getCountries();
  return Response.json(countries.map(toApiCountry));
}

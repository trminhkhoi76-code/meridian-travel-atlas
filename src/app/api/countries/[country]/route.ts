import { getCountry } from '@/lib/catalog-service';
import { toApiCountry } from '@/lib/api';

interface Params {
  params: Promise<{ country: string }>;
}

/** GET /api/countries/:country — chi tiết một quốc gia, gồm thành phố + trải nghiệm. */
export async function GET(_req: Request, { params }: Params) {
  const country = await getCountry((await params).country);
  if (!country) {
    return Response.json({ error: 'Không tìm thấy quốc gia' }, { status: 404 });
  }
  return Response.json(toApiCountry(country));
}

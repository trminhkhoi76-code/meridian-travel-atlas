/**
 * Lớp truy cập dữ liệu duy nhất phía server — trang (SSG), route handler
 * (/api/*) và layout đều gọi qua đây, không đọc thẳng seed data.
 *
 * Vì sao trang không tự fetch(/api/...): lúc `next build` dựng các trang
 * tĩnh, chưa có server nào của chính app này đang lắng nghe để nhận request
 * — gọi fetch tới route handler của chính mình lúc build sẽ ra ngoài mạng
 * thật và luôn thất bại (đã kiểm chứng). Route handler dưới `app/api` vẫn là
 * API thật, gọi được qua HTTP lúc runtime (curl, fetch từ client...); các
 * hàm dưới đây chỉ là nơi DUY NHẤT cần sửa khi thay API giả này bằng backend
 * thật — đổi phần thân hàm sang `fetch(`${process.env.API_BASE_URL}/...`)`,
 * mọi nơi gọi getCountries/getCountry/... ở trên (trang, route handler,
 * layout) không cần đổi gì.
 */

import { buildCatalog } from './seed';
import type { City, Country, Experience } from './catalog';
import { findCity, findCountry, findExperience } from './catalog';

let cache: Country[] | null = null;

async function all(): Promise<Country[]> {
  if (!cache) cache = buildCatalog();
  return cache;
}

export async function getCountries(): Promise<Country[]> {
  return all();
}

export async function getCountry(slug: string): Promise<Country | undefined> {
  return findCountry(await all(), slug);
}

export async function getCity(countrySlug: string, citySlug: string): Promise<City | undefined> {
  const country = findCountry(await all(), countrySlug);
  return findCity(country, citySlug);
}

export async function getExperience(
  countrySlug: string,
  citySlug: string,
  experienceSlug: string,
): Promise<Experience | undefined> {
  const country = findCountry(await all(), countrySlug);
  const city = findCity(country, citySlug);
  return findExperience(city, experienceSlug);
}

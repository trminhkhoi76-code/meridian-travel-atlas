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
import type { City, Country, Experience, Place } from './catalog';
import { allExperiences, findCity, findCountry, findPlace } from './catalog';

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

export async function getPlace(countrySlug: string, citySlug: string, placeSlug: string): Promise<Place | undefined> {
  return findPlace(await getCity(countrySlug, citySlug), placeSlug);
}

/** Trải nghiệm theo slug — slug là duy nhất toàn danh mục (seed.ts kiểm tra lúc build). */
export async function getExperience(slug: string): Promise<Experience | undefined> {
  return allExperiences(await all()).find((e) => e.slug === slug);
}

/** URL cũ `/<quốc gia>/<thành phố>/<trải nghiệm>` — chỉ để redirect sang `/trai-nghiem/<slug>`. */
export async function getExperienceIn(citySlugPath: { country: string; city: string }, slug: string) {
  const city = await getCity(citySlugPath.country, citySlugPath.city);
  return city?.experiences.find((e) => e.slug === slug);
}

let byKey: Map<string, Experience> | null = null;

/** Bảng tra `Experience.key` -> Experience, cho trang admin và route handler. */
export async function getExperienceIndex(): Promise<Map<string, Experience>> {
  if (!byKey) {
    // Dựng xong rồi mới gán: các lời gọi song song (Promise.all) không được thấy map dở dang.
    const map = new Map<string, Experience>();
    for (const experience of allExperiences(await all())) map.set(experience.key, experience);
    byKey = map;
  }
  return byKey;
}

/** Tra theo `Experience.key` — dùng khi client gửi lên danh sách khoá (giỏ hàng). */
export async function getExperienceByKey(key: string): Promise<Experience | undefined> {
  return (await getExperienceIndex()).get(key);
}

/**
 * Kiểu dữ liệu và tiện ích thuần cho danh mục sản phẩm — không chứa dữ liệu.
 * Dữ liệu thật (bản ghi mẫu) nằm ở [seed.ts](./seed.ts) và chỉ được đọc phía
 * server, qua [catalog-service.ts](./catalog-service.ts); phía UI (trang,
 * component) luôn nhận Country/City/Place/Experience đã dựng sẵn — qua service
 * đó lúc build/SSG, hoặc qua CatalogProvider phía client.
 *
 * Bốn cấp: Quốc gia → Thành phố → Địa điểm (có toạ độ thật) → Trải nghiệm (sản
 * phẩm bán, luôn gắn với đúng một địa điểm).
 */

export type Cat = 'STAY' | 'TRAIL' | 'TABLE' | 'STUDIO' | 'PASSAGE';

/** Thứ tự hiển thị danh mục ở mọi nơi (trang chủ, thanh danh mục, chip lọc). */
export const CAT_ORDER: Cat[] = ['STAY', 'PASSAGE', 'TABLE', 'STUDIO', 'TRAIL'];

export const CAT_LABEL: Record<Cat, string> = {
  STAY: 'Lưu trú',
  TRAIL: 'Đường mòn',
  TABLE: 'Ẩm thực',
  STUDIO: 'Xưởng nghề',
  PASSAGE: 'Khám phá',
};

/** Danh từ đếm: "16 chỗ ở", "7 lớp học". */
export const CAT_NOUN: Record<Cat, string> = {
  STAY: 'chỗ ở',
  TRAIL: 'cung đường',
  TABLE: 'bữa ăn',
  STUDIO: 'lớp học',
  PASSAGE: 'hoạt động',
};

export const CAT_SLUG: Record<Cat, string> = {
  STAY: 'luu-tru',
  TRAIL: 'duong-mon',
  TABLE: 'am-thuc',
  STUDIO: 'xuong-nghe',
  PASSAGE: 'kham-pha',
};

export const CAT_BLURB: Record<Cat, string> = {
  STAY: 'Ryokan, hanok, riad, nhà trình tường — chỗ ở mang đúng chất nơi bạn đến.',
  TRAIL: 'Đường mòn ven biển, sống núi và rừng mưa, có người dẫn đường bản địa.',
  TABLE: 'Chợ sáng, bàn omakase và bữa ăn nấu ngay tại vườn.',
  STUDIO: 'Học nghề với người làm nghề: trà đạo, gạch zellige, đồng hồ cơ, dệt len.',
  PASSAGE: 'Những buổi đi bộ, đi thuyền, đi tàu tới đúng chỗ, đúng giờ đẹp nhất.',
};

export function catFromSlug(slug: string): Cat | undefined {
  return (Object.keys(CAT_SLUG) as Cat[]).find((c) => CAT_SLUG[c] === slug);
}

export const CAT_INCLUDES: Record<Cat, string[]> = {
  STAY: ['Hai đêm, gồm bữa sáng cho hai khách', 'Đưa đón sân bay riêng', 'Giữ phòng đến 14:00 ngày trả'],
  TRAIL: ['Hướng dẫn viên bản địa có chứng chỉ', 'Toàn bộ vé và phí vào khu bảo tồn', 'Gậy, áo khoác và bữa trưa mang theo'],
  TABLE: ['Trọn thực đơn kèm đồ uống pairing', 'Giữ bàn trong hai giờ', 'Ghé bếp gặp đầu bếp sau bữa'],
  STUDIO: ['Toàn bộ nguyên liệu và phí nung', 'Nhóm tối đa sáu người', 'Gửi thành phẩm về tận nhà'],
  PASSAGE: ['Hướng dẫn viên tiếng Việt', 'Toàn bộ vé vào cửa và di chuyển tại điểm', 'Nhóm tối đa mười hai khách'],
};

/** `date` là nhãn hiển thị (không có năm); `iso` là ngày thật, dùng cho lịch khởi hành của admin. */
export const DEPARTURES: Array<{ date: string; day: string; iso: string }> = [
  { date: '09.10', day: 'Thứ 6', iso: '2026-10-09' },
  { date: '23.10', day: 'Thứ 6', iso: '2026-10-23' },
  { date: '06.11', day: 'Thứ 6', iso: '2026-11-06' },
];

/** [kinh độ, vĩ độ] — cùng thứ tự với GeoJSON và d3-geo. */
export type LngLat = [number, number];

export interface Experience {
  key: string;
  slug: string;
  title: string;
  cat: Cat;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  blurb: string;
  place: Place;
  city: City;
  country: Country;
}

export interface Place {
  key: string;
  slug: string;
  name: string;
  /** "Bãi biển · Bờ tây" */
  kind: string;
  coord: LngLat;
  blurb: string;
  /** Trải nghiệm bán tại đây; rỗng = điểm tham quan tự do. */
  experiences: Experience[];
  city: City;
  country: Country;
}

export interface City {
  key: string;
  slug: string;
  name: string;
  coord: LngLat;
  blurb: string;
  from: number;
  places: Place[];
  experiences: Experience[];
  country: Country;
}

export interface Country {
  key: string;
  slug: string;
  id: string;
  name: string;
  native: string;
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  from: number;
  cities: City[];
}

/** Bỏ dấu tiếng Việt để làm slug URL: "Mã Pí Lèng" -> "ma-pi-leng". */
export function slugify(input: string): string {
  const stripped = Array.from(input.normalize('NFD'))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x300 || code > 0x36f; // bỏ toàn bộ dấu thanh + dấu phụ
    })
    .join('');
  return stripped
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCountry(countries: Country[], slug?: string): Country | undefined {
  return countries.find((c) => c.slug === slug);
}
export function findCity(country: Country | undefined, slug?: string): City | undefined {
  return country?.cities.find((t) => t.slug === slug);
}
export function findPlace(city: City | undefined, slug?: string): Place | undefined {
  return city?.places.find((p) => p.slug === slug);
}

export function allExperiences(countries: Country[]): Experience[] {
  return countries.flatMap((c) => c.cities.flatMap((t) => t.experiences));
}
export function allPlaces(countries: Country[]): Place[] {
  return countries.flatMap((c) => c.cities.flatMap((t) => t.places));
}

/** Đánh giá cao trước, cùng điểm thì nhiều lượt đánh giá hơn trước. */
export function byRating(a: Experience, b: Experience): number {
  return b.rating - a.rating || b.reviews - a.reviews;
}

/** Khoảng cách mặt cầu, km. */
export function distanceKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Đường dẫn của từng nút. Ba cấp đầu lồng nhau theo cây (`/viet-nam/phu-quoc/bai-ong-lang`);
 * trải nghiệm là sản phẩm nên có URL phẳng, không đổi khi địa điểm được sắp xếp lại.
 */
export const hrefOf = {
  home: () => '/',
  country: (c: Country) => `/${c.slug}`,
  city: (t: City) => `/${t.country.slug}/${t.slug}`,
  place: (p: Place) => `/${p.country.slug}/${p.city.slug}/${p.slug}`,
  experience: (e: Experience) => `/trai-nghiem/${e.slug}`,
  category: (cat: Cat) => `/danh-muc/${CAT_SLUG[cat]}`,
  gallery: () => '/thu-vien-anh',
  itinerary: () => '/hanh-trinh',
  cart: () => '/gio-hang',
  search: (q?: string) => (q ? `/tim-kiem?q=${encodeURIComponent(q)}` : '/tim-kiem'),
};

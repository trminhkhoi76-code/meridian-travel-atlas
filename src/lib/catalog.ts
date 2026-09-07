/**
 * Kiểu dữ liệu và tiện ích thuần cho danh mục sản phẩm — không chứa dữ liệu.
 * Dữ liệu thật (bản ghi mẫu) nằm ở [seed.ts](./seed.ts) và chỉ được đọc phía
 * server, qua [catalog-service.ts](./catalog-service.ts); phía UI (trang,
 * component) luôn nhận Country/City/Experience đã dựng sẵn — qua service đó
 * lúc build/SSG, hoặc qua CatalogProvider phía client.
 */

export type Cat = 'STAY' | 'TRAIL' | 'TABLE' | 'STUDIO' | 'PASSAGE';

export const CAT_LABEL: Record<Cat, string> = {
  STAY: 'Lưu trú',
  TRAIL: 'Đường mòn',
  TABLE: 'Ẩm thực',
  STUDIO: 'Xưởng nghề',
  PASSAGE: 'Khám phá',
};

export const CAT_INCLUDES: Record<Cat, string[]> = {
  STAY: ['Hai đêm, gồm bữa sáng cho hai khách', 'Đưa đón sân bay riêng', 'Giữ phòng đến 14:00 ngày trả'],
  TRAIL: ['Hướng dẫn viên bản địa có chứng chỉ', 'Toàn bộ vé và phí vào khu bảo tồn', 'Gậy, áo khoác và bữa trưa mang theo'],
  TABLE: ['Trọn thực đơn kèm đồ uống pairing', 'Giữ bàn trong hai giờ', 'Ghé bếp gặp đầu bếp sau bữa'],
  STUDIO: ['Toàn bộ nguyên liệu và phí nung', 'Nhóm tối đa sáu người', 'Gửi thành phẩm về tận nhà'],
  PASSAGE: ['Hướng dẫn viên tiếng Việt', 'Toàn bộ vé vào cửa và di chuyển tại điểm', 'Nhóm tối đa mười hai khách'],
};

export const DEPARTURES: Array<{ date: string; day: string }> = [
  { date: '09.10', day: 'Thứ 6' },
  { date: '23.10', day: 'Thứ 6' },
  { date: '06.11', day: 'Thứ 6' },
];

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
  city: City;
  country: Country;
}

export interface City {
  key: string;
  slug: string;
  name: string;
  coord: [number, number];
  blurb: string;
  from: number;
  experiences: Experience[];
  country: Country;
}

export interface Country {
  key: string;
  slug: string;
  id: string;
  name: string;
  native: string;
  coord: [number, number];
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
export function findExperience(city: City | undefined, slug?: string): Experience | undefined {
  return city?.experiences.find((e) => e.slug === slug);
}

/** Đường dẫn của một nút bất kỳ — URL chính là trạng thái zoom. */
export const hrefOf = {
  world: () => '/',
  country: (c: Country) => `/${c.slug}`,
  city: (t: City) => `/${t.country.slug}/${t.slug}`,
  experience: (e: Experience) => `/${e.country.slug}/${e.city.slug}/${e.slug}`,
  itinerary: () => '/hanh-trinh',
};

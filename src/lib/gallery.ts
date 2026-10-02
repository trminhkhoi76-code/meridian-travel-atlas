/**
 * Thư viện ảnh cộng đồng — HỢP ĐỒNG + DỮ LIỆU MẪU. Chưa có kho ảnh: các mục dưới đây
 * là ảnh mẫu (ô màu giữ chỗ, tên người đăng là ví dụ) để dựng bố cục, đánh dấu
 * `sample: true` và trang hiện nhãn "Ảnh mẫu". Ảnh khách gửi qua hộp thoại Đăng ảnh
 * đi tới POST /api/photos (xem app/api/photos/route.ts).
 *
 * File này dùng được ở cả client lẫn server: không import gì chỉ-có-ở-server.
 */

export interface GalleryPhoto {
  id: string;
  /** Place.key */
  place: string;
  author: string;
  /** "tháng 2" */
  when: string;
  /** Chiều cao ô trong lưới so le, px ở desktop. */
  h: number;
  sample: true;
}

/** [place key, người đăng, tháng, chiều cao] */
const RAW: Array<[string, string, string, number]> = [
  ['c0t0p1', 'Minh Anh', 'tháng 3', 360],
  ['c0t2p0', 'Quốc Bảo', 'tháng 2', 240],
  ['c1t0p1', 'Thu Hà', 'tháng 11', 300],
  ['c2t2p1', 'Gia Huy', 'tháng 5', 220],
  ['c3t0p1', 'Lan Chi', 'tháng 8', 340],
  ['c4t1p0', 'Đức Minh', 'tháng 4', 260],
  ['c0t1p0', 'Bảo Ngọc', 'tháng 1', 300],
  ['c5t0p2', 'Hoàng Long', 'tháng 10', 240],
  ['c1t1p0', 'Khánh Linh', 'tháng 12', 220],
  ['c2t1p0', 'Phương Thảo', 'tháng 9', 320],
  ['c4t2p0', 'Tuấn Kiệt', 'tháng 3', 280],
  ['c0t2p1', 'Ngọc Trâm', 'tháng 1', 220],
  ['c0t2p0', 'Minh Anh', 'tháng 2', 280],
  ['c0t2p0', 'Thu Hà', 'tháng 12', 230],
  ['c0t0p0', 'Gia Huy', 'tháng 10', 260],
  ['c1t0p0', 'Lan Chi', 'tháng 11', 320],
];

export const GALLERY: GalleryPhoto[] = RAW.map(([place, author, when, h], i) => ({
  id: `s${i + 1}`,
  place,
  author,
  when,
  h,
  sample: true,
}));

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------ đăng ảnh ------------------------------ */

export const PHOTO_ENDPOINT = '/api/photos';
export const MAX_PHOTOS = 10;
export const MAX_CAPTION = 280;
export const PHOTO_TAGS = ['Bãi biển', 'Hoàng hôn', 'Núi', 'Phố cổ', 'Ẩm thực', 'Lưu trú', 'Chợ', 'Thiên nhiên'];

export interface PhotoSubmission {
  /** Place.key */
  place: string;
  caption: string;
  tags: string[];
  /** Số ảnh và tên file — bản giả lập chưa nhận nội dung file. */
  files: Array<{ name: string; size: number; type: string }>;
  consent: boolean;
}

export type PhotoErrors = Partial<Record<'place' | 'caption' | 'files' | 'consent', string>>;

export function validatePhotos(raw: unknown, placeExists: (key: string) => boolean):
  | { ok: true; value: PhotoSubmission }
  | { ok: false; errors: PhotoErrors } {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: PhotoErrors = {};
  const place = typeof src.place === 'string' ? src.place : '';
  if (!place || !placeExists(place)) errors.place = 'Chọn một địa điểm trong danh sách.';
  const caption = typeof src.caption === 'string' ? src.caption.trim() : '';
  if (caption.length > MAX_CAPTION) errors.caption = `Chú thích tối đa ${MAX_CAPTION} ký tự.`;
  const tags = Array.isArray(src.tags) ? src.tags.filter((t): t is string => PHOTO_TAGS.includes(t as string)) : [];
  const files = Array.isArray(src.files)
    ? src.files
        .filter((f): f is { name: string; size: number; type: string } =>
          Boolean(f) && typeof f.name === 'string' && typeof f.size === 'number' && typeof f.type === 'string')
        .filter((f) => f.type.startsWith('image/'))
    : [];
  if (files.length === 0) errors.files = 'Chọn ít nhất một ảnh.';
  else if (files.length > MAX_PHOTOS) errors.files = `Tối đa ${MAX_PHOTOS} ảnh mỗi lần.`;
  if (src.consent !== true) errors.consent = 'Cần xác nhận bạn là người chụp.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { place, caption, tags, files, consent: true } };
}

import type { Cat } from './catalog';

/**
 * Ảnh sản phẩm còn là chỗ trống, nên mỗi phân loại có một dải màu riêng để
 * hàng nào cũng nhận ra được ngay. Thay bằng ảnh thật khi có CDN.
 */
const GRADIENT: Record<Cat, string> = {
  STAY: 'linear-gradient(150deg,#3B4A3F 0%,#8FA07F 56%,#E4D8B4 100%)',
  TRAIL: 'linear-gradient(150deg,#1F4A46 0%,#4E8A72 52%,#C3D5A8 100%)',
  TABLE: 'linear-gradient(150deg,#5A2A1C 0%,#B4642F 56%,#F0C68E 100%)',
  STUDIO: 'linear-gradient(150deg,#3A2B3E 0%,#86607A 54%,#DCBEB6 100%)',
  PASSAGE: 'linear-gradient(150deg,#123A4C 0%,#3E7F95 54%,#B9D8D8 100%)',
};

const GRAIN =
  'repeating-linear-gradient(115deg,rgba(255,255,255,.06) 0 1.5px,rgba(0,0,0,.05) 1.5px 3px),';

export function swatch(cat: Cat): string {
  return GRAIN + GRADIENT[cat];
}

/**
 * Ảnh vẫn là chỗ trống (chưa có CDN ảnh thật): mỗi ô ảnh là một mảng màu nhạt
 * kèm chú thích "Ảnh · <nơi chụp>", đúng như bản thiết kế. Màu chọn theo khoá
 * nên server và client luôn ra cùng một màu.
 *
 * Khi có ảnh thật: thay `Photo` (components/Photo.tsx) bằng <Image>, giữ nguyên
 * chỗ gọi — mọi nơi đã truyền sẵn chú thích làm alt.
 */

export const TINTS = ['#D3E2D0', '#E7D6D0', '#DCE3EE', '#E1DED7', '#EEE2CB', '#CFE3E8'] as const;

export function tintOf(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

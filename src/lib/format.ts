/** Định dạng số và toạ độ. Viết tay thay vì Intl để server và client luôn ra
 *  cùng một chuỗi — tránh lệch khi hydrate. */

function groupThousands(value: number): string {
  const digits = Math.round(Math.abs(value)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return (value < 0 ? '-' : '') + out;
}

/** 3900000 -> "3.900.000 ₫" */
export function vnd(value: number): string {
  return groupThousands(value) + ' ₫';
}

/** 3900000 -> "3,9 tr" — dùng cho nhãn ghim trên bản đồ, nơi chỗ rất hẹp. */
export function vndShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const s = (m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, ''));
    return s.replace('.', ',') + ' tr';
  }
  return groupThousands(value / 1000) + 'k';
}

const decimal = (value: number, digits: number) => value.toFixed(digits).replace('.', ',');

export function coordLabel([lng, lat]: [number, number]): string {
  const ns = lat >= 0 ? 'B' : 'N'; // Bắc / Nam
  const ew = lng >= 0 ? 'Đ' : 'T'; // Đông / Tây
  return `${decimal(Math.abs(lat), 3)}° ${ns}  ${decimal(Math.abs(lng), 3)}° ${ew}`;
}

/** Một giá trị toạ độ lẻ cho dải số đo, ví dụ "22,82° B". */
export function degreeLabel(value: number, positive: string, negative: string): string {
  return `${decimal(Math.abs(value), 2)}° ${value >= 0 ? positive : negative}`;
}

/** Mẫu số tỉ lệ bản đồ, quy đổi theo 96 dpi: 337 px/rad -> "1:71,0 M". */
export function scaleLabel(pixelsPerRadian: number): string {
  const denominator = (6_371_000 / pixelsPerRadian) * 3779.5;
  return '1:' + (denominator / 1e6).toFixed(1).replace('.', ',') + 'M';
}

export function ratingLabel(rating: number): string {
  return rating.toFixed(1).replace('.', ',');
}

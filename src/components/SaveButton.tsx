'use client';

import { IconHeart } from './Icons';
import { useTrip } from './TripProvider';

/**
 * "Lưu" = thêm vào hành trình. Dùng được cho thành phố (City.key), địa điểm
 * (Place.key) hoặc trải nghiệm (Experience.key) — TripProvider tự xếp vào đúng
 * điểm dừng. Trước khi đọc xong localStorage nút luôn ở trạng thái chưa lưu,
 * khớp với HTML server render.
 */
export default function SaveButton({
  itemKey,
  label,
  variant = 'icon',
  className,
}: {
  itemKey: string;
  label: string;
  variant?: 'icon' | 'button' | 'float';
  /** Với variant `button`: lớp nút thay cho `btn-s` (ví dụ `btn-w btn-block`). */
  className?: string;
}) {
  const { inTrip, toggleSaved, ready } = useTrip();
  const saved = ready && inTrip(itemKey);
  const aria = saved ? `Bỏ ${label} khỏi hành trình` : `Lưu ${label} vào hành trình`;

  if (variant === 'button') {
    return (
      <button type="button" className={(className ?? 'btn-s') + ' heart press'} aria-pressed={saved} onClick={() => toggleSaved(itemKey, label)}>
        <IconHeart size={18} />
        {saved ? 'Đã lưu vào hành trình' : 'Lưu vào hành trình'}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={(variant === 'float' ? 'gx-save hov' : 'icon-btn') + (saved && variant === 'float' ? ' keep' : '') + ' heart press'}
      aria-pressed={saved}
      aria-label={aria}
      title={aria}
      onClick={() => toggleSaved(itemKey, label)}
    >
      <IconHeart size={variant === 'float' ? 18 : 20} />
    </button>
  );
}

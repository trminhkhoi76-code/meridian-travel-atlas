import { tintOf } from '@/lib/photo';

/**
 * Ô ảnh giữ chỗ: mảng màu nhạt + chú thích nơi chụp. `label` vừa là chú thích
 * vừa là mô tả cho trình đọc màn hình — khi có ảnh thật, đổi thân component này
 * sang <Image alt={label}> là đủ.
 */
export default function Photo({
  label,
  seed,
  caption = true,
  className,
  style,
  children,
}: {
  label: string;
  seed?: string;
  caption?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={'ph' + (className ? ' ' + className : '')}
      role="img"
      aria-label={`Ảnh minh hoạ: ${label}`}
      style={{ ['--tint' as string]: tintOf(seed ?? label), ...style }}
    >
      {caption && <span className="ph-cap" aria-hidden="true">Ảnh · {label}</span>}
      {children}
    </div>
  );
}

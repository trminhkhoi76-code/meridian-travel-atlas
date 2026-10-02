import type { MapRegion } from '@/lib/map';

/**
 * Khung bản đồ: nền biển, đất vẽ sẵn (SVG), và lớp ghim (`children`) đặt theo %
 * của khung vuông bên trong. Không có JS — trang nào cần tương tác thì truyền
 * ghim là <button> vào children.
 */
export default function MapView({
  region,
  label,
  note = 'Bản đồ minh hoạ · vị trí theo toạ độ thật',
  className,
  overlay,
  children,
}: {
  region: MapRegion;
  label: string;
  note?: string | null;
  className?: string;
  /** Phủ trên khung ngoài (không theo toạ độ) — ví dụ thẻ xem nhanh. */
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={'map' + (className ? ' ' + className : '')} role="group" aria-label={label}>
      <div className="map-in">
        <svg viewBox={`0 0 ${region.size} ${region.size}`} aria-hidden="true" focusable="false">
          <path className={region.focus ? 'land-other' : 'land'} d={region.land} />
          {region.focus && <path className="land" d={region.focus} />}
        </svg>
        {children}
      </div>
      {overlay}
      {note && <span className="map-note">{note}</span>}
    </div>
  );
}

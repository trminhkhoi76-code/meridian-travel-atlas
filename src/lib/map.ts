/**
 * Bản đồ vẽ sẵn (scripts/build-maps.mjs) — mỗi vùng là khung vuông `size`×`size`
 * theo Mercator, kèm tham số phép chiếu để chiếu ghim bằng đúng công thức đã vẽ
 * đường bờ. Không cần d3 ở trình duyệt: Mercator chỉ là hai dòng toán.
 *
 * Ghim được đặt theo % của khung, nên khung hiển thị phải giữ tỉ lệ vuông
 * (`.map-frame` trong globals.css) — đất được vẽ tràn ra ngoài khung để khung
 * chứa dài hơn hay rộng hơn vẫn liền mạch.
 */

import type { LngLat } from './catalog';

export interface MapRegion {
  size: number;
  k: number;
  tx: number;
  ty: number;
  /** Đất (đường bờ 1:10m ở cấp thành phố; các nước khác ở cấp quốc gia). */
  land: string;
  /** Chỉ cấp quốc gia: chính quốc gia đó, tô nổi. */
  focus?: string;
}

/** Toạ độ trong khung `size`×`size`. */
export function project(region: MapRegion, [lng, lat]: LngLat): [number, number] {
  const rad = Math.PI / 180;
  const x = region.k * lng * rad + region.tx;
  const y = region.ty - region.k * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
  return [x, y];
}

/** Toạ độ theo % khung, làm tròn để server và client ra cùng một chuỗi style. */
export function projectPct(region: MapRegion, coord: LngLat): { left: string; top: string } {
  const [x, y] = project(region, coord);
  const pct = (v: number) => `${Math.round((v / region.size) * 10000) / 100}%`;
  return { left: pct(x), top: pct(y) };
}

export interface Cluster<T> {
  /** Toạ độ trong khung — tâm trung bình của các điểm trong cụm. */
  x: number;
  y: number;
  items: T[];
}

/**
 * Gom các điểm gần nhau hơn `radius` (đơn vị khung) thành cụm. Tham lam theo thứ
 * tự đầu vào — đủ cho vài chục điểm mỗi bản đồ; nhãn không bao giờ đẩy lệch ghim
 * vì cụm luôn đặt đúng tâm các điểm của nó.
 */
export function cluster<T>(region: MapRegion, items: T[], coordOf: (item: T) => LngLat, radius = 34): Cluster<T>[] {
  const out: Cluster<T>[] = [];
  for (const item of items) {
    const [x, y] = project(region, coordOf(item));
    const near = out.find((c) => (c.x - x) ** 2 + (c.y - y) ** 2 < radius * radius);
    if (near) {
      near.items.push(item);
      const n = near.items.length;
      near.x += (x - near.x) / n;
      near.y += (y - near.y) / n;
    } else {
      out.push({ x, y, items: [item] });
    }
  }
  return out;
}

export const pctOf = (region: MapRegion, v: number) => `${Math.round((v / region.size) * 10000) / 100}%`;

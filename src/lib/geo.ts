import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiLineString, Geometry, Point } from 'geojson';

export type Level = 'world' | 'country' | 'city' | 'experience';

/** Hệ số zoom của từng cấp, nhân với bán kính cơ sở của khung nhìn. */
export const LEVEL_FACTOR: Record<Level, number> = {
  world: 1,
  country: 3.1,
  city: 9.4,
  experience: 11.6,
};

export const LEVEL_LABEL: Record<Level, string> = {
  world: '00 / QUỸ ĐẠO',
  country: '01 / QUỐC GIA',
  city: '02 / THÀNH PHỐ',
  experience: '03 / TRẢI NGHIỆM',
};

export interface WorldGeometry {
  land: FeatureCollection<Geometry, { name: string }>;
  borders: MultiLineString;
  byId: Map<string, Feature<Geometry, { name: string }>>;
}

type CountryTopology = Topology<{ countries: GeometryCollection<{ name: string }> }>;

/** Polygon/MultiPolygon -> danh sách vành đai đa giác, để gộp các mảnh cùng id. */
function ringsOf(g: Geometry): number[][][][] {
  if (g.type === 'Polygon') return [g.coordinates as unknown as number[][][]];
  if (g.type === 'MultiPolygon') return g.coordinates as unknown as number[][][][];
  return [];
}

export function buildGeometry(topology: CountryTopology): WorldGeometry {
  const land = feature(topology, topology.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >;
  const borders = mesh(topology, topology.objects.countries, (a, b) => a !== b);

  // Một số quốc gia (vd. Úc ở bản 50m) tách thành nhiều feature cùng id — đảo
  // nhỏ ngoài khơi lưu riêng khỏi lục địa chính. Gộp lại thành một MultiPolygon
  // duy nhất mỗi id, nếu không "quốc gia đang chọn" chỉ tô đúng mảnh cuối cùng.
  const byId = new Map<string, Feature<Geometry, { name: string }>>();
  for (const f of land.features) {
    const id = String(f.id);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, f);
      continue;
    }
    existing.geometry = {
      type: 'MultiPolygon',
      coordinates: [...ringsOf(existing.geometry), ...ringsOf(f.geometry)],
    } as Geometry;
  }

  return { land, borders, byId };
}

export async function loadGeometry(url: string): Promise<WorldGeometry> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được hình thể bản đồ: ${url}`);
  return buildGeometry((await res.json()) as CountryTopology);
}

/**
 * Địa hình trừu tượng — sông/hồ/đỉnh núi thật (Natural Earth), lọc sẵn quanh
 * sáu quốc gia trong catalogue để giữ file nhẹ. Chỉ vẽ từ cấp quốc gia trở
 * xuống; GeoJSON thuần, không cần dựng mesh như biên giới quốc gia.
 */
export interface TerrainGeometry {
  rivers: FeatureCollection<Geometry, { name: string | null }>;
  lakes: FeatureCollection<Geometry, { name: string | null }>;
  peaks: FeatureCollection<Point, { name: string | null; elevation: number }>;
}

export async function loadTerrain(url: string): Promise<TerrainGeometry> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được dữ liệu địa hình: ${url}`);
  return (await res.json()) as TerrainGeometry;
}

export function easeCubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

/**
 * Đổi một khoảng lệch tính bằng pixel trên màn hình thành lng/lat, để các ghim
 * trải nghiệm nằm đúng chỗ quanh thành phố mà vẫn xoay cùng quả cầu.
 */
export function offsetLngLat(
  [lng, lat]: [number, number],
  dx: number,
  dy: number,
  pixelsPerRadian: number,
): [number, number] {
  const k = 180 / Math.PI / pixelsPerRadian;
  const nextLat = clamp(lat - dy * k, -88, 88);
  const shrink = Math.max(0.2, Math.cos((nextLat * Math.PI) / 180));
  return [lng + (dx * k) / shrink, nextLat];
}

/** Vị trí các ghim trải nghiệm quanh tâm thành phố, tính bằng pixel. */
export const EXPERIENCE_OFFSETS: Array<[number, number]> = [
  [-128, -64],
  [110, -8],
  [-44, 86],
];

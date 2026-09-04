import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiLineString, Geometry } from 'geojson';

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

export function buildGeometry(topology: CountryTopology): WorldGeometry {
  const land = feature(topology, topology.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >;
  const borders = mesh(topology, topology.objects.countries, (a, b) => a !== b);
  return {
    land,
    borders,
    byId: new Map(land.features.map((f) => [String(f.id), f])),
  };
}

export async function loadGeometry(url: string): Promise<WorldGeometry> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được hình thể bản đồ: ${url}`);
  return buildGeometry((await res.json()) as CountryTopology);
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

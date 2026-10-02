import { geoBounds, geoDistance } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, LineString, MultiLineString, Geometry, Point } from 'geojson';

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

/** Hộp bao kinh/vĩ độ như `geoBounds` trả về; x0 > x1 nghĩa là hộp vắt qua kinh tuyến 180. */
export type GeoBox = [[number, number], [number, number]];

export interface WorldGeometry {
  land: FeatureCollection<Geometry, { name: string }>;
  borders: MultiLineString;
  byId: Map<string, Feature<Geometry, { name: string }>>;
  /** Hộp bao của từng feature trong `land`, để bỏ qua nước nằm ngoài khung nhìn khi vẽ. */
  boxes: Map<Feature, GeoBox>;
  /** `borders` tách thành từng đoạn kèm hộp bao, cùng lý do với `boxes`. */
  borderLines: Array<{ line: LineString; box: GeoBox }>;
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

  // Tính sau khi gộp, để hộp của feature đã gộp phủ cả các mảnh đảo.
  const boxes = new Map<Feature, GeoBox>(land.features.map((f) => [f, geoBounds(f) as GeoBox]));
  const borderLines = borders.coordinates.map((coordinates) => {
    const line: LineString = { type: 'LineString', coordinates };
    return { line, box: geoBounds(line) as GeoBox };
  });

  return { land, borders, byId, boxes, borderLines };
}

/** Lệch kinh độ a − b, quy về [-180, 180]. */
const lonDelta = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/**
 * Khoảng cách góc (radian) ngắn nhất từ `centre` tới một điểm bất kỳ trong hộp.
 * Chính xác chứ không xấp xỉ: điểm gần nhất nằm trên cạnh kinh tuyến gần nhất,
 * hoặc ở điểm dừng atan2(tan φ, cos Δλ) kẹp vào khoảng vĩ độ, hoặc ở một trong
 * hai mép vĩ độ (khi Δλ > 90° điểm dừng đó lại là điểm xa nhất).
 */
export function boxDistance(box: GeoBox, centre: [number, number]): number {
  const [[x0, y0], [x1, y1]] = box;
  if (x0 > x1) {
    return Math.min(boxDistance([[x0, y0], [180, y1]], centre), boxDistance([[-180, y0], [x1, y1]], centre));
  }
  const lon = lonDelta(centre[0], 0);
  const lat = centre[1];
  if (lon >= x0 && lon <= x1) {
    return lat < y0 ? (y0 - lat) * (Math.PI / 180) : lat > y1 ? (lat - y1) * (Math.PI / 180) : 0;
  }
  const edge = Math.abs(lonDelta(lon, x0)) <= Math.abs(lonDelta(lon, x1)) ? x0 : x1;
  const dLon = lonDelta(edge, lon) * (Math.PI / 180);
  const stationary = (Math.atan2(Math.tan(lat * (Math.PI / 180)), Math.cos(dLon)) * 180) / Math.PI;
  return Math.min(
    geoDistance([edge, clamp(stationary, y0, y1)], [lon, lat]),
    geoDistance([edge, y0], [lon, lat]),
    geoDistance([edge, y1], [lon, lat]),
  );
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
 * Vị trí các ghim trải nghiệm quanh tâm thành phố, tính bằng pixel màn hình.
 * Trải nghiệm không có toạ độ riêng — cả ba đều thật ra nằm ở toạ độ thành
 * phố; khoảng lệch này chỉ để tách ghim/nhãn ra cho khỏi đè lên nhau, không
 * quy đổi thành lng/lat nên không giả vờ là vị trí địa lý khác thành phố.
 */
export const EXPERIENCE_OFFSETS: Array<[number, number]> = [
  [-14, -9],
  [13, -4],
  [-5, 11],
];

/**
 * Dựng sẵn hình bản đồ cho từng thành phố, từng quốc gia và cả thế giới — chạy tay
 * khi đổi toạ độ trong seed.ts:   npm run maps
 *
 * Mỗi vùng là một khung vuông SIZE×SIZE theo phép chiếu Mercator, kèm tham số phép
 * chiếu (k, tx, ty) để trang tự chiếu ghim bằng `project()` trong src/lib/map.ts —
 * ghim và đường bờ biển dùng đúng một phép chiếu nên ghim luôn nằm đúng chỗ.
 * Hình đất được cắt rộng hơn khung (BLEED) để khung hiển thị khác tỉ lệ vẫn thấy
 * đất liền chạy tiếp ra ngoài, không bị cắt cụt.
 *
 * Nguồn: world-atlas@2.0.2 (Natural Earth) — 1:10m cho thành phố (tải về cache),
 * 1:50m cho quốc gia và 1:110m cho thế giới (có sẵn trong scripts/data).
 *
 * Đầu ra:
 *   src/lib/maps/regions.json  thành phố + quốc gia, chỉ server import (trang SSG)
 *   public/maps/trip.json      quốc gia + thế giới, trang Hành trình tải khi cần
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { geoContains, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

// seed.ts import './catalog' không có đuôi — thêm `.ts` cho resolver của Node.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      'export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith("."))return n(s+".ts",c);throw e}}',
    ),
);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache');
const LAND_10M_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-10m.json';

const SIZE = 1000;
const BLEED = 1000; // cắt đất rộng thêm 1000 đơn vị mỗi phía
const MIN_SPAN_KM = 6; // vùng thành phố hẹp nhất — một cụm điểm sát nhau không bị phóng to vô hạn

const { buildCatalog } = await import(join(ROOT, 'src', 'lib', 'seed.ts').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'));

async function load10m() {
  const file = join(CACHE, 'land-10m.json');
  if (!existsSync(file)) {
    console.log('tải', LAND_10M_URL);
    const res = await fetch(LAND_10M_URL);
    if (!res.ok) throw new Error(`tải land-10m thất bại: ${res.status}`);
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Bỏ các điểm cách điểm trước dưới `min` đơn vị — đường bờ 1:10m dày hơn mức cần vẽ. */
function thinned(projection, min = 0.9) {
  return {
    stream(out) {
      let px = 0;
      let py = 0;
      let first = true;
      const thin = {
        point(x, y) {
          if (first || (x - px) ** 2 + (y - py) ** 2 >= min * min) {
            out.point(x, y);
            px = x;
            py = y;
            first = false;
          }
        },
        lineStart() {
          first = true;
          out.lineStart();
        },
        lineEnd() {
          out.lineEnd();
        },
        polygonStart() {
          out.polygonStart();
        },
        polygonEnd() {
          out.polygonEnd();
        },
        sphere() {},
      };
      return projection.stream(thin);
    },
  };
}

function region(projection, layers, { bleed = BLEED, min = 0.9 } = {}) {
  projection.clipExtent([
    [-bleed, -bleed],
    [SIZE + bleed, SIZE + bleed],
  ]);
  const path = geoPath(thinned(projection, min)).digits(min >= 1.5 ? 0 : 1);
  const out = { size: SIZE, k: +projection.scale().toFixed(4), tx: +projection.translate()[0].toFixed(3), ty: +projection.translate()[1].toFixed(3) };
  // Kinh độ tính thẳng (không qua invert): invert quấn ±180° về phía bên kia, làm mép
  // trái/phải của khung thế giới (và khung Úc vượt 180°) đổi chỗ cho nhau.
  const lng = (x) => ((x - projection.translate()[0]) / projection.scale()) * (180 / Math.PI);
  const w = Math.max(-180, lng(-bleed));
  const e = Math.min(180, lng(SIZE + bleed));
  const n = projection.invert([0, -bleed])[1];
  const s = projection.invert([0, SIZE + bleed])[1];
  for (const [name, geo] of Object.entries(layers)) out[name] = path(nearby(geo, [w, s, e, n])) ?? '';
  return out;
}

/**
 * Chỉ giữ các đa giác có hộp bao (kinh/vĩ phẳng) chạm vùng vẽ. Ngoài việc nhẹ hơn, nó loại
 * Nam Cực: vòng ngoài của Nam Cực đi qua cực nên d3 coi phần bù là "trong", và clipExtent
 * trả về nguyên một hình chữ nhật phủ kín khung — biển biến mất.
 */
function nearby(geo, [w, s, e, n]) {
  const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
  const polygons = features.flatMap((f) => {
    const g = f.geometry ?? f;
    return g.type === 'MultiPolygon' ? g.coordinates : g.type === 'Polygon' ? [g.coordinates] : [];
  });
  const hit = polygons.filter((rings) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of rings[0]) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x1 - x0 > 300 && y0 < -60) return false; // vòng chạy quanh cả kinh tuyến ở cực nam — Nam Cực
    return x1 >= w && x0 <= e && y1 >= s && y0 <= n;
  });
  return { type: 'MultiPolygon', coordinates: hit };
}

/** Hộp bao quanh các điểm, nới tối thiểu MIN_SPAN_KM, trả về MultiPoint 4 góc để fit. */
function paddedBox(coords, minKm) {
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  let [x0, x1, y0, y1] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const midLat = (y0 + y1) / 2;
  const minLat = minKm / 111;
  const minLng = minKm / (111 * Math.cos((midLat * Math.PI) / 180));
  if (y1 - y0 < minLat) [y0, y1] = [midLat - minLat / 2, midLat + minLat / 2];
  if (x1 - x0 < minLng) {
    const m = (x0 + x1) / 2;
    [x0, x1] = [m - minLng / 2, m + minLng / 2];
  }
  return { type: 'MultiPoint', coordinates: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] };
}

const countries = buildCatalog();
const t10 = await load10m();
const land10 = feature(t10, t10.objects.land);
const t50 = JSON.parse(await readFile(join(ROOT, 'scripts', 'data', 'countries-50m.json'), 'utf8'));
const c50 = feature(t50, t50.objects.countries);
const t110 = JSON.parse(await readFile(join(ROOT, 'scripts', 'data', 'countries-110m.json'), 'utf8'));
const land110 = feature(t110, t110.objects.countries);

const cities = {};
const countryMaps = {};

for (const country of countries) {
  const shape = c50.features.find((f) => f.id === country.id);
  if (!shape) throw new Error(`countries-50m không có id ${country.id} (${country.name})`);
  const others = { type: 'FeatureCollection', features: c50.features.filter((f) => f !== shape) };

  // Chỉ fit theo những mảnh lãnh thổ có điểm đến — đảo xa (Macquarie của Úc…) không kéo giãn khung.
  const points = country.cities.flatMap((c) => [c.coord, ...c.places.map((p) => p.coord)]);
  const polys = shape.geometry.type === 'MultiPolygon' ? shape.geometry.coordinates : [shape.geometry.coordinates];
  const used = polys.filter((rings) =>
    points.some((pt) => geoContains({ type: 'Polygon', coordinates: rings }, pt)),
  );
  const fitTo = {
    type: 'GeometryCollection',
    geometries: [
      { type: 'MultiPolygon', coordinates: used.length ? used : polys },
      { type: 'MultiPoint', coordinates: points },
    ],
  };
  const pad = 90;
  const projection = geoMercator().fitExtent([[pad, pad], [SIZE - pad, SIZE - pad]], fitTo);
  countryMaps[country.slug] = region(projection, { land: others, focus: shape }, { bleed: 300, min: 4 });

  for (const city of country.cities) {
    const coords = city.places.map((p) => p.coord);
    const projectionCity = geoMercator().fitExtent(
      [[160, 160], [SIZE - 160, SIZE - 160]],
      paddedBox(coords, MIN_SPAN_KM),
    );
    cities[`${country.slug}/${city.slug}`] = region(projectionCity, { land: land10 });
  }
}

// Thế giới: chỉ dùng khi hành trình đi qua nhiều quốc gia. Bỏ Nam Cực.
const worldProjection = geoMercator().fitExtent(
  [[0, 0], [SIZE, SIZE]],
  { type: 'MultiPoint', coordinates: [[-180, -58], [180, 78]] },
);
const world = region(worldProjection, {
  land: { type: 'FeatureCollection', features: land110.features.filter((f) => f.id !== '010') },
}, { bleed: 0, min: 1.5 });

await mkdir(join(ROOT, 'src', 'lib', 'maps'), { recursive: true });
await mkdir(join(ROOT, 'public', 'maps'), { recursive: true });
const regions = JSON.stringify({ cities, countries: countryMaps });
const trip = JSON.stringify({ countries: countryMaps, world });
await writeFile(join(ROOT, 'src', 'lib', 'maps', 'regions.json'), regions);
await writeFile(join(ROOT, 'public', 'maps', 'trip.json'), trip);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log(`regions.json ${kb(regions)} · trip.json ${kb(trip)}`);
for (const [k, v] of Object.entries(cities)) console.log('  city', k.padEnd(28), kb(v.land));
for (const [k, v] of Object.entries(countryMaps)) console.log('  country', k.padEnd(25), kb(v.land + v.focus));

'use client';

import { useEffect, useState } from 'react';
import type { City } from '@/lib/catalog';
import type { MapRegion } from '@/lib/map';
import { project } from '@/lib/map';

interface TripMaps {
  countries: Record<string, MapRegion>;
  world: MapRegion;
}

let cache: Promise<TripMaps> | null = null;
/** public/maps/trip.json (≈180 KB) chỉ tải khi trang hành trình có điểm dừng. */
function loadMaps(): Promise<TripMaps> {
  if (!cache) {
    cache = fetch('/maps/trip.json').then((r) => {
      if (!r.ok) throw new Error(`trip.json ${r.status}`);
      return r.json();
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

/**
 * Bản đồ tuyến theo thứ tự điểm dừng. Cả chuyến trong một quốc gia → bản đồ quốc
 * gia (1:50m); đi nhiều nước → bản đồ thế giới (1:110m), cắt khung quanh các điểm.
 */
export default function TripMap({ cities }: { cities: City[] }) {
  const [maps, setMaps] = useState<TripMaps | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadMaps()
      .then((m) => alive && setMaps(m))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const countrySlugs = [...new Set(cities.map((c) => c.country.slug))];
  const single = countrySlugs.length === 1;

  if (!maps) {
    return (
      <div className="map" aria-busy={!failed}>
        <span className="map-note">{failed ? 'Chưa tải được bản đồ.' : 'Đang tải bản đồ…'}</span>
      </div>
    );
  }

  const region = single ? maps.countries[countrySlugs[0]] : maps.world;
  const pts = cities.map((c) => project(region, c.coord));

  // Khung nhìn: cả vùng quốc gia, hoặc ô vuông quanh các điểm trên bản đồ thế giới.
  let view = { x: 0, y: 0, s: region.size };
  if (!single && pts.length) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 60) * 1.5;
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    view = { x: cx - span / 2, y: cy - span / 2, s: span };
  }
  const pct = ([x, y]: [number, number]) => ({
    left: `${(((x - view.x) / view.s) * 100).toFixed(2)}%`,
    top: `${(((y - view.y) / view.s) * 100).toFixed(2)}%`,
  });

  // Mỗi chặng là một đường cong nhẹ, uốn sang trái hướng đi.
  const route = pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = pts[i - 1];
      const mx = (px + x) / 2 - (y - py) * 0.18;
      const my = (py + y) / 2 + (x - px) * 0.18;
      return `Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="map" role="group" aria-label={`Bản đồ tuyến: ${cities.map((c) => c.name).join(' → ')}`}>
      <div className="map-in">
        <svg viewBox={`${view.x} ${view.y} ${view.s} ${view.s}`} aria-hidden="true" focusable="false">
          <path className={region.focus ? 'land-other' : 'land'} d={region.land} />
          {region.focus && <path className="land" d={region.focus} />}
          {pts.length > 1 && <path className="route" d={route} />}
        </svg>
        {pts.map((p, i) => (
          <span key={cities[i].key + i} className="pin num pop" style={{ ...pct(p), animationDelay: `${300 + i * 150}ms` }} aria-hidden="true">
            {i + 1}
          </span>
        ))}
      </div>
      <span className="map-note">Bản đồ minh hoạ · tuyến theo thứ tự ngày</span>
    </div>
  );
}

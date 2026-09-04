'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import type { GeoSphere } from 'd3-geo';
import { COUNTRIES, TOTAL_CITIES, TOTAL_EXPERIENCES, hrefOf } from '@/lib/catalog';
import {
  EXPERIENCE_OFFSETS,
  LEVEL_FACTOR,
  clamp,
  easeCubicInOut,
  loadGeometry,
  offsetLngLat,
} from '@/lib/geo';
import type { WorldGeometry } from '@/lib/geo';
import { resolveRoute } from '@/lib/route';
import { degreeLabel, scaleLabel, vndShort } from '@/lib/format';
import { useItinerary } from './ItineraryProvider';
import Crumb from './Crumb';
import IndexRail from './IndexRail';

const SPHERE: GeoSphere = { type: 'Sphere' };
const GRATICULE = geoGraticule10();
const FLY_MS = 1150;
const WHEEL_STEP = 170;

interface Pin {
  key: string;
  href: string;
  name: string;
  sub: string;
  coord: [number, number];
  selected: boolean;
}

interface Palette {
  ocean: string;
  ocean2: string;
  grat: string;
  land: string;
  landDim: string;
  landSel: string;
  bord: string;
  line: string;
  accent: string;
  limb: string;
}

const FALLBACK: Palette = {
  ocean: '#e4f0f1',
  ocean2: '#d2e4e7',
  grat: '#c3d9dc',
  land: '#e8dcc2',
  landDim: '#f0ead9',
  landSel: '#f6c7a8',
  bord: '#ffffff',
  line: '#e6ded0',
  accent: '#e0663c',
  limb: 'rgba(31,27,23,.1)',
};

export default function AtlasShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { keys } = useItinerary();

  const route = useMemo(() => resolveRoute(pathname), [pathname]);
  const [base, setBase] = useState(320);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pinNodes = useRef(new Map<string, HTMLAnchorElement | null>());
  const labelWidth = useRef(new Map<string, number>());

  const camera = useRef({ rot: [-106, -13] as [number, number], scale: 320 });
  const view = useRef({ w: 0, h: 0, cx: 0, cy: 0, base: 320, dpr: 1, limit: 0 });
  const palette = useRef<Palette>(FALLBACK);
  const geometry = useRef<{ lo: WorldGeometry | null; hi: WorldGeometry | null }>({ lo: null, hi: null });
  const fly = useRef<{ t0: number; rot0: [number, number]; rot1: [number, number]; s0: number; s1: number } | null>(null);
  const drag = useRef<{ x: number; y: number; rot: [number, number]; moved: number } | null>(null);
  const wheel = useRef(0);
  const lock = useRef(0);
  const pins = useRef<Pin[]>([]);
  const routeRef = useRef(route);
  const reduced = useRef(false);
  const [ready, setReady] = useState(false);

  routeRef.current = route;

  /* ------------------------------ ghim hiện tại ----------------------------- */

  const pinList = useMemo<Pin[]>(() => {
    if (route.isItinerary) return [];
    if (route.city) {
      const cityScale = base * LEVEL_FACTOR.city;
      return route.city.experiences.map((e, i) => {
        const [dx, dy] = EXPERIENCE_OFFSETS[i % EXPERIENCE_OFFSETS.length];
        return {
          key: e.key,
          href: hrefOf.experience(e),
          name: e.title,
          sub: vndShort(e.price),
          coord: offsetLngLat(route.city!.coord, dx, dy, cityScale),
          selected: route.experience?.key === e.key,
        };
      });
    }
    if (route.country) {
      return route.country.cities.map((c) => ({
        key: c.key,
        href: hrefOf.city(c),
        name: c.name,
        sub: 'từ ' + vndShort(c.from),
        coord: c.coord,
        selected: false,
      }));
    }
    return COUNTRIES.map((c) => ({
      key: c.key,
      href: hrefOf.country(c),
      name: c.name,
      sub: 'từ ' + vndShort(c.from),
      coord: c.coord,
      selected: false,
    }));
  }, [route, base]);

  pins.current = pinList;

  /* --------------------------------- vẽ ------------------------------------ */

  const projection = useMemo(() => geoOrthographic().precision(0.3), []);

  const readPalette = useCallback(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    palette.current = {
      ocean: get('--ocean', FALLBACK.ocean),
      ocean2: get('--ocean-2', FALLBACK.ocean2),
      grat: get('--grat', FALLBACK.grat),
      land: get('--land', FALLBACK.land),
      landDim: get('--land-dim', FALLBACK.landDim),
      landSel: get('--land-sel', FALLBACK.landSel),
      bord: get('--bord', FALLBACK.bord),
      line: get('--line', FALLBACK.line),
      accent: get('--accent-bright', FALLBACK.accent),
      limb: get('--limb', FALLBACK.limb),
    };
  }, []);

  const layout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const narrow = w < 860;
    const nextBase = narrow ? Math.min(w * 0.4, h * 0.235) : Math.min(w * 0.235, h * 0.375);
    // Cạnh phải khả dụng cho nhãn ghim: bảng bán nằm bên phải trên màn rộng.
    const panel = document.querySelector('.panel')?.getBoundingClientRect();
    const sidePanel = Boolean(panel) && !narrow;
    view.current = {
      w,
      h,
      dpr,
      cx: narrow ? w / 2 : w * 0.47,
      cy: narrow ? h * 0.3 : h * 0.54,
      base: nextBase,
      limit: sidePanel && panel ? panel.left - 12 : w - 12,
    };
    if (!fly.current) {
      camera.current.scale = nextBase * LEVEL_FACTOR[routeRef.current.level];
    }
    setBase((prev) => (Math.abs(prev - nextBase) > 0.5 ? nextBase : prev));
  }, []);

  /* ------------------------------ chuyển cảnh ------------------------------ */

  const targetFor = useCallback((): { rot: [number, number]; scale: number } => {
    const r = routeRef.current;
    const b = view.current.base;
    if (r.experience && r.city) {
      const index = r.city.experiences.findIndex((e) => e.key === r.experience!.key);
      const [dx, dy] = EXPERIENCE_OFFSETS[Math.max(0, index) % EXPERIENCE_OFFSETS.length];
      const coord = offsetLngLat(r.city.coord, dx, dy, b * LEVEL_FACTOR.city);
      return { rot: [-coord[0], -coord[1]], scale: b * LEVEL_FACTOR.experience };
    }
    if (r.city) return { rot: [-r.city.coord[0], -r.city.coord[1]], scale: b * LEVEL_FACTOR.city };
    if (r.country) {
      return { rot: [-r.country.coord[0], -r.country.coord[1]], scale: b * LEVEL_FACTOR.country };
    }
    // Về quỹ đạo: giữ nguyên kinh độ đang xem, chỉ ngả vĩ độ về gần xích đạo.
    return { rot: [camera.current.rot[0], -12], scale: b };
  }, []);

  const startFly = useCallback(
    (immediate: boolean) => {
      const target = targetFor();
      const rot0 = camera.current.rot.slice() as [number, number];
      let lon = target.rot[0];
      while (lon - rot0[0] > 180) lon -= 360;
      while (lon - rot0[0] < -180) lon += 360;

      if (immediate || reduced.current) {
        camera.current = { rot: [lon, target.rot[1]], scale: target.scale };
        fly.current = null;
        return;
      }
      fly.current = {
        t0: performance.now(),
        rot0,
        rot1: [lon, target.rot[1]],
        s0: camera.current.scale,
        s1: target.scale,
      };
    },
    [targetFor],
  );

  /* -------------------------------- điều hướng ----------------------------- */

  const nearestPinHref = useCallback((): string | null => {
    const centre: [number, number] = [-camera.current.rot[0], -camera.current.rot[1]];
    let best: Pin | null = null;
    let bestDistance = Infinity;
    for (const pin of pins.current) {
      const d = geoDistance(pin.coord, centre);
      if (d < bestDistance) {
        bestDistance = d;
        best = pin;
      }
    }
    return best ? best.href : null;
  }, []);

  const navigate = useCallback(
    (href: string | null) => {
      if (!href || href === pathname) return;
      const now = performance.now();
      if (now - lock.current < 380) return;
      lock.current = now;
      router.push(href);
    },
    [pathname, router],
  );

  const goDeeper = useCallback(() => {
    const r = routeRef.current;
    if (r.level === 'experience') return;
    navigate(nearestPinHref());
  }, [navigate, nearestPinHref]);

  const goShallower = useCallback(() => {
    const r = routeRef.current;
    if (r.isItinerary) {
      navigate(r.city ? hrefOf.city(r.city) : r.country ? hrefOf.country(r.country) : hrefOf.world());
      return;
    }
    if (r.experience && r.city) navigate(hrefOf.city(r.city));
    else if (r.city) navigate(hrefOf.country(r.city.country));
    else if (r.country) navigate(hrefOf.world());
  }, [navigate]);

  /* ------------------------------- vòng lặp vẽ ----------------------------- */

  // Vòng lặp vẽ chỉ dựng một lần; các hành động điều hướng đọc qua ref để việc
  // đổi route không phải tháo và dựng lại listener (và làm đứt animation).
  const actions = useRef({ goDeeper, goShallower, navigate });
  actions.current = { goDeeper, goShallower, navigate };

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    readPalette();
    layout();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) return;

    const path = geoPath(projection, ctx);
    let raf = 0;
    let frame = 0;
    const readouts = new Map<string, HTMLElement | null>();

    const paintReadout = () => {
      const lat = -camera.current.rot[1];
      const lon = ((-camera.current.rot[0] + 540) % 360) - 180;
      const values: Record<string, string> = {
        lat: degreeLabel(lat, 'B', 'N'),
        lon: degreeLabel(lon, 'Đ', 'T'),
        scale: scaleLabel(camera.current.scale),
      };
      for (const name of Object.keys(values)) {
        let node = readouts.get(name);
        if (!node || !node.isConnected) {
          node = document.querySelector<HTMLElement>(`[data-readout="${name}"]`);
          readouts.set(name, node);
        }
        if (node) node.textContent = values[name];
      }
    };

    const placePins = () => {
      const centre: [number, number] = [-camera.current.rot[0], -camera.current.rot[1]];
      const declutter = routeRef.current.level === 'world';
      const placed: Array<[number, number, number, number]> = [];
      const ordered = pins.current
        .map((pin) => ({ pin, d: geoDistance(pin.coord, centre) }))
        .sort((a, b) => a.d - b.d);

      for (const { pin, d } of ordered) {
        const node = pinNodes.current.get(pin.key);
        if (!node) continue;
        const xy = projection(pin.coord);
        const hidden = !xy || d > 1.44;
        node.classList.toggle('off', hidden);
        if (!xy || hidden) continue;
        let width = labelWidth.current.get(pin.key) ?? 0;
        if (!width && !node.classList.contains('bare')) {
          width = node.getBoundingClientRect().width;
          if (width) labelWidth.current.set(pin.key, width);
        }
        const span = width || 140;
        const flip = xy[0] + span > view.current.limit && xy[0] - span > 12;
        node.classList.toggle('flip', flip);
        node.style.transform =
          `translate3d(${xy[0].toFixed(1)}px,${(xy[1] - 6).toFixed(1)}px,0)` +
          (flip ? ' translateX(-100%)' : '');

        if (!declutter) {
          node.classList.remove('bare');
          continue;
        }
        const left = flip ? xy[0] - span - 2 : xy[0] - 8;
        const box: [number, number, number, number] = [left, xy[1] - 20, span + 10, 28];
        const collides = placed.some(
          ([px, py, pw, ph]) =>
            box[0] < px + pw && px < box[0] + box[2] && box[1] < py + ph && py < box[1] + box[3],
        );
        node.classList.toggle('bare', collides);
        if (!collides) placed.push(box);
      }
    };

    const render = () => {
      const { w, h, cx, cy, dpr } = view.current;
      const p = palette.current;
      const r = routeRef.current;

      if (fly.current) {
        const f = fly.current;
        const t = clamp((performance.now() - f.t0) / FLY_MS, 0, 1);
        const e = easeCubicInOut(t);
        camera.current.rot = [
          f.rot0[0] + (f.rot1[0] - f.rot0[0]) * e,
          f.rot0[1] + (f.rot1[1] - f.rot0[1]) * e,
        ];
        camera.current.scale = f.s0 * Math.pow(f.s1 / f.s0, e);
        if (t >= 1) fly.current = null;
      } else if (r.level === 'world' && !r.isItinerary && !drag.current && !reduced.current) {
        camera.current.rot[0] += 0.028;
      }
      if (wheel.current) wheel.current *= 0.9;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      projection.rotate(camera.current.rot).scale(camera.current.scale).translate([cx, cy]);
      const radius = camera.current.scale;

      // đại dương
      ctx.beginPath();
      path(SPHERE);
      const sea = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
      sea.addColorStop(0, p.ocean);
      sea.addColorStop(1, p.ocean2);
      ctx.fillStyle = sea;
      ctx.fill();

      // lưới kinh vĩ
      ctx.beginPath();
      path(GRATICULE);
      ctx.strokeStyle = p.grat;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      const geo = r.level === 'world' ? geometry.current.lo ?? geometry.current.hi : geometry.current.hi ?? geometry.current.lo;
      if (geo) {
        const selected = r.country ? geo.byId.get(r.country.id) : undefined;

        ctx.beginPath();
        path(geo.land);
        ctx.fillStyle = selected ? p.landDim : p.land;
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = selected ? 0.4 : 0.75;
        ctx.beginPath();
        path(geo.borders);
        ctx.strokeStyle = p.bord;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.restore();

        if (selected) {
          ctx.beginPath();
          path(selected);
          ctx.fillStyle = p.landSel;
          ctx.fill();
          ctx.strokeStyle = p.accent;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // bóng rìa cầu
      ctx.save();
      ctx.beginPath();
      path(SPHERE);
      ctx.clip();
      const limb = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.42,
        radius * 0.1,
        cx,
        cy,
        radius * 1.2,
      );
      limb.addColorStop(0, 'rgba(0,0,0,0)');
      limb.addColorStop(0.55, 'rgba(0,0,0,0)');
      limb.addColorStop(1, p.limb);
      ctx.fillStyle = limb;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      ctx.beginPath();
      path(SPHERE);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      placePins();
      if (++frame % 8 === 0) paintReadout();
    };

    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* ------------------------------- tương tác ----------------------------- */

    const onPointerDown = (event: PointerEvent) => {
      drag.current = {
        x: event.clientX,
        y: event.clientY,
        rot: camera.current.rot.slice() as [number, number],
        moved: 0,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('dragging');
    };

    const onPointerMove = (event: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const k = (180 / Math.PI / camera.current.scale) * 1.05;
      const dx = event.clientX - d.x;
      const dy = event.clientY - d.y;
      d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
      if (!fly.current) {
        camera.current.rot = [d.rot[0] + dx * k, clamp(d.rot[1] - dy * k, -85, 85)];
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const dragged = drag.current && drag.current.moved > 5;
      drag.current = null;
      canvas.classList.remove('dragging');
      if (dragged || fly.current) return;

      const geo = geometry.current.hi ?? geometry.current.lo;
      if (!geo) return;
      const { cx, cy } = view.current;
      if (Math.hypot(event.clientX - cx, event.clientY - cy) > camera.current.scale) return;
      const point = projection.invert?.([event.clientX, event.clientY]);
      if (!point || Number.isNaN(point[0])) return;

      const hit = COUNTRIES.find((country) => {
        const shape = geo.byId.get(country.id);
        return shape ? geoContains(shape, point) : false;
      });
      if (hit) actions.current.navigate(hrefOf.country(hit));
    };

    const onPointerCancel = () => {
      drag.current = null;
      canvas.classList.remove('dragging');
    };

    const onWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement | null)?.closest('.panel')) return;
      event.preventDefault();
      if (fly.current) return;
      wheel.current += event.deltaY;
      if (wheel.current > WHEEL_STEP) {
        wheel.current = 0;
        actions.current.goDeeper();
      } else if (wheel.current < -WHEEL_STEP) {
        wheel.current = 0;
        actions.current.goShallower();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'ArrowUp') {
        event.preventDefault();
        actions.current.goShallower();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        actions.current.goDeeper();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', layout);

    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    dark.addEventListener('change', readPalette);
    const observer = new MutationObserver(readPalette);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', layout);
      dark.removeEventListener('change', readPalette);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, projection, readPalette]);

  /* --------------------------- tải hình thể bản đồ -------------------------- */

  useEffect(() => {
    let alive = true;
    loadGeometry('/geo/countries-110m.json')
      .then((g) => {
        if (!alive) return;
        geometry.current.lo = g;
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Bản 50m nét hơn nhiều khi đã zoom vào một quốc gia — chỉ tải khi thực sự cần.
  useEffect(() => {
    if (route.level === 'world' || geometry.current.hi) return;
    let alive = true;
    loadGeometry('/geo/countries-50m.json')
      .then((g) => {
        if (alive) geometry.current.hi = g;
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [route.level]);

  /* ----------------------- bay tới cảnh của route mới ---------------------- */

  const flown = useRef(false);
  useEffect(() => {
    if (route.isItinerary) return;
    startFly(!flown.current); // vào thẳng bằng link sâu thì đặt máy ảnh luôn, không bay
    flown.current = true;
  }, [pathname, route.isItinerary, startFly]);

  const atWorld = route.level === 'world' && !route.isItinerary;

  return (
    <>
      <div className="stage">
        <canvas ref={canvasRef} className="globe" aria-label="Quả cầu điểm đến" />
        <div className="pins">
          {pinList.map((pin) => (
            <Link
              key={pin.key}
              href={pin.href}
              className={'pin off' + (pin.selected ? ' sel' : '')}
              ref={(node) => {
                pinNodes.current.set(pin.key, node);
              }}
              aria-label={`${pin.name} — ${pin.sub}`}
            >
              <span className="pin-dot" aria-hidden="true" />
              <span className="pin-lab">
                <b>{pin.name}</b>
                <span>{pin.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <header className="rail">
        <Link href={hrefOf.world()} className="brand">
          Kinh Tuyến<em>Atlas</em>
        </Link>
        <Crumb route={route} />
        <Link href={hrefOf.itinerary()} className={'cart' + (keys.length ? ' on' : '')}>
          Hành trình <b>{keys.length}</b>
        </Link>
      </header>

      <section className={'hero' + (atWorld ? '' : ' faded')} aria-hidden={!atWorld}>
        <p className="mono">
          Mùa 2026 · {COUNTRIES.length} điểm đến{ready ? '' : ' · đang tải bản đồ'}
        </p>
        <p className="htitle">
          Bắt đầu từ hành tinh.
          <br />
          Kết thúc trước <i>một cánh cửa</i>.
        </p>
        <p>
          {COUNTRIES.length} quốc gia, {TOTAL_CITIES} thành phố, {TOTAL_EXPERIENCES} trải nghiệm đáng
          để bay. Xoay quả cầu — hoặc cuộn để rơi vào một nơi.
        </p>
        <div className="hint mono">
          <span>
            <i aria-hidden="true">↕</i> Cuộn để đi sâu
          </span>
          <span>
            <i aria-hidden="true">↔</i> Kéo để xoay
          </span>
        </div>
      </section>

      <IndexRail route={route} />

      <aside className="panel" aria-label="Bảng đặt chỗ">
        {children}
      </aside>
    </>
  );
}

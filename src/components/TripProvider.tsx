'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Country, Experience } from '@/lib/catalog';
import * as T from '@/lib/trip';
import type { TripState } from '@/lib/trip';
import { useCatalog } from './CatalogProvider';

const STORAGE_KEY = 'meridian.trip';
/** Khoá của giỏ cũ (trang /hanh-trinh trước bản thiết kế mới) — đọc một lần để chuyển sang. */
const LEGACY_KEY = 'meridian.hanh-trinh';

interface Toast {
  id: number;
  text: string;
  action?: { href: string; label: string };
}

interface TripValue {
  /** false cho tới khi đã đọc localStorage — trước đó đừng hiện "giỏ trống". */
  ready: boolean;
  trip: TripState;
  cartLines: Experience[];
  /** Tổng mỗi khách. */
  cartTotal: number;
  inCart: (key: string) => boolean;
  inTrip: (key: string) => boolean;
  update: (fn: (state: TripState) => TripState) => void;
  /** `quiet`: nơi gọi tự hiện xác nhận ngay cạnh nút (trang trải nghiệm). */
  addToCart: (experience: Experience, opts?: { quiet?: boolean }) => void;
  removeFromCart: (key: string) => void;
  toggleSaved: (key: string, label: string) => void;
  loadSample: (country: Country) => void;
  notify: (text: string, action?: Toast['action']) => void;
}

const Ctx = createContext<TripValue | null>(null);

export function useTrip(): TripValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useTrip phải nằm trong <TripProvider>');
  return value;
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { byKey, places, cities } = useCatalog();
  const [trip, setTrip] = useState<TripState>(T.emptyTrip);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đọc sau khi mount: server không có localStorage, đọc lúc render sẽ lệch hydrate.
  useEffect(() => {
    setTrip(
      T.parseTrip(read(STORAGE_KEY), read(LEGACY_KEY), {
        experience: (k) => byKey.get(k),
        hasPlace: (k) => places.has(k),
        city: (k) => cities.get(k),
      }),
    );
    setReady(true);
    // Chỉ đọc một lần lúc mount; danh mục ổn định trong suốt vòng đời trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* localStorage bị chặn — vẫn chạy, chỉ là không nhớ giữa các lần mở. */
    }
  }, [trip, ready]);

  // Hai tab cùng mở: tab kia sửa giỏ thì tab này cập nhật theo.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setTrip(
          T.parseTrip(JSON.parse(e.newValue), undefined, {
            experience: (k) => byKey.get(k),
            hasPlace: (k) => places.has(k),
            city: (k) => cities.get(k),
          }),
        );
      } catch {
        /* bỏ qua */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [byKey, places, cities]);

  const notify = useCallback((text: string, action?: Toast['action']) => {
    setToast({ id: Date.now(), text, action });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo<TripValue>(() => {
    const cartLines = trip.cart.map((k) => byKey.get(k)).filter((e): e is Experience => Boolean(e));
    const saved = new Set(trip.stops.flatMap((s) => [s.city, ...s.items]));
    return {
      ready,
      trip,
      cartLines,
      cartTotal: cartLines.reduce((sum, e) => sum + e.price, 0),
      inCart: (key) => trip.cart.includes(key),
      inTrip: (key) => saved.has(key),
      update: (fn) => setTrip((prev) => fn(prev)),
      addToCart: (experience, opts) => {
        setTrip((prev) => T.addToCart(prev, experience));
        if (!opts?.quiet) notify(`Đã thêm “${experience.title}” vào giỏ`, { href: '/gio-hang', label: 'Xem giỏ' });
      },
      removeFromCart: (key) => setTrip((prev) => T.removeFromCart(prev, key)),
      toggleSaved: (key, label) => {
        if (saved.has(key)) {
          setTrip((prev) => {
            if (prev.stops.some((s) => s.city === key)) return T.removeStop(prev, prev.stops.findIndex((s) => s.city === key));
            return T.removeItem(prev, key);
          });
          notify(`Đã bỏ ${label} khỏi hành trình`);
        } else {
          setTrip((prev) => {
            if (cities.has(key)) return T.addCity(prev, key);
            return T.addItem(prev, key, byKey.get(key));
          });
          notify(`Đã lưu ${label} vào hành trình`, { href: '/hanh-trinh', label: 'Mở hành trình' });
        }
      },
      loadSample: (country) => {
        setTrip((prev) => T.sampleTrip(country, prev));
        notify(`Đã mở hành trình mẫu ${country.name}`);
      },
      notify,
    };
  }, [trip, ready, byKey, cities, notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-zone" aria-live="polite" role="status">
        {toast && (
          <div className="toast" key={toast.id}>
            <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5 L10 17 L19 7" />
            </svg>
            <span>{toast.text}</span>
            {toast.action && <Link href={toast.action.href}>{toast.action.label}</Link>}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

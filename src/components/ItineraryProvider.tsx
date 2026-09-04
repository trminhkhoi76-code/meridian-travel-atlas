'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EXPERIENCE_BY_KEY } from '@/lib/catalog';
import type { Experience } from '@/lib/catalog';

const STORAGE_KEY = 'kinhtuyen.hanh-trinh';

interface ItineraryValue {
  keys: string[];
  lines: Experience[];
  total: number;
  has: (key: string) => boolean;
  add: (key: string, note?: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  notify: (message: string) => void;
}

const Ctx = createContext<ItineraryValue | null>(null);

export function useItinerary(): ItineraryValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useItinerary phải nằm trong <ItineraryProvider>');
  return value;
}

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đọc sau khi mount: server không có localStorage, đọc lúc render sẽ lệch hydrate.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setKeys(parsed.filter((k): k is string => typeof k === 'string' && EXPERIENCE_BY_KEY.has(k)));
        }
      }
    } catch {
      /* localStorage bị chặn — vẫn chạy được, chỉ là không nhớ giữa các lần mở. */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch {
      /* bỏ qua */
    }
  }, [keys]);

  const notify = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2800);
  }, []);

  const value = useMemo<ItineraryValue>(() => {
    const lines = keys
      .map((k) => EXPERIENCE_BY_KEY.get(k))
      .filter((e): e is Experience => Boolean(e));
    return {
      keys,
      lines,
      total: lines.reduce((sum, e) => sum + e.price, 0),
      has: (key) => keys.includes(key),
      add: (key, note) => {
        setKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
        notify(note ?? 'Đã thêm vào hành trình.');
      },
      remove: (key) => setKeys((prev) => prev.filter((k) => k !== key)),
      clear: () => setKeys([]),
      notify,
    };
  }, [keys, notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={'toast' + (message ? ' on' : '')} role="status" aria-live="polite">
        {message}
      </div>
    </Ctx.Provider>
  );
}

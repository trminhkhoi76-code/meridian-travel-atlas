'use client';

import { useEffect, useState } from 'react';
import { JA_THEME_LABEL, JA_THEME_SHORT } from '@/lib/ja';
import type { Lang } from '@/lib/ja';

type Theme = 'system' | 'light' | 'dark' | 'blue';

const STORAGE_KEY = 'meridian.theme';
const ORDER: Theme[] = ['system', 'light', 'dark', 'blue'];
const LABEL: Record<Theme, string> = {
  system: 'Hệ thống',
  light: 'Sáng',
  dark: 'Tối',
  blue: 'Xanh dịu',
};
// Rail quá hẹp trên di động để hiện đủ nhãn — rút gọn còn một chữ cái.
const SHORT: Record<Theme, string> = { system: 'H', light: 'S', dark: 'T', blue: 'X' };

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export default function ThemeToggle({ lang = 'vi' }: { lang?: Lang }) {
  // Mặc định 'system' khớp với HTML server render (chưa có data-theme) — đọc
  // lựa chọn đã lưu sau khi mount, như ItineraryProvider, để không lệch hydrate.
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (ORDER as string[]).includes(saved)) setTheme(saved as Theme);
    } catch {
      /* localStorage bị chặn — dùng theme hệ thống mặc định */
    }
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* bỏ qua */
    }
  };

  const label = lang === 'ja' ? JA_THEME_LABEL[theme] : LABEL[theme];
  const short = lang === 'ja' ? JA_THEME_SHORT[theme] : SHORT[theme];

  return (
    <button
      type="button"
      className="theme-toggle mono"
      onClick={cycle}
      aria-label={lang === 'ja' ? `テーマ: ${label}。クリックで切り替え。` : `Giao diện: ${label}. Bấm để đổi.`}
    >
      <span className="tt-full">{label}</span>
      <span className="tt-short">{short}</span>
    </button>
  );
}

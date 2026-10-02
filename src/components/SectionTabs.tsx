'use client';

import { useEffect, useState } from 'react';

/** Tab neo tới các mục trong trang; tab của mục đang ở đầu màn hình được gạch chân. */
export default function SectionTabs({ tabs }: { tabs: Array<{ id: string; label: string }> }) {
  const [current, setCurrent] = useState(tabs[0]?.id);

  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setCurrent(top.target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  return (
    <nav className="sectabs" aria-label="Mục trong trang">
      {tabs.map((t) => (
        <a key={t.id} href={`#${t.id}`} aria-current={current === t.id ? 'true' : undefined} onClick={() => setCurrent(t.id)}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}

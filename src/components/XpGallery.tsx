'use client';

import { useState } from 'react';
import { tintOf } from '@/lib/photo';

/** Ảnh lớn + 5 ảnh nhỏ; bấm ảnh nhỏ để đổi ảnh lớn (chuyển mờ). */
export default function XpGallery({ labels, seed }: { labels: string[]; seed: string }) {
  const [cur, setCur] = useState(0);
  return (
    <div className="xp-gallery enter">
      <div
        className="ph main"
        role="img"
        aria-label={`Ảnh minh hoạ: ${labels[cur]}`}
        style={{ ['--tint' as string]: tintOf(seed + cur) }}
      >
        <span className="ph-cap fadein" key={cur} aria-hidden="true">
          Ảnh · {labels[cur]}
        </span>
      </div>
      <div className="thumbs">
        {labels.map((l, i) => (
          <button
            key={l + i}
            type="button"
            className="press"
            aria-pressed={i === cur}
            aria-label={`Xem ảnh ${i + 1}: ${l}`}
            style={{ ['--tint' as string]: tintOf(seed + i) }}
            onClick={() => setCur(i)}
          />
        ))}
      </div>
    </div>
  );
}

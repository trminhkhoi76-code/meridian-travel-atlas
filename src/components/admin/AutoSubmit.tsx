'use client';

import { useEffect, useRef } from 'react';

/** Đặt trong một <form method="get">: đổi <select> là gửi form luôn. Không JS thì vẫn có nút "Lọc". */
export default function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    const onChange = (e: Event) => {
      if (e.target instanceof HTMLSelectElement) form.requestSubmit();
    };
    form.addEventListener('change', onChange);
    return () => form.removeEventListener('change', onChange);
  }, []);
  return <span ref={ref} hidden />;
}

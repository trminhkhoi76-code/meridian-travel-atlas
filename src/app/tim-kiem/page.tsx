import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export const metadata: Metadata = {
  title: 'Tìm kiếm',
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <main className="container page">
      {/* useSearchParams cần Suspense để trang vẫn prerender tĩnh được. */}
      <Suspense fallback={<p className="note">Đang tải…</p>}>
        <SearchResults />
      </Suspense>
    </main>
  );
}

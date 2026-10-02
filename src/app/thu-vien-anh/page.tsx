import type { Metadata } from 'next';
import GalleryGrid from '@/components/GalleryGrid';

export const metadata: Metadata = {
  title: 'Thư viện ảnh',
  description: 'Ảnh du lịch của khách, gắn đúng địa điểm — bấm vào để xem và đặt trải nghiệm ở đó.',
  alternates: { canonical: '/thu-vien-anh' },
};

export default function GalleryPage() {
  return (
    <main className="container page">
      <div className="progress" aria-hidden="true" />
      <GalleryGrid />
    </main>
  );
}

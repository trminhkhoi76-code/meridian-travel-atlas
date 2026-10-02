import type { Metadata } from 'next';
import TripPlanner from '@/components/TripPlanner';

export const metadata: Metadata = {
  title: 'Hành trình',
  description: 'Xếp các thành phố, địa điểm và trải nghiệm đã lưu theo ngày, xem tuyến đường và chi phí.',
  robots: { index: false },
};

export default function ItineraryPage() {
  return (
    <main className="container page">
      <TripPlanner />
    </main>
  );
}

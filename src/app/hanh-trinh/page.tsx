import type { Metadata } from 'next';
import ItineraryPanel from '@/components/ItineraryPanel';

export const metadata: Metadata = {
  title: 'Hành trình của bạn',
  description: 'Các trải nghiệm đã chọn, tạm tính và gửi yêu cầu đặt chỗ.',
  robots: { index: false },
};

export default function ItineraryPage() {
  return <ItineraryPanel />;
}

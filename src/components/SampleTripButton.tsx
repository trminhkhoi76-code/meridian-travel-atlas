'use client';

import { useRouter } from 'next/navigation';
import { useCatalog } from './CatalogProvider';
import { useTrip } from './TripProvider';

/**
 * Mở hành trình mẫu của một quốc gia trong trình lập hành trình. Thay hành trình
 * đang có (giỏ hàng giữ nguyên) — hỏi lại trước nếu khách đã có điểm dừng.
 */
export default function SampleTripButton({
  countryKey,
  className = 'btn-d press',
  children,
}: {
  countryKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { countries } = useCatalog();
  const { trip, loadSample } = useTrip();
  const country = countries.find((c) => c.key === countryKey);
  if (!country) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (trip.stops.length > 0 && !window.confirm('Thay hành trình hiện tại bằng hành trình mẫu? Giỏ hàng vẫn giữ nguyên.')) {
          return;
        }
        loadSample(country);
        router.push('/hanh-trinh');
      }}
    >
      {children}
    </button>
  );
}

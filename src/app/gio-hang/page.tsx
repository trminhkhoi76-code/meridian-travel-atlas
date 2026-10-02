import type { Metadata } from 'next';
import CartFlow from '@/components/CartFlow';

export const metadata: Metadata = {
  title: 'Giỏ hàng',
  description: 'Các trải nghiệm đã chọn, tạm tính và gửi yêu cầu đặt chỗ.',
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main className="container page">
      <CartFlow />
    </main>
  );
}

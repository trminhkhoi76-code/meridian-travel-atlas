import type { BookingStatus } from '@/lib/booking';
import { STATUS_LABEL } from '@/lib/booking';

/** Biểu tượng + nhãn luôn đi cùng màu trạng thái — không bao giờ chỉ dựa vào màu. */
const ICON: Record<BookingStatus, string> = {
  NEW: '+',
  CONTACTED: '…',
  CONFIRMED: '✓',
  CANCELLED: '✕',
};

export default function StatusBadge({ status, overdue = false }: { status: BookingStatus; overdue?: boolean }) {
  if (overdue) {
    return (
      <span className="sbadge late">
        <i aria-hidden="true">!</i>Quá hạn
      </span>
    );
  }
  return (
    <span className={'sbadge ' + status.toLowerCase()}>
      <i aria-hidden="true">{ICON[status]}</i>
      {STATUS_LABEL[status]}
    </span>
  );
}

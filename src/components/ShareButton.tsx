'use client';

import { IconShare } from './Icons';
import { useTrip } from './TripProvider';

/** Chia sẻ trang hiện tại: bảng chia sẻ của hệ điều hành nếu có, không thì chép link. */
export default function ShareButton({ title, withLabel = false }: { title: string; withLabel?: boolean }) {
  const { notify } = useTrip();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify('Đã chép đường dẫn');
    } catch {
      notify('Không chép được — hãy chép đường dẫn trên thanh địa chỉ');
    }
  }

  return withLabel ? (
    <button type="button" className="btn-s btn-sm press" onClick={share}>
      <IconShare size={18} />
      Chia sẻ
    </button>
  ) : (
    <button type="button" className="icon-btn press" aria-label="Chia sẻ" title="Chia sẻ" onClick={share}>
      <IconShare size={20} />
    </button>
  );
}

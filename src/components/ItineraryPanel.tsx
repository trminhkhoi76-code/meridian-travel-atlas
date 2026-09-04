'use client';

import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { vnd } from '@/lib/format';
import { swatch } from '@/lib/swatch';
import { useItinerary } from './ItineraryProvider';

export default function ItineraryPanel() {
  const { lines, total, remove, notify } = useItinerary();

  return (
    <>
      <div className="pbody">
        <Link href={hrefOf.world()} className="back">
          ← Thế giới
        </Link>
        <h1 className="ptitle sm">Hành trình của bạn</h1>
        <p className="pdesc">
          Chưa thu bất kỳ khoản nào. Chuyên viên sẽ xác nhận từng dòng trong vòng 24 giờ, kèm phương
          án bay và giấy tờ cần thiết.
        </p>

        {lines.length === 0 ? (
          <p className="empty">
            Chưa có gì ở đây. Hãy đi sâu vào một thành phố rồi thêm một trải nghiệm.
          </p>
        ) : (
          <>
            {lines.map((line) => (
              <div className="cartrow" key={line.key}>
                <span className="sw" style={{ background: swatch(line.cat) }} aria-hidden="true" />
                <span className="txt">
                  <b>{line.title}</b>
                  <small>
                    {line.city.name}, {line.country.name} · {line.duration}
                  </small>
                </span>
                <span className="amt">{vnd(line.price)}</span>
                <button
                  type="button"
                  className="x"
                  onClick={() => remove(line.key)}
                  aria-label={`Bỏ ${line.title} khỏi hành trình`}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="total">
              <span className="mono">Tạm tính · {lines.length} dòng</span>
              <b>{vnd(total)}</b>
            </div>
          </>
        )}
      </div>

      {lines.length > 0 && (
        <div className="pfoot">
          <div className="amt">
            <span className="mono">Tổng cộng</span>
            <b>{vnd(total)}</b>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => notify('Đã gửi yêu cầu. Chuyên viên sẽ liên hệ trong 24 giờ.')}
          >
            Gửi yêu cầu đặt chỗ
          </button>
        </div>
      )}
    </>
  );
}

import Link from 'next/link';
import type { UrlCase } from '@/lib/url-match';
import UrlReadout from './UrlReadout';

/**
 * Khung chung cho bảy trang tái hiện. Giữ đúng hợp đồng của `.panel`: chỉ một khối
 * `.pbody` cuộn được, không có `.pfoot` vì ở đây không có gì để bán.
 */
export default function UrlMatchCase({ c }: { c: UrlCase }) {
  return (
    <div className="pbody">
      <Link href="/url-match" className="back">
        ← Bảy ca so khớp URL
      </Link>

      <div className="tagline">
        <span className="tag">Ca {c.n}</span>
        <span className="mono">{c.point}</span>
      </div>

      <h1 className="ptitle sm">{c.title}</h1>
      <p className="pdesc">{c.correct}</p>

      <dl className="meta">
        <div>
          <dt className="mono">Side đo lường</dt>
          <dd>{c.measurement}</dd>
        </div>
        <div>
          <dt className="mono">Side popup</dt>
          <dd>{c.popup}</dd>
        </div>
        <div>
          <dt className="mono">Kỳ vọng heatmap</dt>
          <dd>{c.expectHeatmap ? 'có ghi' : 'không ghi'}</dd>
        </div>
        <div>
          <dt className="mono">Kỳ vọng popup</dt>
          <dd>{c.expectPopup ? 'có hiện' : 'không hiện'}</dd>
        </div>
      </dl>

      <p className="mono">URL phải mở</p>
      <p className="um-str">{c.openUrl}</p>

      <p className="mono">Chuỗi đăng ký trong console</p>
      <p className="um-str">{c.setting}</p>
      <p className="um-mode">{c.mode}</p>

      <p className="um-sym">{c.symptom}</p>

      {c.controls?.length ? (
        <>
          <p className="mono">Đối chứng</p>
          <ul className="incl">
            {c.controls.map((ctrl) => (
              <li key={ctrl.path}>
                <span>
                  <Link href={ctrl.path}>{ctrl.label}</Link> — {ctrl.expect}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <UrlReadout />

      <p className="note">
        Trang tái hiện, không thuộc luồng sản phẩm. Mở DevTools → Network, lọc{' '}
        <code>mieru-ca</code> để xem beacon heatmap có bắn không và response của Optimize có trả
        popup không — phán quyết nằm ngay ở request/response, không cần chờ dashboard tổng hợp.
      </p>
    </div>
  );
}

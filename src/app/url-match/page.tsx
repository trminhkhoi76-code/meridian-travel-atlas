import type { Metadata } from 'next';
import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { HOSTS, URL_CASES } from '@/lib/url-match';

export const metadata: Metadata = {
  title: 'Bảy ca so khớp URL',
  robots: { index: false },
};

const HOST_ROLES: { host: string; role: string }[] = [
  { host: HOSTS.base, role: 'Ca 3–6, và vế "không www" của ca 1' },
  { host: HOSTS.www, role: 'Ca 1, vế "có www"' },
  { host: `${HOSTS.idnUnicode} (${HOSTS.idnAscii})`, role: 'Ca 2' },
  { host: HOSTS.httpOnly, role: 'Ca 7 — S3 website endpoint, chỉ phục vụ HTTP' },
];

export default function UrlMatchIndex() {
  return (
    <div className="pbody">
      <Link href={hrefOf.world()} className="back">
        ← Thế giới
      </Link>

      <div className="tagline">
        <span className="tag">Repro</span>
        <span className="mono">7 ca</span>
      </div>

      <h1 className="ptitle sm">Bảy ca so khớp URL</h1>
      <p className="pdesc">
        Bảy chỗ side đo lường và side popup chuẩn hoá URL khác nhau. Mỗi ca là một cặp{' '}
        <em>URL được mở</em> và <em>chuỗi đăng ký trong console</em> — thiếu một vế thì không tái
        hiện được.
      </p>

      <div className="rows">
        {URL_CASES.map((c) => (
          <Link key={c.id} href={c.path} className="row">
            <div className="txt">
              <b>
                Ca {c.n} — {c.point}
              </b>
              <small>{c.symptom}</small>
            </div>
            <div className="pr">
              <b>{c.expectHeatmap ? 'ghi' : '—'}</b>
              <small>{c.expectPopup ? 'popup' : 'không popup'}</small>
            </div>
          </Link>
        ))}
      </div>

      <p className="mono">Host cần dựng</p>
      <ul className="incl">
        {HOST_ROLES.map((h) => (
          <li key={h.host}>
            <span>
              <code>{h.host}</code> — {h.role}
            </span>
          </li>
        ))}
      </ul>

      <p className="note">
        Các đường dẫn ở trên là đường dẫn nội bộ, mở được ngay trên localhost để kiểm tra bố cục.
        Việc tái hiện thật cần đúng host trong bảng — mỗi trang ca in sẵn URL tuyệt đối phải mở.
      </p>
    </div>
  );
}

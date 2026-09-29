import type { Metadata } from 'next';
import Link from 'next/link';
import UrlMatchCase from '@/components/UrlMatchCase';
import { findCase } from '@/lib/url-match';

/**
 * Một route cho mọi biến thể: khác nhau chỉ ở `?u=…`, nên trang đọc `searchParams`
 * (dynamic) và in lại giá trị `u` để ảnh chụp tự nói đang ở biến thể nào.
 */
const c = findCase('08-query');

export const metadata: Metadata = {
  title: `Ngoài 7 ca — ${c.point}`,
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ u?: string | string[] }>;
}

export default async function Page({ searchParams }: Props) {
  const { u } = await searchParams;
  const values = u === undefined ? [] : Array.isArray(u) ? u : [u];

  return (
    <UrlMatchCase
      c={c}
      current={
        <>
          <p className="mono">Biến thể đang mở</p>
          <p className="um-str">
            {values.length ? values.map((v) => `u = ${v}`).join(' · ') : '(không có tham số u)'}
          </p>
        </>
      }
    >
      <p className="mono">Vì sao /nhat-ban-us và /nhat-ban-ja không bị</p>
      <p className="pdesc">
        Trên site này, <Link href="/nhat-ban">/nhat-ban</Link> với{' '}
        <Link href="/nhat-ban-us">/nhat-ban-us</Link> và{' '}
        <Link href="/nhat-ban-ja">/nhat-ban-ja</Link> không dính: phần khác nhau nằm ở{' '}
        <em>path</em>, mà path được so bằng <code>equals</code> — <code>/nhat-ban-us</code> không
        bằng <code>/nhat-ban</code>. Chuỗi con chỉ lọt qua được ở phần <em>query + hash</em>, đúng
        chỗ <code>u=nhat-ban-lp-us</code> chứa <code>u=nhat-ban-lp</code>.
      </p>

      <p className="note">
        Nguồn: popup — <code>CheckURLSettingService.java:47-53</code>{' '}
        (<code>strParamRequest.contains(strParamSetting)</code>); measurement —{' '}
        <code>HeatmapCheckURLCrawBS.java:36-39</code>{' '}
        (<code>strParamCheck.contains(strParamSetup)</code>). Measurement thêm <code>?</code> vào
        đầu query (<code>getArchitectureURL</code>), popup thì không — nên chỉ riêng biến thể{' '}
        <code>?x=1&amp;u=nhat-ban-lp</code> là hai side cho kết quả khác nhau.
      </p>
    </UrlMatchCase>
  );
}

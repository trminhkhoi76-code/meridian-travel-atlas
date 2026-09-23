'use client';

import { useEffect, useState } from 'react';

/**
 * Đọc URL mà trình duyệt thực sự đang giữ, kèm các dạng chuẩn hoá mà từng side *sẽ*
 * tính ra. Đây là thứ biến ảnh chụp màn hình thành bằng chứng tự giải thích: người đọc
 * báo cáo thấy ngay host được gửi đi là gì và vì sao nó trượt chuỗi đăng ký.
 *
 * Chỉ dựng sau khi mount — `window.location` không tồn tại lúc prerender, và render lệch
 * giữa server với client sẽ làm vỡ hydrate.
 */

interface Shot {
  href: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  isPunycode: boolean;
  withoutWww: string;
  lowercased: string;
  trailingSlash: boolean;
}

function read(): Shot {
  const { href, protocol, hostname, port, pathname, search } = window.location;
  return {
    href,
    protocol: protocol.replace(/:$/, ''),
    hostname,
    port,
    pathname,
    search,
    isPunycode: /(^|\.)xn--/i.test(hostname),
    withoutWww: hostname.replace(/^www\./i, ''),
    lowercased: hostname.toLowerCase(),
    trailingSlash: pathname.length > 1 && pathname.endsWith('/'),
  };
}

export default function UrlReadout() {
  const [shot, setShot] = useState<Shot | null>(null);

  // popstate: back/forward giữa các biến thể đối chứng không remount trang.
  useEffect(() => {
    const sync = () => setShot(read());
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (!shot) return null;

  return (
    <div className="um-readout">
      <p className="mono">Trình duyệt đang gửi đi</p>
      <dl>
        <Line k="href" v={shot.href} />
        <Line k="protocol" v={shot.protocol} />
        <Line k="hostname" v={shot.hostname} />
        {shot.port ? <Line k="port" v={shot.port} /> : null}
        <Line k="pathname" v={shot.pathname} />
        <Line k="search" v={shot.search || '(rỗng)'} />
      </dl>

      <p className="mono">Các dạng chuẩn hoá</p>
      <dl>
        <Line k="host là punycode" v={shot.isPunycode ? 'có' : 'không'} />
        <Line k="host sau khi cắt www." v={shot.withoutWww} />
        <Line k="host hạ chữ thường" v={shot.lowercased} />
        <Line k="có gạch chéo cuối" v={shot.trailingSlash ? 'có' : 'không'} />
      </dl>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

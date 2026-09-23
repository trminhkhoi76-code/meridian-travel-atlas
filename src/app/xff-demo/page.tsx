import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { hrefOf } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'XFF reproduction',
  robots: { index: false },
};

export default function XffDemoPage() {
  return (
    <>
      <div className="pbody">
        <Link href={hrefOf.world()} className="back">
          ← Thế giới
        </Link>
        <h1 className="ptitle sm">XFF reproduction</h1>
        <p className="pdesc">
          Trang cô lập, không thuộc luồng sản phẩm thật, chỉ mang đúng đoạn embed script chuẩn của
          Mieruca để tái hiện bug X-Forwarded-For. Mở DevTools → Network → WS để quan sát.
        </p>
      </div>

      {/* Standard Mieruca embed snippet — unmodified, same shape as the customer-facing tag. */}
      <Script id="mierucajs" strategy="afterInteractive">
        {`
window.__fid = window.__fid || [];__fid.push([728060120]);
(function() {
function mieruca(){if(typeof window.__fjsld != "undefined") return; window.__fjsld = 1; var fjs = document.createElement('script'); fjs.type = 'text/javascript'; fjs.async = true; fjs.id = "fjssync"; var timestamp = new Date;fjs.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://hm.mieru-ca.com/service/js/mieruca-hm.js?v='+ timestamp.getTime(); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(fjs, x); };
setTimeout(mieruca, 500); document.readyState != "complete" ? (window.attachEvent ? window.attachEvent("onload", mieruca) : window.addEventListener("load", mieruca, false)) : mieruca();
})();
`}
      </Script>
    </>
  );
}

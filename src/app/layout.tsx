import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import SiteFrame, { PublicOnly } from '@/components/SiteFrame';
import { CatalogProvider } from '@/components/CatalogProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { TripProvider } from '@/components/TripProvider';
import { UploadProvider } from '@/components/UploadDialog';

// Font duy nhất của cả site, kể cả khu admin.
const ui = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

// Mọi trang khách thành ISR 5 phút, để HTML trên CDN không sống lâu hơn một bản deploy
// (xem `expireTime` trong next.config.ts). Nội dung tĩnh nên render lại cũng y hệt.
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    default: 'Meridian Travel — trải nghiệm du lịch chọn lọc',
    template: '%s · Meridian Travel',
  },
  description:
    'Duyệt theo quốc gia, thành phố, địa điểm hay loại trải nghiệm. Lưu vào hành trình rồi gửi một yêu cầu đặt cả chuyến: sáu quốc gia, mười tám thành phố, năm mươi tư trải nghiệm.',
  metadataBase: new URL('https://meridiantravel.example'),
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'Meridian Travel' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={ui.variable}>
      <head>
        {/* PublicOnly: không nạp tag đo lường ở /admin (trang có dữ liệu cá nhân của khách). */}
        <PublicOnly>
        {/* Mieruca Embed Code */}
        <Script
          id="mierucajs"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.__fid = window.__fid || [];__fid.push([149456490]);
(function() {
function mieruca(){if(typeof window.__fjsld != "undefined") return; window.__fjsld = 1; var fjs = document.createElement('script'); fjs.type = 'text/javascript'; fjs.async = true; fjs.id = "fjssync"; var timestamp = new Date;fjs.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://hm.mieru-ca.com/service/js/mieruca-hm.js?v='+ timestamp.getTime(); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(fjs, x); };
setTimeout(mieruca, 500); document.readyState != "complete" ? (window.attachEvent ? window.attachEvent("onload", mieruca) : window.addEventListener("load", mieruca, false)) : mieruca();
})();
`,
          }}
        />
        {/* Mieruca Optimize Tag */}
        <Script
          id="mierucaOptimizejs"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.__optimizeid = window.__optimizeid || [];__optimizeid.push([1428893104]);
(function () {var fjs = document.createElement('script');fjs.type = 'text/javascript';
fjs.async = true;fjs.id = "fjssync";var timestamp = new Date;fjs.src = 'https://opt.mieru-ca.com/service/js/mieruca-optimize.js?v=' + timestamp.getTime();
var x = document.getElementsByTagName('script')[0];x.parentNode.insertBefore(fjs, x);})();
`,
          }}
        />
        </PublicOnly>
      </head>
      <body>
        <CatalogProvider>
          <SessionProvider>
            <TripProvider>
              <UploadProvider>
                <SiteFrame>{children}</SiteFrame>
              </UploadProvider>
            </TripProvider>
          </SessionProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}

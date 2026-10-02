import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, IBM_Plex_Mono, Newsreader } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import SiteFrame, { PublicOnly } from '@/components/SiteFrame';
import { CatalogProvider } from '@/components/CatalogProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { TripProvider } from '@/components/TripProvider';
import { UploadProvider } from '@/components/UploadDialog';

// Font duy nhất của giao diện khách.
const ui = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

// Hai font dưới chỉ khu admin còn dùng (tiêu đề, mã số) — không preload để trang
// khách không phải tải; trình duyệt chỉ tải khi CSS của admin thật sự dùng tới.
const display = Newsreader({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  preload: false,
});

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

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
    <html
      lang="vi"
      className={`${display.variable} ${ui.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
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
        {/* Theme sáng/tối/xanh chỉ còn ở khu admin (ThemeToggle) — áp trước khi React hydrate để không nháy. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('meridian.theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t);}catch(e){}",
          }}
        />
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

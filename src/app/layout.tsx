import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, IBM_Plex_Mono, Newsreader } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import AtlasShell from '@/components/AtlasShell';
import { CatalogProvider } from '@/components/CatalogProvider';
import { ItineraryProvider } from '@/components/ItineraryProvider';
import { PinFocusProvider } from '@/components/PinFocusProvider';
import { getCountries } from '@/lib/catalog-service';
import { toApiCountry } from '@/lib/api';

const display = Newsreader({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Meridian Travel — atlas du lịch',
    template: '%s · Meridian Travel',
  },
  description:
    'Bắt đầu từ quả cầu, cuộn xuống tới từng trải nghiệm: sáu quốc gia, mười tám thành phố, năm mươi tư trải nghiệm có thể đặt trực tiếp.',
  metadataBase: new URL('https://meridiantravel.example'),
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'Meridian Travel' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const countries = (await getCountries()).map(toApiCountry);

  return (
    <html
      lang="vi"
      className={`${display.variable} ${ui.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Mieruca Embed Code */}
        <Script
          id="mierucajs"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.__fid = window.__fid || [];__fid.push([442364220]);
(function() {
function mieruca(){if(typeof window.__fjsld != "undefined") return; window.__fjsld = 1; var fjs = document.createElement('script'); fjs.type = 'text/javascript'; fjs.async = true; fjs.id = "fjssync"; var timestamp = new Date;fjs.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://dev.hm.mieru-ca.com/service/js/mieruca-hm.js?v='+ timestamp.getTime(); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(fjs, x); };
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
window.__optimizeid = window.__optimizeid || [];__optimizeid.push([1536147173]);
(function () {var fjs = document.createElement('script');fjs.type = 'text/javascript';
fjs.async = true;fjs.id = "fjssync";var timestamp = new Date;fjs.src = 'https://dev.opt.mieru-ca.com/service/js/mieruca-optimize-dev.js?v=' + timestamp.getTime();
var x = document.getElementsByTagName('script')[0];x.parentNode.insertBefore(fjs, x);})();
`,
          }}
        />
      </head>
      <body>
        {/* Áp theme đã lưu trước khi React hydrate, để không nháy sáng rồi mới đổi màu. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('meridian.theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t);}catch(e){}",
          }}
        />
        <CatalogProvider initial={countries}>
          <ItineraryProvider>
            <PinFocusProvider>
              <AtlasShell>{children}</AtlasShell>
            </PinFocusProvider>
          </ItineraryProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}

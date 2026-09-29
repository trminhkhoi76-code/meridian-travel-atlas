/**
 * Bảy ca lệch giữa side đo lường (heatmap) và side popup khi so khớp URL.
 *
 * Mỗi ca KHÔNG phải một URL đơn lẻ mà là một cặp `(URL người dùng mở, chuỗi đăng ký
 * trong console)` — chênh lệch nằm ở chỗ hai side chuẩn hoá chuỗi khác nhau trước khi
 * so, nên phải có đủ cả hai vế mới tái hiện được.
 *
 * Toàn bộ nhánh /url-match nằm ngoài luồng sản phẩm và đặt `robots.index = false`.
 */

/**
 * Bốn host cần cho bộ repro.
 *
 * Apex và www đã có sẵn trên Amplify từ trước (cùng trỏ về một CloudFront distribution,
 * cert đã validate), nên ca 1 và ca 3–6 không cần dựng thêm gì — và ca 1 chạy trên đúng
 * cặp host mà khách hàng thật gặp phải. Chỉ ca 2 và ca 7 cần hạ tầng mới, xem
 * infra/url-match/.
 */
export const HOSTS = {
  /** Vai "không www" của ca 1, và host của ca 3–6. */
  base: 'meridian-travel.org',
  /** Vai "có www" của ca 1. */
  www: 'www.meridian-travel.org',
  /** Ca 2, dạng Unicode — đây là dạng được lưu trong setting. */
  idnUnicode: '日本.meridian-travel.org',
  /** Ca 2, dạng punycode — đây là dạng trình duyệt thực sự gửi đi. */
  idnAscii: 'xn--wgv71a.meridian-travel.org',
  /** Ca 7. Amplify luôn 301 http sang https nên host này phải là S3 website endpoint. */
  httpOnly: 'http-demo.meridian-travel.org',
} as const;

/** Biến thể phụ làm đối chứng: chứng minh lệch đến từ AND/OR chứ không từ setting sai. */
export interface ControlUrl {
  label: string;
  path: string;
  expect: string;
  /** Kỳ vọng riêng của từng side cho đúng URL này — ca nào có nhiều biến thể thì mới cần. */
  verdict?: {
    heatmap: boolean;
    popup: boolean;
    /** Đánh dấu dòng chính là triệu chứng khách hàng báo. */
    issue?: boolean;
  };
}

export interface UrlCase {
  /** Khoá ASCII, trùng tên thư mục route. */
  id: string;
  n: number;
  /** Điểm so khớp đang bị lệch. */
  point: string;
  title: string;
  /** Đường dẫn trong app — dùng để điều hướng nội bộ và chạy thử ở localhost. */
  path: string;
  /** URL tuyệt đối phải mở bằng tay trên môi trường thật. */
  openUrl: string;
  /** Chuỗi (hoặc danh sách) đăng ký trong console. */
  setting: string;
  /** Kiểu so khớp phải chọn trong console. */
  mode: string;
  measurement: string;
  popup: string;
  /** Điều gì mới đúng, và vì sao. */
  correct: string;
  symptom: string;
  expectHeatmap: boolean;
  expectPopup: boolean;
  controls?: ControlUrl[];
  /**
   * `mismatch` (mặc định): hai side lệch nhau — bảy ca của bộ repro.
   * `aligned`: hai side đồng ý với nhau nhưng kết quả vẫn khiến khách thấy sai.
   */
  kind?: 'mismatch' | 'aligned';
}

export const URL_CASES: UrlCase[] = [
  {
    id: '01-www',
    n: 1,
    point: 'Tiền tố www.',
    title: 'Một bên cắt www., bên kia không',
    path: '/url-match/01-www',
    openUrl: `https://${HOSTS.www}/url-match/01-www`,
    setting: `https://${HOSTS.base}/url-match/01-www`,
    mode: 'same — khớp tuyệt đối',
    measurement: 'cắt bỏ www.',
    popup: 'so khớp nguyên văn',
    correct:
      'Cắt là một quyết định sản phẩm: theo chuẩn, www.example.com và example.com là hai host khác nhau.',
    symptom: 'Heatmap ghi nhận, popup không hiện.',
    expectHeatmap: true,
    expectPopup: false,
  },
  {
    id: '02-idn',
    n: 2,
    point: 'Punycode (host IDN)',
    title: 'Một bên đổi sang punycode, bên kia giữ Unicode',
    path: '/url-match/02-idn',
    openUrl: `https://${HOSTS.idnUnicode}/url-match/02-idn`,
    setting: `https://${HOSTS.idnUnicode}/url-match/02-idn`,
    mode: 'same — chuỗi phải được lưu ở dạng Unicode',
    measurement: 'chuyển sang punycode',
    popup: 'không chuyển',
    correct:
      'Chuyển đổi mới đúng: dạng Unicode và dạng punycode là cùng một tên miền (IDNA / UTS #46).',
    symptom: 'Giống ca 1 — chỉ xảy ra khi host được lưu ở dạng Unicode.',
    expectHeatmap: true,
    expectPopup: false,
  },
  {
    id: '03-case',
    n: 3,
    point: 'Hoa/thường trong host',
    title: 'Không bên nào hạ host về chữ thường',
    path: '/url-match/03-case',
    openUrl: `https://${HOSTS.base}/url-match/03-case`,
    setting: 'https://Meridian-Travel.org/url-match/03-case',
    mode: 'same — cố ý gõ hoa/thường lẫn lộn ở phần host',
    measurement: 'không hạ về chữ thường',
    popup: 'không hạ về chữ thường',
    correct:
      'Cả hai side đều sai: host không phân biệt hoa thường và phải được hạ về chữ thường (RFC 3986 §3.2.2, §6.2.2.1).',
    symptom: 'Setting không khớp gì cả: không heatmap, không popup, và không có lỗi nào được báo.',
    expectHeatmap: false,
    expectPopup: false,
  },
  {
    id: '04-dot',
    n: 4,
    point: 'Dấu gạch chéo cuối trên path chứa dấu chấm',
    title: 'Một bên coi v1.2 và v1.2/ là khác, bên kia coi là một',
    path: '/url-match/04-dot/v1.2',
    openUrl: `https://${HOSTS.base}/url-match/04-dot/v1.2`,
    setting: `https://${HOSTS.base}/url-match/04-dot/v1.2/`,
    mode: 'same — chuỗi đăng ký CÓ dấu gạch chéo cuối, URL mở thì KHÔNG',
    measurement: 'coi là khác nhau',
    popup: 'coi là giống nhau',
    correct:
      'Coi là khác nhau mới bám chuẩn, vì path được so sánh nguyên văn; coi là giống nhau là một quyết định sản phẩm.',
    symptom: 'Popup hiện ở nơi heatmap không ghi gì.',
    expectHeatmap: false,
    expectPopup: true,
    controls: [
      {
        label: 'Có dấu gạch chéo cuối',
        path: '/url-match/04-dot/v1.2/',
        expect: 'Khớp nguyên văn chuỗi đăng ký — cả hai side đều phải thuận.',
      },
    ],
  },
  {
    id: '05-notcontain',
    n: 5,
    point: 'notcontain từ 2 giá trị trở lên',
    title: 'Một bên hiểu danh sách loại trừ là AND, bên kia là OR',
    path: '/url-match/05-notcontain?campaign=promo',
    openUrl: `https://${HOSTS.base}/url-match/05-notcontain?campaign=promo`,
    setting: 'notcontain = ["promo", "sale"]',
    mode: 'notcontain — phải nhập đủ 2 giá trị thì lệch mới lộ ra',
    measurement: 'AND (không giá trị nào được khớp)',
    popup: 'OR (chỉ cần một giá trị trượt)',
    correct: 'AND mới đúng: một danh sách loại trừ phải loại trừ mọi giá trị trong danh sách.',
    symptom: 'Phán quyết bị đảo ngược.',
    expectHeatmap: false,
    expectPopup: true,
    controls: [
      {
        label: 'Không chứa giá trị nào',
        path: '/url-match/05-notcontain?campaign=none',
        expect: 'Cả hai side đều cho qua — ghi heatmap và hiện popup.',
      },
      {
        label: 'Chứa cả hai giá trị',
        path: '/url-match/05-notcontain?campaign=promo-sale',
        expect: 'Cả hai side đều loại — không ghi, không hiện.',
      },
    ],
  },
  {
    id: '06-notsame',
    n: 6,
    point: 'notsame từ 2 giá trị trở lên',
    title: 'Cùng lỗi AND/OR, lần này trên danh sách khớp tuyệt đối',
    path: '/url-match/06-notsame/a',
    openUrl: `https://${HOSTS.base}/url-match/06-notsame/a`,
    setting: `notsame = ["https://${HOSTS.base}/url-match/06-notsame/a", "https://${HOSTS.base}/url-match/06-notsame/b"]`,
    mode: 'notsame — phải nhập đủ 2 giá trị',
    measurement: 'AND',
    popup: 'OR',
    correct: 'AND mới đúng, cùng lý do với ca 5.',
    symptom: 'Phán quyết bị đảo ngược.',
    expectHeatmap: false,
    expectPopup: true,
    controls: [
      {
        label: 'Trùng giá trị thứ hai',
        path: '/url-match/06-notsame/b',
        expect: 'Đối xứng với /a — cùng kết quả.',
      },
      {
        label: 'Không trùng giá trị nào',
        path: '/url-match/06-notsame/c',
        expect: 'Cả hai side đều cho qua — ghi heatmap và hiện popup.',
      },
    ],
  },
  {
    id: '07-protocol',
    n: 7,
    point: 'Giao thức (http / https)',
    title: 'Không bên nào so sánh giao thức',
    path: '/url-match/07-protocol',
    openUrl: `http://${HOSTS.httpOnly}/url-match/07-protocol/`,
    setting: `https://${HOSTS.httpOnly}/url-match/07-protocol/`,
    mode: 'same — đăng ký bằng https, mở bằng http',
    measurement: 'không so sánh',
    popup: 'không so sánh',
    correct: 'Là quyết định sản phẩm: theo chuẩn, http:// và https:// là hai URI khác nhau.',
    symptom:
      'Hai side đồng ý với nhau, nhưng quyết định này không được ghi lại ở đâu ngoài code — ca này là một mục tài liệu, không phải một bug tái hiện được.',
    expectHeatmap: true,
    expectPopup: true,
  },
];

const QUERY_CASE_PATH = '/url-match/08-query';

/**
 * Ngoài bảy ca: hai side so khớp giống hệt nhau, nên không phải lệch — nhưng quy tắc
 * chung đó vẫn cho popup hiện ở URL khách không hề đăng ký. Tách mảng riêng để không
 * làm sai chữ "7 ca" và phần đếm của URL_CASES.
 */
export const EXTRA_CASES: UrlCase[] = [
  {
    id: '08-query',
    n: 8,
    kind: 'aligned',
    point: 'Query string so khớp theo chuỗi con',
    title: 'Query của request chỉ cần chứa query đăng ký',
    path: `${QUERY_CASE_PATH}?u=nhat-ban-lp-us`,
    openUrl: `https://${HOSTS.www}${QUERY_CASE_PATH}?u=nhat-ban-lp-us`,
    setting: `https://${HOSTS.www}${QUERY_CASE_PATH}?u=nhat-ban-lp`,
    mode:
      'Không chọn expression — chế độ mặc định chỉ kiểm tra domain & path. Bắt buộc: Console lưu search không có dấu "?", nên setting vừa có query vừa có expression thì popup không bao giờ hiện.',
    measurement: 'host, path equals · query + hash contains',
    popup: 'host, path equals · query + hash contains',
    correct:
      'Hai side đồng ý với nhau: khi không chọn expression, host và path so bằng equals, còn query + hash so bằng contains — request chứa chuỗi đăng ký là khớp. Không phải lệch giữa hai side, mà là quy tắc chung này cho u=nhat-ban-lp-us lọt qua.',
    symptom:
      'Popup hiện trên URL -us không được setup; pageview của -us bị measurement gộp vào url_id của setting gốc.',
    expectHeatmap: true,
    expectPopup: true,
    controls: [
      {
        label: '?u=nhat-ban-lp',
        path: `${QUERY_CASE_PATH}?u=nhat-ban-lp`,
        expect: 'URL đã setup — đối chứng dương.',
        verdict: { heatmap: true, popup: true },
      },
      {
        label: '?u=nhat-ban-lp-us',
        path: `${QUERY_CASE_PATH}?u=nhat-ban-lp-us`,
        expect: 'Chứa u=nhat-ban-lp — chính là issue.',
        verdict: { heatmap: true, popup: true, issue: true },
      },
      {
        label: '?u=nhat-ban-lp-ja',
        path: `${QUERY_CASE_PATH}?u=nhat-ban-lp-ja`,
        expect: 'Cùng cơ chế với -us.',
        verdict: { heatmap: true, popup: true, issue: true },
      },
      {
        label: '?x=1&u=nhat-ban-lp',
        path: `${QUERY_CASE_PATH}?x=1&u=nhat-ban-lp`,
        expect:
          'Popup so với query không có "?" nên khớp ở bất kỳ vị trí nào; measurement thêm "?" vào đầu cả hai vế, "?x=1&u=…" không chứa "?u=…" nên không ghi. Riêng dòng này hai side lệch nhau.',
        verdict: { heatmap: false, popup: true },
      },
      {
        label: '?u=nhat-ban',
        path: `${QUERY_CASE_PATH}?u=nhat-ban`,
        expect: 'Query không chứa chuỗi đăng ký.',
        verdict: { heatmap: false, popup: false },
      },
      {
        label: '?u=nhat-ban-l',
        path: `${QUERY_CASE_PATH}?u=nhat-ban-l`,
        expect: 'Ngắn hơn chuỗi đăng ký.',
        verdict: { heatmap: false, popup: false },
      },
      {
        label: 'Không query',
        path: QUERY_CASE_PATH,
        expect: 'Query rỗng không chứa chuỗi đăng ký.',
        verdict: { heatmap: false, popup: false },
      },
    ],
  },
];

export function findCase(id: string): UrlCase {
  const found = [...URL_CASES, ...EXTRA_CASES].find((c) => c.id === id);
  if (!found) throw new Error(`Không có ca so khớp URL nào mang id "${id}"`);
  return found;
}

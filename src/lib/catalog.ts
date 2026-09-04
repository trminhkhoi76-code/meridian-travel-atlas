/**
 * Danh mục sản phẩm. Đây là nguồn dữ liệu duy nhất cho cả bản đồ và trang bán:
 * mỗi quốc gia có `id` trùng mã ISO 3166-1 numeric trong world-atlas, nên hình
 * thể quốc gia trên quả cầu và bản ghi thương mại luôn là cùng một thực thể.
 */

export type Cat = 'STAY' | 'TRAIL' | 'TABLE' | 'STUDIO' | 'PASSAGE';

export const CAT_LABEL: Record<Cat, string> = {
  STAY: 'Lưu trú',
  TRAIL: 'Đường mòn',
  TABLE: 'Ẩm thực',
  STUDIO: 'Xưởng nghề',
  PASSAGE: 'Khám phá',
};

export const CAT_INCLUDES: Record<Cat, string[]> = {
  STAY: ['Hai đêm, gồm bữa sáng cho hai khách', 'Đưa đón sân bay riêng', 'Giữ phòng đến 14:00 ngày trả'],
  TRAIL: ['Hướng dẫn viên bản địa có chứng chỉ', 'Toàn bộ vé và phí vào khu bảo tồn', 'Gậy, áo khoác và bữa trưa mang theo'],
  TABLE: ['Trọn thực đơn kèm đồ uống pairing', 'Giữ bàn trong hai giờ', 'Ghé bếp gặp đầu bếp sau bữa'],
  STUDIO: ['Toàn bộ nguyên liệu và phí nung', 'Nhóm tối đa sáu người', 'Gửi thành phẩm về tận nhà'],
  PASSAGE: ['Hướng dẫn viên tiếng Việt', 'Toàn bộ vé vào cửa và di chuyển tại điểm', 'Nhóm tối đa mười hai khách'],
};

export const DEPARTURES: Array<{ date: string; day: string }> = [
  { date: '09.10', day: 'Thứ 6' },
  { date: '23.10', day: 'Thứ 6' },
  { date: '06.11', day: 'Thứ 6' },
];

export interface Experience {
  key: string;
  slug: string;
  title: string;
  cat: Cat;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  blurb: string;
  city: City;
  country: Country;
}

export interface City {
  key: string;
  slug: string;
  name: string;
  coord: [number, number];
  blurb: string;
  from: number;
  experiences: Experience[];
  country: Country;
}

export interface Country {
  key: string;
  slug: string;
  id: string;
  name: string;
  native: string;
  coord: [number, number];
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  from: number;
  cities: City[];
}

type RawExp = [string, Cat, string, number, number, string];
interface RawCity {
  slug: string;
  name: string;
  coord: [number, number];
  blurb: string;
  exp: RawExp[];
}
interface RawCountry {
  slug: string;
  id: string;
  name: string;
  native: string;
  coord: [number, number];
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  cities: RawCity[];
}

/** [tên, phân loại, thời lượng, giá VND, điểm đánh giá, mô tả] */
const RAW: RawCountry[] = [
  {
    slug: 'viet-nam', id: '704', name: 'Việt Nam', native: 'Ba miền, ba khí hậu',
    coord: [106.0, 16.2], season: 'Tháng 3–4, tháng 9–11',
    flight: 'Bay nội địa 1g20 – 2g10', visa: 'Không cần', currency: 'VND',
    blurb: 'Ba miền, ba khí hậu, và những chuyến bay nội địa dưới hai giờ. Đi từ cao nguyên đá phía Bắc xuống tận đảo ngọc phía Nam trong cùng một kỳ nghỉ.',
    cities: [
      {
        slug: 'ha-giang', name: 'Hà Giang', coord: [104.983, 22.823],
        blurb: 'Cao nguyên đá, đèo Mã Pí Lèng và những bản Mông nằm trên mây.',
        exp: [
          ['Cung đường Mã Pí Lèng', 'PASSAGE', '2 ngày', 3900000, 4.9, 'Đi easy rider qua Đồng Văn – Mèo Vạc, dừng ở hẻm Tu Sản đúng lúc nắng chiều xuống lòng sông Nho Quế.'],
          ['Nhà trình tường người Mông', 'STAY', '2 đêm', 2400000, 4.7, 'Ngủ trong nhà đất dày nửa mét ở Lũng Cẩm, sáng dậy nghe tiếng khèn tập ngoài sân.'],
          ['Chợ phiên Đồng Văn', 'TABLE', '4 giờ', 690000, 4.6, 'Đi chợ Chủ nhật từ năm giờ sáng, ăn thắng cố và mèn mén ngay tại sạp.'],
        ],
      },
      {
        slug: 'hoi-an', name: 'Hội An', coord: [108.338, 15.880],
        blurb: 'Phố cổ đèn lồng, bãi An Bàng và làng rau Trà Quế bốn trăm năm.',
        exp: [
          ['Bếp làng Trà Quế', 'STUDIO', '5 giờ', 1290000, 4.8, 'Hái rau trong vườn bốn trăm năm tuổi, học ba món Quảng rồi ăn ngay giữa vườn.'],
          ['Nhà cổ bên sông Hoài', 'STAY', '2 đêm', 4600000, 4.7, 'Nhà rường gỗ mít được cải tạo, ban công nhìn thẳng ra Chùa Cầu.'],
          ['Đặt may trong 24 giờ', 'STUDIO', '3 giờ', 2800000, 4.5, 'Chọn vải và lấy số đo buổi sáng, thử đồ ngay tối cùng ngày ở xưởng gia đình.'],
        ],
      },
      {
        slug: 'phu-quoc', name: 'Phú Quốc', coord: [103.984, 10.289],
        blurb: 'Bãi Sao, rừng nguyên sinh và hoàng hôn ở Rạch Vẹm.',
        exp: [
          ['Bungalow bãi Ông Lang', 'STAY', '2 đêm', 5400000, 4.6, 'Mười hai căn gỗ dưới hàng dừa, không TV, bữa sáng dọn thẳng ra bờ cát.'],
          ['Câu mực đêm Rạch Vẹm', 'PASSAGE', '4 giờ', 850000, 4.5, 'Ra khơi lúc năm giờ chiều, câu mực bằng đèn rồi nướng ăn ngay trên thuyền.'],
          ['Nhà thùng nước mắm', 'STUDIO', '2 giờ', 450000, 4.4, 'Vào nhà thùng gỗ bời lời trăm tuổi, nếm nước mắm nhĩ rút từ thùng đầu tiên.'],
        ],
      },
    ],
  },
  {
    slug: 'nhat-ban', id: '392', name: 'Nhật Bản', native: '日本',
    coord: [138.2, 37.0], season: 'Tháng 3–4, tháng 10–11',
    flight: 'HAN · SGN — bay thẳng 5g20', visa: 'Cần visa · hỗ trợ hồ sơ', currency: 'JPY',
    blurb: 'Tàu đúng giờ đến từng phút, và những quán chỉ có tám chỗ ngồi. Mùa nào cũng có lý do: hoa anh đào, lá đỏ, hay tuyết bột Hokkaido.',
    cities: [
      {
        slug: 'kyoto', name: 'Kyoto', coord: [135.768, 35.012],
        blurb: 'Một nghìn ngôi chùa, và Con đường Triết Học vào mùa lá đỏ.',
        exp: [
          ['Ryokan Arashiyama', 'STAY', '2 đêm', 14800000, 4.9, 'Chiếu tatami, bữa kaiseki dọn tận phòng và onsen riêng nhìn ra rừng trúc.'],
          ['Fushimi Inari trước bình minh', 'PASSAGE', '3 giờ', 1100000, 4.8, 'Leo mười nghìn cổng torii lúc năm giờ sáng, khi cả ngọn núi chỉ còn tiếng chim.'],
          ['Trà đạo trong nhà machiya', 'STUDIO', '2 giờ', 2100000, 4.7, 'Một chủ trà thế hệ thứ ba, bốn khách, và bốn mươi phút gần như im lặng.'],
        ],
      },
      {
        slug: 'hokkaido', name: 'Hokkaido', coord: [141.354, 43.062],
        blurb: 'Tuyết bột, chợ hải sản lúc sáu giờ và những cánh đồng Furano.',
        exp: [
          ['Tuyết bột Niseko', 'TRAIL', '1 ngày', 6900000, 4.9, 'Vé cáp cả ngày, thuê trọn bộ đồ và một hướng dẫn biết chỗ tuyết chưa ai cày.'],
          ['Chợ Nijo lúc sáu giờ', 'TABLE', '3 giờ', 1400000, 4.6, 'Cua lông, nhím biển và cơm hải sản ăn đứng ngay tại quầy.'],
          ['Onsen Noboribetsu', 'STAY', '2 đêm', 11200000, 4.8, 'Suối lưu huỳnh trong Thung lũng Địa Ngục, bồn ngoài trời giữa tuyết.'],
        ],
      },
      {
        slug: 'tokyo', name: 'Tokyo', coord: [139.767, 35.681],
        blurb: 'Ba mươi bảy triệu người, và những quán tám chỗ ngồi.',
        exp: [
          ['Sushi tám chỗ ở Ginza', 'TABLE', 'Buổi tối', 9800000, 4.9, 'Omakase hai mươi miếng, cá lấy từ chợ Toyosu sáng cùng ngày.'],
          ['Yanaka và Nezu đi bộ', 'PASSAGE', '3 giờ', 950000, 4.5, 'Phần Tokyo còn sót lại sau chiến tranh: nghĩa trang, tiệm bánh cũ và mèo hoang.'],
          ['Phòng nhìn xuống Shibuya', 'STAY', '2 đêm', 13400000, 4.7, 'Tầng ba mươi chín, kính suốt trần, nhìn thẳng giao lộ đông nhất hành tinh.'],
        ],
      },
    ],
  },
  {
    slug: 'han-quoc', id: '410', name: 'Hàn Quốc', native: '한국',
    coord: [127.8, 36.4], season: 'Tháng 4–5, tháng 9–10',
    flight: 'HAN · SGN — bay thẳng 4g40', visa: 'Cần visa · hỗ trợ hồ sơ', currency: 'KRW',
    blurb: 'Bốn giờ bay, khác biệt hoàn toàn. Cung điện và quán nhậu trong cùng một dãy phố, núi ngay sau lưng thành phố.',
    cities: [
      {
        slug: 'seoul', name: 'Seoul', coord: [126.978, 37.567],
        blurb: 'Cung điện, quán nhậu và những con dốc Ikseon-dong.',
        exp: [
          ['Hanok ở Bukchon', 'STAY', '2 đêm', 7800000, 4.7, 'Nhà gỗ có sân trong, sàn ondol sưởi ấm, trà sáng nhìn ra mái ngói.'],
          ['Đêm chợ Gwangjang', 'TABLE', '3 giờ', 890000, 4.6, 'Bindaetteok, gimbap cuốn tay và soju ở dãy bàn nhựa đông nhất Seoul.'],
          ['Tường thành Bugaksan', 'TRAIL', '4 giờ', 1150000, 4.5, 'Đi dọc tường thành trên núi, nhìn xuống Nhà Xanh và toàn bộ nội đô.'],
        ],
      },
      {
        slug: 'jeju', name: 'Jeju', coord: [126.531, 33.499],
        blurb: 'Núi lửa Hallasan, bờ đá đen và những nữ thợ lặn haenyeo.',
        exp: [
          ['Olle Trail số 7', 'TRAIL', '6 giờ', 1300000, 4.8, 'Mười bảy cây số men bờ biển phía nam, kết thúc ở làng chài Seogwipo.'],
          ['Bữa của các haenyeo', 'TABLE', '2 giờ', 1600000, 4.7, 'Bào ngư và nhím biển do chính các bà thợ lặn ngoài bảy mươi mang lên.'],
          ['Nhà đá đen ven biển', 'STAY', '2 đêm', 6400000, 4.6, 'Bê tông thô và đá bazan, bồn tắm quay thẳng ra Thái Bình Dương.'],
        ],
      },
      {
        slug: 'busan', name: 'Busan', coord: [129.075, 35.180],
        blurb: 'Cảng lớn nhất nước, chợ cá Jagalchi và làng Gamcheon.',
        exp: [
          ['Chợ cá Jagalchi rạng sáng', 'PASSAGE', '3 giờ', 780000, 4.5, 'Phiên đấu giá năm giờ sáng, rồi ăn cá nướng ở tầng hai ngay trên chợ.'],
          ['Gamcheon và Huinnyeoul', 'PASSAGE', '4 giờ', 920000, 4.4, 'Hai làng bám vách núi, sơn đủ màu, nhìn thẳng ra mặt biển.'],
          ['Phòng góc Haeundae', 'STAY', '2 đêm', 5900000, 4.6, 'Phòng góc trên bãi Haeundae, cà phê sáng lúc thuỷ triều xuống.'],
        ],
      },
    ],
  },
  {
    slug: 'thuy-si', id: '756', name: 'Thụy Sĩ', native: 'Schweiz',
    coord: [8.23, 46.82], season: 'Tháng 6–9, tháng 12–2',
    flight: 'Quá cảnh 1 chặng · 14 giờ', visa: 'Schengen · hỗ trợ hồ sơ', currency: 'CHF',
    blurb: 'Đắt, và xứng đáng. Hệ thống tàu chạm tới cả những ngôi làng không có đường ô tô — nên mua Swiss Travel Pass trước khi bay.',
    cities: [
      {
        slug: 'zermatt', name: 'Zermatt', coord: [7.748, 46.020],
        blurb: 'Không một chiếc xe hơi, và ngọn Matterhorn đứng ngay cuối phố.',
        exp: [
          ['Gornergrat lúc mặt trời mọc', 'PASSAGE', '4 giờ', 4200000, 4.9, 'Chuyến tàu răng cưa đầu tiên trong ngày, lên 3.089 m trước khi trời sáng.'],
          ['Năm hồ Matterhorn', 'TRAIL', '6 giờ', 3600000, 4.8, 'Cung 5-Seenweg đi từ Blauherd, ngọn núi soi bóng trên từng mặt hồ.'],
          ['Chalet gỗ hai trăm năm', 'STAY', '2 đêm', 22500000, 4.7, 'Gỗ thông đen, lò sưởi đá, ban công nhìn thẳng Matterhorn.'],
        ],
      },
      {
        slug: 'lucerne', name: 'Lucerne', coord: [8.309, 47.050],
        blurb: 'Cầu gỗ Kapellbrücke và một cái hồ hình ngón tay.',
        exp: [
          ['Tàu hơi nước hồ Lucerne', 'PASSAGE', '3 giờ', 2100000, 4.6, 'Tàu bánh guồng từ 1928, dừng ở những làng không có đường bộ dẫn tới.'],
          ['Xưởng đồng hồ cơ', 'STUDIO', '4 giờ', 8900000, 4.8, 'Tự lắp một bộ máy cơ dưới kính lúp, rồi mang chiếc đồng hồ đó về.'],
          ['Khách sạn bên hồ', 'STAY', '2 đêm', 16800000, 4.6, 'Toà Belle Époque, ban công gỗ, sáng ra nhìn thẳng núi Pilatus.'],
        ],
      },
      {
        slug: 'interlaken', name: 'Interlaken', coord: [7.866, 46.686],
        blurb: 'Hai hồ, một thung lũng, và cửa ngõ lên Jungfrau.',
        exp: [
          ['Jungfraujoch', 'PASSAGE', '8 giờ', 6800000, 4.7, 'Ga tàu cao nhất châu Âu ở 3.454 m, đường hầm khoan xuyên trong lòng Eiger.'],
          ['Dù lượn Beatenberg', 'PASSAGE', '2 giờ', 3400000, 4.9, 'Bay đôi hai mươi phút trên hai hồ xanh ngọc, hạ cánh giữa lòng Interlaken.'],
          ['Nhà gỗ Lauterbrunnen', 'STAY', '2 đêm', 13900000, 4.7, 'Thung lũng bảy mươi hai thác nước, cửa sổ mở đúng hướng thác Staubbach.'],
        ],
      },
    ],
  },
  {
    slug: 'ma-roc', id: '504', name: 'Ma-rốc', native: 'المغرب',
    coord: [-7.09, 31.79], season: 'Tháng 3–5, tháng 10',
    flight: 'Quá cảnh 1 chặng · 16 giờ', visa: 'Cần visa · hỗ trợ hồ sơ', currency: 'MAD',
    blurb: 'Nghề thủ công là sợi chỉ xuyên suốt: gạch zellige đục tay ở Fez, len nhuộm giữa sân ở Chefchaouen, và một nồi tagine phải mất năm tiếng.',
    cities: [
      {
        slug: 'marrakech', name: 'Marrakech', coord: [-7.981, 31.630],
        blurb: 'Medina có tường bao, chạy bằng những mái nhà và ngõ sau.',
        exp: [
          ['Riad trong medina', 'STAY', '2 đêm', 6900000, 4.8, 'Năm sân trong nối nhau, tường hồng đất, mái nhà hứng trọn tiếng gọi cầu nguyện.'],
          ['Đi souk cùng người bản địa', 'PASSAGE', '4 giờ', 980000, 4.6, 'Từ ngõ nhuộm vải tới xưởng thuộc da, với người tuần nào cũng mua ở đây.'],
          ['Tagine trên than', 'TABLE', '5 giờ', 1250000, 4.7, 'Đi chợ lúc sáng sớm rồi nấu cừu với chanh muối trên sân thượng nhà dar.'],
        ],
      },
      {
        slug: 'fez', name: 'Fez', coord: [-5.000, 34.033],
        blurb: 'Medina cổ nhất thế giới, vẫn cắt và nung bằng tay.',
        exp: [
          ['Xưởng gạch zellige', 'STUDIO', '4 giờ', 1150000, 4.8, 'Tự đục một ngôi sao tám cánh bên cạnh các nghệ nhân khu Ain Nokbi.'],
          ['Fes el-Bali lúc rạng sáng', 'PASSAGE', '3 giờ', 850000, 4.5, 'Chín nghìn con ngõ; đi sáu con ngõ đáng đi trước khi đàn la ra đường.'],
          ['Nhà thương gia sáu trăm năm', 'STAY', '2 đêm', 4700000, 4.7, 'Do hai kiến trúc sư phục dựng và vẫn đang sống ở tầng trên.'],
        ],
      },
      {
        slug: 'chefchaouen', name: 'Chefchaouen', coord: [-5.269, 35.171],
        blurb: 'Một thị trấn xanh gấp trong dãy Rif.',
        exp: [
          ['Đường mòn dãy Rif', 'TRAIL', '6 giờ', 1050000, 4.6, 'Lên Nhà thờ Tây Ban Nha rồi sang các hồ Akchour, phô mai dê ăn ở đỉnh.'],
          ['Ngõ xanh lúc mở cửa', 'PASSAGE', '2 giờ', 620000, 4.4, 'Đi medina trước khi xe khách tới, lúc màu xanh vẫn còn lạnh.'],
          ['Xưởng dệt len', 'STUDIO', '3 giờ', 890000, 4.5, 'Len nhuộm ngay giữa sân, trên khung cửi già hơn lớp sơn của thị trấn.'],
        ],
      },
    ],
  },
  {
    slug: 'uc', id: '036', name: 'Úc', native: 'Australia',
    coord: [140.0, -27.0], season: 'Tháng 9–11, tháng 3–5',
    flight: 'SGN — bay thẳng 8g30', visa: 'Cần visa · hỗ trợ hồ sơ', currency: 'AUD',
    blurb: 'Mùa ngược với Việt Nam: tháng Chín tới tháng Mười Một là mùa xuân. Khoảng cách trên bản đồ luôn xa hơn bạn nghĩ — đừng nhồi lịch trình.',
    cities: [
      {
        slug: 'sydney', name: 'Sydney', coord: [151.209, -33.868],
        blurb: 'Một cái cảng, và những bãi biển ngay trong lòng thành phố.',
        exp: [
          ['Bondi đến Coogee', 'TRAIL', '3 giờ', 900000, 4.6, 'Sáu cây số đường ven vách đá, qua sáu bãi tắm và một hồ bơi nước mặn.'],
          ['Leo cầu Harbour lúc chạng vạng', 'PASSAGE', '4 giờ', 6200000, 4.8, 'Lên đỉnh vòm thép 134 m đúng lúc đèn cả thành phố bật lên.'],
          ['Khách sạn khu The Rocks', 'STAY', '2 đêm', 9600000, 4.6, 'Kho hàng đá sa thạch từ 1850, đi bộ năm phút tới Nhà hát Con Sò.'],
        ],
      },
      {
        slug: 'tasmania', name: 'Tasmania', coord: [147.325, -42.882],
        blurb: 'Đảo tận cùng, rừng nguyên sinh và một bảo tàng đào trong lòng đá.',
        exp: [
          ['Bảo tàng MONA', 'PASSAGE', '4 giờ', 1400000, 4.8, 'Phà riêng ngược sông Derwent tới phòng trưng bày khoét sâu ba tầng dưới đá.'],
          ['Mũi Cape Hauy', 'TRAIL', '5 giờ', 1250000, 4.7, 'Đường mòn ra những cột đá dolerite dựng đứng cao nhất Nam bán cầu.'],
          ['Bàn ăn nông trại Huon', 'TABLE', '4 giờ', 2300000, 4.6, 'Hàu đảo Bruny, táo Huon và vang lạnh, ăn ngay giữa vườn.'],
        ],
      },
      {
        slug: 'cairns', name: 'Cairns', coord: [145.770, -16.923],
        blurb: 'Cửa ngõ rạn Great Barrier và rừng mưa Daintree.',
        exp: [
          ['Lặn rạn Great Barrier', 'PASSAGE', '1 ngày', 4800000, 4.9, 'Hai điểm lặn ngoài khơi Agincourt, có kèm riêng cho người lặn lần đầu.'],
          ['Daintree cùng người Kuku Yalanji', 'TRAIL', '5 giờ', 2100000, 4.8, 'Rừng mưa một trăm tám mươi triệu năm, dẫn bởi chủ nhân truyền đời của nó.'],
          ['Lodge giữa rừng mưa', 'STAY', '2 đêm', 8400000, 4.6, 'Nhà sàn trong tán cây ở Cape Tribulation, đêm nghe ếch và dơi quạ.'],
        ],
      },
    ],
  },
];

/** Bỏ dấu tiếng Việt để làm slug URL: "Mã Pí Lèng" -> "ma-pi-leng". */
export function slugify(input: string): string {
  const stripped = Array.from(input.normalize('NFD'))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x300 || code > 0x36f; // bỏ toàn bộ dấu thanh + dấu phụ
    })
    .join('');
  return stripped
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const COUNTRIES: Country[] = RAW.map((rc, ci) => {
  const country = {
    key: `c${ci}`,
    slug: rc.slug,
    id: rc.id,
    name: rc.name,
    native: rc.native,
    coord: rc.coord,
    season: rc.season,
    flight: rc.flight,
    visa: rc.visa,
    currency: rc.currency,
    blurb: rc.blurb,
    from: 0,
    cities: [] as City[],
  } as Country;

  country.cities = rc.cities.map((rt, ti) => {
    const city = {
      key: `${country.key}t${ti}`,
      slug: rt.slug,
      name: rt.name,
      coord: rt.coord,
      blurb: rt.blurb,
      from: 0,
      experiences: [] as Experience[],
      country,
    } as City;

    city.experiences = rt.exp.map(([title, cat, duration, price, rating, blurb], ei) => ({
      key: `${city.key}e${ei}`,
      slug: slugify(title),
      title,
      cat,
      duration,
      price,
      rating,
      // Số lượt đánh giá suy ra từ giá — cố định giữa server và client, không random.
      reviews: 48 + ((price / 10000) * 13) % 260 | 0,
      blurb,
      city,
      country,
    }));

    city.from = Math.min(...city.experiences.map((e) => e.price));
    return city;
  });

  country.from = Math.min(...country.cities.map((c) => c.from));
  return country;
});

export const TOTAL_CITIES = COUNTRIES.reduce((n, c) => n + c.cities.length, 0);
export const TOTAL_EXPERIENCES = COUNTRIES.reduce(
  (n, c) => n + c.cities.reduce((m, t) => m + t.experiences.length, 0),
  0,
);

export const EXPERIENCE_BY_KEY = new Map<string, Experience>();
COUNTRIES.forEach((c) =>
  c.cities.forEach((t) => t.experiences.forEach((e) => EXPERIENCE_BY_KEY.set(e.key, e))),
);

export function findCountry(slug?: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}
export function findCity(country: Country | undefined, slug?: string): City | undefined {
  return country?.cities.find((t) => t.slug === slug);
}
export function findExperience(city: City | undefined, slug?: string): Experience | undefined {
  return city?.experiences.find((e) => e.slug === slug);
}

/** Đường dẫn của một nút bất kỳ — URL chính là trạng thái zoom. */
export const hrefOf = {
  world: () => '/',
  country: (c: Country) => `/${c.slug}`,
  city: (t: City) => `/${t.country.slug}/${t.slug}`,
  experience: (e: Experience) => `/${e.country.slug}/${e.city.slug}/${e.slug}`,
  itinerary: () => '/hanh-trinh',
};

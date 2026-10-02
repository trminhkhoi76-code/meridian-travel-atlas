/**
 * Dữ liệu mẫu — đóng vai trò "cơ sở dữ liệu". Phía server đọc qua
 * [catalog-service.ts](./catalog-service.ts) (trang SSG, route handler); phía
 * client chỉ CatalogProvider import trực tiếp, để danh mục nằm trong chunk JS
 * (cache một lần) thay vì lặp lại trong payload RSC của mọi route.
 * Khi thay API thật: đổi catalog-service.ts và CatalogProvider — file này và RAW
 * có thể bỏ hẳn.
 */

import { slugify } from './catalog';
import type { Cat, City, Country, Experience, LngLat, Place } from './catalog';

/** [tên, phân loại, thời lượng, giá VND, điểm đánh giá, mô tả, slug địa điểm] */
type RawExp = [string, Cat, string, number, number, string, string];
/** [tên, loại, [kinh độ, vĩ độ], mô tả] — toạ độ tra từ OpenStreetMap (Nominatim). */
type RawPlace = [string, string, LngLat, string];
interface RawCity {
  slug: string;
  name: string;
  coord: LngLat;
  blurb: string;
  places: RawPlace[];
  exp: RawExp[];
}
interface RawCountry {
  slug: string;
  id: string;
  name: string;
  native: string;
  coord: LngLat;
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  cities: RawCity[];
}

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
        places: [
          ['Đèo Mã Pí Lèng', 'Đèo · Đồng Văn – Mèo Vạc', [105.3979, 23.242], 'Con đèo nối Đồng Văn với Mèo Vạc, men theo vách núi đá vôi và nhìn thẳng xuống hẻm sông Nho Quế.'],
          ['Hẻm Tu Sản', 'Hẻm vực · Sông Nho Quế', [105.4266, 23.2309], 'Hẻm vực dưới chân đèo Mã Pí Lèng, nơi sông Nho Quế chảy giữa hai vách đá dựng đứng; có thuyền xuôi lòng hẻm.'],
          ['Làng Lũng Cẩm', 'Bản người Mông · Sủng Là', [105.2157, 23.227], 'Bản người Mông trong thung lũng Sủng Là, nhà trình tường mái ngói âm dương quây quanh vườn đào và hoa cải.'],
          ['Chợ Đồng Văn', 'Chợ phiên · Phố cổ Đồng Văn', [105.361, 23.2769], 'Chợ họp sáng Chủ nhật giữa phố cổ Đồng Văn; người các bản xuống bán ngựa, vải lanh và thắng cố từ tờ mờ sáng.'],
        ],
        exp: [
          ['Cung đường Mã Pí Lèng', 'PASSAGE', '2 ngày', 3900000, 4.9, 'Đi easy rider qua Đồng Văn – Mèo Vạc, dừng ở hẻm Tu Sản đúng lúc nắng chiều xuống lòng sông Nho Quế.', 'deo-ma-pi-leng'],
          ['Nhà trình tường người Mông', 'STAY', '2 đêm', 2400000, 4.7, 'Ngủ trong nhà đất dày nửa mét ở Lũng Cẩm, sáng dậy nghe tiếng khèn tập ngoài sân.', 'lang-lung-cam'],
          ['Chợ phiên Đồng Văn', 'TABLE', '4 giờ', 690000, 4.6, 'Đi chợ Chủ nhật từ năm giờ sáng, ăn thắng cố và mèn mén ngay tại sạp.', 'cho-dong-van'],
        ],
      },
      {
        slug: 'hoi-an', name: 'Hội An', coord: [108.338, 15.880],
        blurb: 'Phố cổ đèn lồng, bãi An Bàng và làng rau Trà Quế bốn trăm năm.',
        places: [
          ['Phố cổ Hội An', 'Phố cổ · Bên sông Hoài', [108.326, 15.8772], 'Khu phố buôn bán từ thế kỷ XVI với nhà gỗ, hội quán và Chùa Cầu; tối đến đèn lồng thắp dọc bờ sông Hoài.'],
          ['Làng rau Trà Quế', 'Làng nghề · Bắc phố cổ', [108.336, 15.9027], 'Làng trồng rau thơm hơn bốn trăm năm tuổi, bón bằng rong sông, cách phố cổ chừng ba cây số.'],
        ],
        exp: [
          ['Bếp làng Trà Quế', 'STUDIO', '5 giờ', 1290000, 4.8, 'Hái rau trong vườn bốn trăm năm tuổi, học ba món Quảng rồi ăn ngay giữa vườn.', 'lang-rau-tra-que'],
          ['Nhà cổ bên sông Hoài', 'STAY', '2 đêm', 4600000, 4.7, 'Nhà rường gỗ mít được cải tạo, ban công nhìn thẳng ra Chùa Cầu.', 'pho-co-hoi-an'],
          ['Đặt may trong 24 giờ', 'STUDIO', '3 giờ', 2800000, 4.5, 'Chọn vải và lấy số đo buổi sáng, thử đồ ngay tối cùng ngày ở xưởng gia đình.', 'pho-co-hoi-an'],
        ],
      },
      {
        slug: 'phu-quoc', name: 'Phú Quốc', coord: [103.984, 10.289],
        blurb: 'Bãi Sao, rừng nguyên sinh và hoàng hôn ở Rạch Vẹm.',
        places: [
          ['Bãi Ông Lang', 'Bãi biển · Bờ tây', [103.9367, 10.2574], 'Bãi cát vắng ở bờ tây đảo, giữa Dương Đông và Cửa Cạn. Mùa khô nước lặng, ít sóng, mặt trời lặn thẳng xuống biển. Dọc bãi là hàng dừa và vài khu bungalow gỗ nhỏ.'],
          ['Rạch Vẹm', 'Làng chài · Bờ bắc', [103.9331, 10.3612], 'Làng chài nhà sàn trên mặt nước ở mũi bắc đảo, nơi thuyền ra khơi lúc chiều muộn.'],
          ['Dương Đông', 'Thị trấn · Bờ tây', [103.9564, 10.2172], 'Trung tâm của đảo: chợ đêm, Dinh Cậu và những nhà thùng ủ nước mắm truyền thống.'],
          ['Vườn quốc gia Phú Quốc', 'Rừng nguyên sinh · Phía bắc', [104.0246, 10.3283], 'Rừng phủ gần nửa phía bắc đảo, có suối và đường mòn ngắn cho người đi bộ.'],
          ['Bãi Sao', 'Bãi biển · Bờ đông nam', [104.0352, 10.0525], 'Cát trắng mịn và nước xanh trong ở bờ đông nam, gần cảng An Thới.'],
        ],
        exp: [
          ['Bungalow bãi Ông Lang', 'STAY', '2 đêm', 5400000, 4.6, 'Mười hai căn gỗ dưới hàng dừa, không TV, bữa sáng dọn thẳng ra bờ cát.', 'bai-ong-lang'],
          ['Câu mực đêm Rạch Vẹm', 'PASSAGE', '4 giờ', 850000, 4.5, 'Ra khơi lúc năm giờ chiều, câu mực bằng đèn rồi nướng ăn ngay trên thuyền.', 'rach-vem'],
          ['Nhà thùng nước mắm', 'STUDIO', '2 giờ', 450000, 4.4, 'Vào nhà thùng gỗ bời lời trăm tuổi, nếm nước mắm nhĩ rút từ thùng đầu tiên.', 'duong-dong'],
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
        places: [
          ['Arashiyama', 'Rừng trúc · Tây Kyoto', [135.6711, 35.0167], 'Vùng chân núi phía tây Kyoto với rừng trúc Sagano, cầu Togetsukyō và những ryokan nhìn ra sông Katsura.'],
          ['Fushimi Inari', 'Đền Thần đạo · Nam Kyoto', [135.7797, 34.9675], 'Đền thờ thần Inari với hàng nghìn cổng torii đỏ phủ kín lối lên núi, mở cửa cả ngày lẫn đêm.'],
          ['Gion', 'Phố machiya · Đông Kyoto', [135.7784, 35.0047], 'Khu phố cổ quanh đền Yasaka với nhà gỗ machiya, quán trà và những con hẻm lát đá.'],
          ['Đường Triết Học', 'Lối đi bộ · Đông Kyoto', [135.7958, 35.022], 'Lối đi bộ dọc con kênh dưới chân núi Higashiyama, rợp anh đào mùa xuân và lá đỏ mùa thu.'],
        ],
        exp: [
          ['Ryokan Arashiyama', 'STAY', '2 đêm', 14800000, 4.9, 'Chiếu tatami, bữa kaiseki dọn tận phòng và onsen riêng nhìn ra rừng trúc.', 'arashiyama'],
          ['Fushimi Inari trước bình minh', 'PASSAGE', '3 giờ', 1100000, 4.8, 'Leo mười nghìn cổng torii lúc năm giờ sáng, khi cả ngọn núi chỉ còn tiếng chim.', 'fushimi-inari'],
          ['Trà đạo trong nhà machiya', 'STUDIO', '2 giờ', 2100000, 4.7, 'Một chủ trà thế hệ thứ ba, bốn khách, và bốn mươi phút gần như im lặng.', 'gion'],
        ],
      },
      {
        slug: 'hokkaido', name: 'Hokkaido', coord: [141.354, 43.062],
        blurb: 'Tuyết bột, chợ hải sản lúc sáu giờ và những cánh đồng Furano.',
        places: [
          ['Chợ Nijo', 'Chợ hải sản · Sapporo', [141.3585, 43.0582], 'Chợ hải sản giữa trung tâm Sapporo, các quầy mở từ sáng sớm với cua, nhím biển và cơm hải sản.'],
          ['Niseko', 'Khu trượt tuyết · Tây nam Hokkaido', [140.6984, 42.862], 'Khu trượt tuyết quanh núi Niseko Annupuri, nổi tiếng với tuyết bột khô đổ dày suốt mùa đông.'],
          ['Thung lũng Địa Ngục', 'Suối nóng · Noboribetsu', [141.1453, 42.4964], 'Thung lũng núi lửa bốc hơi lưu huỳnh phía trên thị trấn suối nóng Noboribetsu.'],
          ['Furano', 'Cánh đồng hoa · Giữa Hokkaido', [142.3835, 43.3423], 'Vùng đồng bằng giữa Hokkaido, mùa hè phủ kín oải hương, mùa đông thành khu trượt tuyết.'],
        ],
        exp: [
          ['Tuyết bột Niseko', 'TRAIL', '1 ngày', 6900000, 4.9, 'Vé cáp cả ngày, thuê trọn bộ đồ và một hướng dẫn biết chỗ tuyết chưa ai cày.', 'niseko'],
          ['Chợ Nijo lúc sáu giờ', 'TABLE', '3 giờ', 1400000, 4.6, 'Cua lông, nhím biển và cơm hải sản ăn đứng ngay tại quầy.', 'cho-nijo'],
          ['Onsen Noboribetsu', 'STAY', '2 đêm', 11200000, 4.8, 'Suối lưu huỳnh trong Thung lũng Địa Ngục, bồn ngoài trời giữa tuyết.', 'thung-lung-dia-nguc'],
        ],
      },
      {
        slug: 'tokyo', name: 'Tokyo', coord: [139.767, 35.681],
        blurb: 'Ba mươi bảy triệu người, và những quán tám chỗ ngồi.',
        places: [
          ['Ginza', 'Khu phố · Chūō', [139.7647, 35.672], 'Khu phố sang trọng bậc nhất Tokyo, tập trung cửa hàng lớn và những quầy sushi omakase nhỏ.'],
          ['Yanaka', 'Phố cũ · Taitō', [139.7653, 35.7277], 'Khu phố ít bị tàn phá thời chiến, còn chùa cổ, nghĩa trang Yanaka và phố mua sắm Yanaka Ginza.'],
          ['Giao lộ Shibuya', 'Giao lộ · Shibuya', [139.7005, 35.6595], 'Giao lộ trước ga Shibuya, nơi hàng nghìn người cùng băng qua mỗi lần đèn chuyển xanh.'],
        ],
        exp: [
          ['Sushi tám chỗ ở Ginza', 'TABLE', 'Buổi tối', 9800000, 4.9, 'Omakase hai mươi miếng, cá lấy từ chợ Toyosu sáng cùng ngày.', 'ginza'],
          ['Yanaka và Nezu đi bộ', 'PASSAGE', '3 giờ', 950000, 4.5, 'Phần Tokyo còn sót lại sau chiến tranh: nghĩa trang, tiệm bánh cũ và mèo hoang.', 'yanaka'],
          ['Phòng nhìn xuống Shibuya', 'STAY', '2 đêm', 13400000, 4.7, 'Tầng ba mươi chín, kính suốt trần, nhìn thẳng giao lộ đông nhất hành tinh.', 'giao-lo-shibuya'],
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
        places: [
          ['Làng Bukchon Hanok', 'Làng hanok · Jongno', [126.9859, 37.5824], 'Hàng trăm nhà hanok mái ngói nằm giữa hai cung Gyeongbokgung và Changdeokgung.'],
          ['Chợ Gwangjang', 'Chợ truyền thống · Jongno', [127.0007, 37.5698], 'Một trong những chợ lâu đời nhất Seoul, nổi tiếng với dãy hàng ăn bindaetteok và gimbap.'],
          ['Núi Bugaksan', 'Tường thành · Bắc Seoul', [126.9738, 37.593], 'Ngọn núi sau Nhà Xanh, có đoạn tường thành Seoul chạy dọc sống núi.'],
          ['Ikseon-dong', 'Hẻm hanok · Jongno', [126.9898, 37.5744], 'Khu hẻm hanok nhỏ được cải tạo thành quán cà phê và tiệm ăn, cách chợ Gwangjang vài phút đi bộ.'],
        ],
        exp: [
          ['Hanok ở Bukchon', 'STAY', '2 đêm', 7800000, 4.7, 'Nhà gỗ có sân trong, sàn ondol sưởi ấm, trà sáng nhìn ra mái ngói.', 'lang-bukchon-hanok'],
          ['Đêm chợ Gwangjang', 'TABLE', '3 giờ', 890000, 4.6, 'Bindaetteok, gimbap cuốn tay và soju ở dãy bàn nhựa đông nhất Seoul.', 'cho-gwangjang'],
          ['Tường thành Bugaksan', 'TRAIL', '4 giờ', 1150000, 4.5, 'Đi dọc tường thành trên núi, nhìn xuống Nhà Xanh và toàn bộ nội đô.', 'nui-bugaksan'],
        ],
      },
      {
        slug: 'jeju', name: 'Jeju', coord: [126.531, 33.499],
        blurb: 'Núi lửa Hallasan, bờ đá đen và những nữ thợ lặn haenyeo.',
        places: [
          ['Đá Oedolgae', 'Bờ biển · Seogwipo', [126.5456, 33.2399], 'Cột đá núi lửa đứng giữa biển ở Seogwipo, nằm trên tuyến Olle số 7.'],
          ['Làng Hado', 'Làng chài haenyeo · Gujwa', [126.8634, 33.5236], 'Làng chài phía đông bắc đảo, nơi có bảo tàng về nghề lặn của các haenyeo.'],
          ['Aewol', 'Bờ biển đá · Tây bắc', [126.3752, 33.4508], 'Đoạn bờ biển đá bazan phía tây bắc Jeju, nhiều nhà và quán nhìn thẳng ra biển.'],
          ['Núi Hallasan', 'Núi lửa · Giữa đảo', [126.5292, 33.3618], 'Núi lửa cao nhất Hàn Quốc, nằm giữa đảo Jeju.'],
        ],
        exp: [
          ['Olle Trail số 7', 'TRAIL', '6 giờ', 1300000, 4.8, 'Mười bảy cây số men bờ biển phía nam, kết thúc ở làng chài Seogwipo.', 'da-oedolgae'],
          ['Bữa của các haenyeo', 'TABLE', '2 giờ', 1600000, 4.7, 'Bào ngư và nhím biển do chính các bà thợ lặn ngoài bảy mươi mang lên.', 'lang-hado'],
          ['Nhà đá đen ven biển', 'STAY', '2 đêm', 6400000, 4.6, 'Bê tông thô và đá bazan, bồn tắm quay thẳng ra Thái Bình Dương.', 'aewol'],
        ],
      },
      {
        slug: 'busan', name: 'Busan', coord: [129.075, 35.180],
        blurb: 'Cảng lớn nhất nước, chợ cá Jagalchi và làng Gamcheon.',
        places: [
          ['Chợ cá Jagalchi', 'Chợ hải sản · Nampo', [129.0307, 35.0966], 'Chợ hải sản lớn bên cảng Nampo, tầng trên có quán nướng cá tươi mua ngay dưới chợ.'],
          ['Làng văn hoá Gamcheon', 'Làng trên dốc · Saha', [129.0088, 35.0963], 'Làng bám sườn núi với những ngôi nhà sơn nhiều màu, nhìn xuống cảng Busan.'],
          ['Bãi Haeundae', 'Bãi biển · Haeundae', [129.1581, 35.1578], 'Bãi biển nổi tiếng nhất Busan, hai bên là khách sạn và nhà cao tầng.'],
        ],
        exp: [
          ['Chợ cá Jagalchi rạng sáng', 'PASSAGE', '3 giờ', 780000, 4.5, 'Phiên đấu giá năm giờ sáng, rồi ăn cá nướng ở tầng hai ngay trên chợ.', 'cho-ca-jagalchi'],
          ['Gamcheon và Huinnyeoul', 'PASSAGE', '4 giờ', 920000, 4.4, 'Hai làng bám vách núi, sơn đủ màu, nhìn thẳng ra mặt biển.', 'lang-van-hoa-gamcheon'],
          ['Phòng góc Haeundae', 'STAY', '2 đêm', 5900000, 4.6, 'Phòng góc trên bãi Haeundae, cà phê sáng lúc thuỷ triều xuống.', 'bai-haeundae'],
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
        places: [
          ['Làng Zermatt', 'Làng không xe hơi', [7.7469, 46.0214], 'Làng núi chỉ cho xe điện nhỏ lưu thông, nhà gỗ thông đen dọc phố chính Bahnhofstrasse.'],
          ['Gornergrat', 'Đỉnh núi · 3.089 m', [7.7846, 45.9833], 'Sống núi có tàu răng cưa chạy lên từ Zermatt, nhìn thẳng ra Matterhorn và sông băng Gorner.'],
          ['Hồ Stellisee', 'Hồ núi · Blauherd', [7.8004, 46.0134], 'Hồ trên cung 5-Seenweg từ Blauherd, mặt nước soi bóng Matterhorn vào những sáng lặng gió.'],
        ],
        exp: [
          ['Gornergrat lúc mặt trời mọc', 'PASSAGE', '4 giờ', 4200000, 4.9, 'Chuyến tàu răng cưa đầu tiên trong ngày, lên 3.089 m trước khi trời sáng.', 'gornergrat'],
          ['Năm hồ Matterhorn', 'TRAIL', '6 giờ', 3600000, 4.8, 'Cung 5-Seenweg đi từ Blauherd, ngọn núi soi bóng trên từng mặt hồ.', 'ho-stellisee'],
          ['Chalet gỗ hai trăm năm', 'STAY', '2 đêm', 22500000, 4.7, 'Gỗ thông đen, lò sưởi đá, ban công nhìn thẳng Matterhorn.', 'lang-zermatt'],
        ],
      },
      {
        slug: 'lucerne', name: 'Lucerne', coord: [8.309, 47.050],
        blurb: 'Cầu gỗ Kapellbrücke và một cái hồ hình ngón tay.',
        places: [
          ['Bến tàu Lucerne', 'Bến tàu · Bahnhofquai', [8.3101, 47.0513], 'Bến tàu ngay trước ga Lucerne, nơi các tàu hơi nước bánh guồng rời bến đi khắp hồ.'],
          ['Phố cổ Lucerne', 'Phố cổ · Altstadt', [8.3059, 47.0521], 'Khu phố cổ bên bờ sông Reuss, nhà vẽ tranh tường quanh những quảng trường nhỏ như Kornmarkt.'],
          ['Bờ hồ Schweizerhofquai', 'Bờ hồ · Altstadt', [8.3123, 47.0546], 'Dải bờ hồ với các khách sạn thời Belle Époque, nhìn sang núi Pilatus và Rigi.'],
          ['Cầu Kapellbrücke', 'Cầu gỗ · Sông Reuss', [8.3077, 47.0518], 'Cầu gỗ có mái che bắc qua sông Reuss, kèm tháp nước bát giác.'],
        ],
        exp: [
          ['Tàu hơi nước hồ Lucerne', 'PASSAGE', '3 giờ', 2100000, 4.6, 'Tàu bánh guồng từ 1928, dừng ở những làng không có đường bộ dẫn tới.', 'ben-tau-lucerne'],
          ['Xưởng đồng hồ cơ', 'STUDIO', '4 giờ', 8900000, 4.8, 'Tự lắp một bộ máy cơ dưới kính lúp, rồi mang chiếc đồng hồ đó về.', 'pho-co-lucerne'],
          ['Khách sạn bên hồ', 'STAY', '2 đêm', 16800000, 4.6, 'Toà Belle Époque, ban công gỗ, sáng ra nhìn thẳng núi Pilatus.', 'bo-ho-schweizerhofquai'],
        ],
      },
      {
        slug: 'interlaken', name: 'Interlaken', coord: [7.866, 46.686],
        blurb: 'Hai hồ, một thung lũng, và cửa ngõ lên Jungfrau.',
        places: [
          ['Beatenberg', 'Làng sườn núi · Hồ Thun', [7.7833, 46.6933], 'Làng trải dài trên sườn núi phía trên hồ Thun, điểm cất cánh dù lượn quen thuộc của Interlaken.'],
          ['Thác Staubbach', 'Thác nước · Lauterbrunnen', [7.9054, 46.5898], 'Thác nước đổ thẳng xuống làng Lauterbrunnen, trong thung lũng có hàng chục thác nước.'],
          ['Đỉnh Jungfraujoch', 'Yên ngựa núi · 3.454 m', [7.979, 46.5476], 'Yên ngựa giữa hai đỉnh Jungfrau và Mönch, nơi có ga tàu cao nhất châu Âu.'],
        ],
        exp: [
          ['Jungfraujoch', 'PASSAGE', '8 giờ', 6800000, 4.7, 'Ga tàu cao nhất châu Âu ở 3.454 m, đường hầm khoan xuyên trong lòng Eiger.', 'dinh-jungfraujoch'],
          ['Dù lượn Beatenberg', 'PASSAGE', '2 giờ', 3400000, 4.9, 'Bay đôi hai mươi phút trên hai hồ xanh ngọc, hạ cánh giữa lòng Interlaken.', 'beatenberg'],
          ['Nhà gỗ Lauterbrunnen', 'STAY', '2 đêm', 13900000, 4.7, 'Thung lũng bảy mươi hai thác nước, cửa sổ mở đúng hướng thác Staubbach.', 'thac-staubbach'],
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
        places: [
          ['Medina Marrakech', 'Phố cổ có tường bao', [-7.9889, 31.6258], 'Khu phố cổ có tường thành bao quanh, trung tâm là quảng trường Jemaa el-Fnaa nhộn nhịp từ chiều tới khuya.'],
          ['Khu souk', 'Chợ · Bắc Jemaa el-Fnaa', [-7.9881, 31.6279], 'Mê cung chợ phía bắc quảng trường, mỗi dãy một nghề: nhuộm vải, đồ da, kim loại, gia vị.'],
        ],
        exp: [
          ['Riad trong medina', 'STAY', '2 đêm', 6900000, 4.8, 'Năm sân trong nối nhau, tường hồng đất, mái nhà hứng trọn tiếng gọi cầu nguyện.', 'medina-marrakech'],
          ['Đi souk cùng người bản địa', 'PASSAGE', '4 giờ', 980000, 4.6, 'Từ ngõ nhuộm vải tới xưởng thuộc da, với người tuần nào cũng mua ở đây.', 'khu-souk'],
          ['Tagine trên than', 'TABLE', '5 giờ', 1250000, 4.7, 'Đi chợ lúc sáng sớm rồi nấu cừu với chanh muối trên sân thượng nhà dar.', 'medina-marrakech'],
        ],
      },
      {
        slug: 'fez', name: 'Fez', coord: [-5.000, 34.033],
        blurb: 'Medina cổ nhất thế giới, vẫn cắt và nung bằng tay.',
        places: [
          ['Fes el-Bali', 'Medina · Cổng Bab Bou Jeloud', [-4.984, 34.0617], 'Medina cổ có tường bao, không có xe hơi, với hàng nghìn ngõ nhỏ; cổng Bab Bou Jeloud lát gạch xanh là lối vào chính.'],
          ['Ain Nokbi', 'Làng gốm · Đông medina', [-4.9527, 34.0618], 'Khu xưởng gốm và gạch zellige phía đông medina, nơi đất sét được nhào, nung và đục bằng tay.'],
        ],
        exp: [
          ['Xưởng gạch zellige', 'STUDIO', '4 giờ', 1150000, 4.8, 'Tự đục một ngôi sao tám cánh bên cạnh các nghệ nhân khu Ain Nokbi.', 'ain-nokbi'],
          ['Fes el-Bali lúc rạng sáng', 'PASSAGE', '3 giờ', 850000, 4.5, 'Chín nghìn con ngõ; đi sáu con ngõ đáng đi trước khi đàn la ra đường.', 'fes-el-bali'],
          ['Nhà thương gia sáu trăm năm', 'STAY', '2 đêm', 4700000, 4.7, 'Do hai kiến trúc sư phục dựng và vẫn đang sống ở tầng trên.', 'fes-el-bali'],
        ],
      },
      {
        slug: 'chefchaouen', name: 'Chefchaouen', coord: [-5.269, 35.171],
        blurb: 'Một thị trấn xanh gấp trong dãy Rif.',
        places: [
          ['Medina Chefchaouen', 'Phố cổ xanh', [-5.2618, 35.1686], 'Phố cổ sơn xanh trên sườn dãy Rif, quanh quảng trường Outa el-Hammam và thành Kasbah.'],
          ['Nhà thờ Tây Ban Nha', 'Đồi ngắm cảnh · Đông thị trấn', [-5.2556, 35.1655], 'Nhà thờ nhỏ trên đồi phía đông do người Tây Ban Nha xây, nhìn xuống toàn bộ thị trấn xanh.'],
        ],
        exp: [
          ['Đường mòn dãy Rif', 'TRAIL', '6 giờ', 1050000, 4.6, 'Lên Nhà thờ Tây Ban Nha rồi sang các hồ Akchour, phô mai dê ăn ở đỉnh.', 'nha-tho-tay-ban-nha'],
          ['Ngõ xanh lúc mở cửa', 'PASSAGE', '2 giờ', 620000, 4.4, 'Đi medina trước khi xe khách tới, lúc màu xanh vẫn còn lạnh.', 'medina-chefchaouen'],
          ['Xưởng dệt len', 'STUDIO', '3 giờ', 890000, 4.5, 'Len nhuộm ngay giữa sân, trên khung cửi già hơn lớp sơn của thị trấn.', 'medina-chefchaouen'],
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
        places: [
          ['The Rocks', 'Phố cổ · Bên cảng', [151.2083, -33.86], 'Khu phố lâu đời nhất Sydney với kho hàng đá sa thạch, ngay chân cầu cảng.'],
          ['Cầu cảng Sydney', 'Cầu vòm thép', [151.2108, -33.8521], 'Cầu vòm thép bắc qua cảng Sydney từ năm 1932, có tuyến leo lên tới đỉnh vòm.'],
          ['Bãi Bondi', 'Bãi biển · Phía đông', [151.2724, -33.8907], 'Bãi biển nổi tiếng nhất Sydney, điểm đầu của đường đi bộ ven vách đá tới Coogee.'],
        ],
        exp: [
          ['Bondi đến Coogee', 'TRAIL', '3 giờ', 900000, 4.6, 'Sáu cây số đường ven vách đá, qua sáu bãi tắm và một hồ bơi nước mặn.', 'bai-bondi'],
          ['Leo cầu Harbour lúc chạng vạng', 'PASSAGE', '4 giờ', 6200000, 4.8, 'Lên đỉnh vòm thép 134 m đúng lúc đèn cả thành phố bật lên.', 'cau-cang-sydney'],
          ['Khách sạn khu The Rocks', 'STAY', '2 đêm', 9600000, 4.6, 'Kho hàng đá sa thạch từ 1850, đi bộ năm phút tới Nhà hát Con Sò.', 'the-rocks'],
        ],
      },
      {
        slug: 'tasmania', name: 'Tasmania', coord: [147.325, -42.882],
        blurb: 'Đảo tận cùng, rừng nguyên sinh và một bảo tàng đào trong lòng đá.',
        places: [
          ['Berriedale', 'Bờ sông Derwent · Hobart', [147.2612, -42.8127], 'Bán đảo nhỏ trên sông Derwent ở phía bắc Hobart, nơi đặt bảo tàng MONA với phòng trưng bày khoét sâu vào đá.'],
          ['Cape Hauy', 'Mũi đất · Bán đảo Tasman', [148.0051, -43.1389], 'Mũi đất trong vườn quốc gia Tasman, kết thúc ở các cột đá dolerite dựng đứng trên biển.'],
          ['Thung lũng Huon', 'Vùng nông trại · Huonville', [147.0495, -43.0302], 'Thung lũng sông Huon phía nam Hobart, vùng trồng táo, nho và nuôi hàu.'],
        ],
        exp: [
          ['Bảo tàng MONA', 'PASSAGE', '4 giờ', 1400000, 4.8, 'Phà riêng ngược sông Derwent tới phòng trưng bày khoét sâu ba tầng dưới đá.', 'berriedale'],
          ['Mũi Cape Hauy', 'TRAIL', '5 giờ', 1250000, 4.7, 'Đường mòn ra những cột đá dolerite dựng đứng cao nhất Nam bán cầu.', 'cape-hauy'],
          ['Bàn ăn nông trại Huon', 'TABLE', '4 giờ', 2300000, 4.6, 'Hàu đảo Bruny, táo Huon và vang lạnh, ăn ngay giữa vườn.', 'thung-lung-huon'],
        ],
      },
      {
        slug: 'cairns', name: 'Cairns', coord: [145.770, -16.923],
        blurb: 'Cửa ngõ rạn Great Barrier và rừng mưa Daintree.',
        places: [
          ['Rạn Agincourt', 'Rạn san hô ngoài khơi', [145.8086, -16.0057], 'Dải rạn ngoài khơi thuộc Great Barrier Reef, phía bắc Port Douglas.'],
          ['Hẻm Mossman', 'Rừng mưa · Daintree', [145.3594, -16.4666], 'Hẻm suối ở phía nam rừng mưa Daintree, vùng đất truyền thống của người Kuku Yalanji.'],
          ['Cape Tribulation', 'Rừng mưa giáp biển', [145.4622, -16.0888], 'Nơi rừng mưa Daintree chạm tới bờ biển, ở cuối con đường ven biển phía bắc Cairns.'],
        ],
        exp: [
          ['Lặn rạn Great Barrier', 'PASSAGE', '1 ngày', 4800000, 4.9, 'Hai điểm lặn ngoài khơi Agincourt, có kèm riêng cho người lặn lần đầu.', 'ran-agincourt'],
          ['Daintree cùng người Kuku Yalanji', 'TRAIL', '5 giờ', 2100000, 4.8, 'Rừng mưa một trăm tám mươi triệu năm, dẫn bởi chủ nhân truyền đời của nó.', 'hem-mossman'],
          ['Lodge giữa rừng mưa', 'STAY', '2 đêm', 8400000, 4.6, 'Nhà sàn trong tán cây ở Cape Tribulation, đêm nghe ếch và dơi quạ.', 'cape-tribulation'],
        ],
      },
    ],
  },
];

/**
 * Dựng cây Country → City → Place → Experience đầy đủ (tham chiếu ngược, giá thấp
 * nhất, slug) từ RAW. Ném lỗi ngay lúc build nếu dữ liệu tự mâu thuẫn — slug trải
 * nghiệm trùng (URL /trai-nghiem/<slug> là phẳng), địa điểm không tồn tại, hoặc
 * slug địa điểm trùng slug trải nghiệm cùng thành phố (route cũ phải redirect được).
 */
export function buildCatalog(): Country[] {
  const expSlugs = new Set<string>();

  return RAW.map((rc, ci) => {
    const country = {
      key: `c${ci}`,
      slug: rc.slug,
      id: rc.id,
      name: rc.name,
      native: rc.native,
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
        places: [] as Place[],
        experiences: [] as Experience[],
        country,
      } as City;

      city.places = rt.places.map(([name, kind, coord, blurb], pi) => ({
        key: `${city.key}p${pi}`,
        slug: slugify(name),
        name,
        kind,
        coord,
        blurb,
        experiences: [],
        city,
        country,
      }));

      city.experiences = rt.exp.map(([title, cat, duration, price, rating, blurb, placeSlug], ei) => {
        const place = city.places.find((p) => p.slug === placeSlug);
        if (!place) throw new Error(`seed: "${title}" trỏ tới địa điểm không có: ${city.slug}/${placeSlug}`);
        const slug = slugify(title);
        if (expSlugs.has(slug)) throw new Error(`seed: slug trải nghiệm bị trùng: ${slug}`);
        if (city.places.some((p) => p.slug === slug)) {
          throw new Error(`seed: slug trải nghiệm trùng slug địa điểm ở ${city.slug}: ${slug}`);
        }
        expSlugs.add(slug);
        const experience: Experience = {
          key: `${city.key}e${ei}`,
          slug,
          title,
          cat,
          duration,
          price,
          rating,
          // Số lượt đánh giá suy ra từ giá — cố định giữa server và client, không random.
          reviews: 48 + ((price / 10000) * 13) % 260 | 0,
          blurb,
          place,
          city,
          country,
        };
        place.experiences.push(experience);
        return experience;
      });

      city.from = Math.min(...city.experiences.map((e) => e.price));
      return city;
    });

    country.from = Math.min(...country.cities.map((c) => c.from));
    return country;
  });
}

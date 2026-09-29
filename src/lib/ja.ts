/**
 * Bản tiếng Nhật của trang Nhật Bản, phục vụ tại `/nhat-ban-ja` — song song với
 * `/nhat-ban` (tiếng Việt), cùng một quốc gia nên quả cầu bay tới cùng một cảnh.
 *
 * Đây chỉ là bản dịch cho đúng một trang, chưa phải i18n: các cấp sâu hơn (thành
 * phố, trải nghiệm) vẫn trỏ về route tiếng Việt. Dữ liệu gốc (giá, toạ độ, slug)
 * vẫn đọc từ catalog; file này chỉ giữ chữ.
 */

import type { Level } from './geo';

export type Lang = 'vi' | 'ja';

/** Segment URL của bản tiếng Nhật -> slug quốc gia gốc trong catalog. */
export const JA_ALIASES: Record<string, string> = {
  'nhat-ban-us': 'nhat-ban',
};

export const JA_PATH = '/nhat-ban-ja';

export interface JaCountry {
  name: string;
  season: string;
  flight: string;
  visa: string;
  currency: string;
  blurb: string;
  cities: Record<string, { name: string; blurb: string }>;
}

export const JA_COUNTRY: Record<string, JaCountry> = {
  'nhat-ban': {
    name: '日本',
    season: '3〜4月、10〜11月',
    flight: 'HAN · SGN — 直行便 5時間20分',
    visa: 'ビザ必要 · 書類作成サポートあり',
    currency: 'JPY（日本円）',
    blurb:
      '分刻みで正確に走る列車と、たった八席のカウンター。どの季節にも訪れる理由がある——桜、紅葉、そして北海道のパウダースノー。',
    cities: {
      kyoto: { name: '京都', blurb: '千の寺院と、紅葉の季節の哲学の道。' },
      hokkaido: { name: '北海道', blurb: 'パウダースノー、朝六時の海鮮市場、そして富良野の畑。' },
      tokyo: { name: '東京', blurb: '三千七百万人の街と、八席だけの小さな店。' },
    },
  },
};

export const JA_UI = {
  world: '世界',
  itinerary: '旅程',
  index: '目次',
  bestSeason: 'ベストシーズン',
  flight: 'フライト',
  visa: 'ビザ',
  currency: '通貨',
  cities: (n: number) => `${n}都市`,
  experiences: (n: number) => `${n}件の体験`,
  priceFrom: '最低価格',
  crumbLabel: '現在地',
  globeLabel: '目的地の地球儀',
  panelLabel: '予約パネル',
  expandPanel: '予約パネルを開く',
  collapsePanel: '予約パネルを閉じる',
  lat: '緯度',
  lon: '経度',
  scale: '縮尺',
  level: 'レベル',
  from: (price: string) => `${price}〜`,
};

export const JA_LEVEL_LABEL: Record<Level, string> = {
  world: '00 / 軌道',
  country: '01 / 国',
  city: '02 / 都市',
  experience: '03 / 体験',
};

export const JA_THEME_LABEL = {
  system: 'システム',
  light: 'ライト',
  dark: 'ダーク',
  blue: 'ブルー',
} as const;

export const JA_THEME_SHORT = { system: 'シ', light: 'ラ', dark: 'ダ', blue: '青' } as const;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UrlMatchCase from '@/components/UrlMatchCase';
import { findCase, HOSTS } from '@/lib/url-match';

/**
 * Ba biến thể: `a` và `b` là hai giá trị có trong danh sách `notsame`, `c` không nằm
 * trong danh sách. Chỉ khi mở cả ba mới thấy được lệch là do AND-vs-OR chứ không phải
 * do setting nhập sai.
 */
const VARIANTS = ['a', 'b', 'c'] as const;
type Variant = (typeof VARIANTS)[number];

interface Props {
  params: Promise<{ variant: string }>;
}

export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variant } = await params;
  const c = findCase('06-notsame');
  return { title: `Ca ${c.n} — ${c.point} (${variant})`, robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { variant } = await params;
  if (!VARIANTS.includes(variant as Variant)) notFound();

  const base = findCase('06-notsame');
  const inList = variant !== 'c';

  const c = {
    ...base,
    path: `/url-match/06-notsame/${variant}`,
    openUrl: `https://${HOSTS.base}/url-match/06-notsame/${variant}`,
    expectHeatmap: !inList,
    expectPopup: true,
    symptom: inList
      ? base.symptom
      : 'Không nằm trong danh sách loại trừ — cả hai side đều phải cho qua. Đây là đối chứng.',
  };

  return <UrlMatchCase c={c} />;
}

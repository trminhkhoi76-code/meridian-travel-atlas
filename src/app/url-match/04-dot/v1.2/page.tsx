import type { Metadata } from 'next';
import UrlMatchCase from '@/components/UrlMatchCase';
import { findCase } from '@/lib/url-match';

const c = findCase('04-dot');

export const metadata: Metadata = {
  title: `Ca ${c.n} — ${c.point}`,
  robots: { index: false },
};

export default function Page() {
  return <UrlMatchCase c={c} />;
}

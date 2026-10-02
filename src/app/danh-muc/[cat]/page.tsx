import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CAT_BLURB, CAT_LABEL, CAT_ORDER, CAT_SLUG, allExperiences, catFromSlug, hrefOf } from '@/lib/catalog';
import { getCountries } from '@/lib/catalog-service';
import CategoryResults from '@/components/CategoryResults';
import Crumbs from '@/components/Crumbs';
import { CatIcon } from '@/components/Icons';

interface Props {
  params: Promise<{ cat: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CAT_ORDER.map((c) => ({ cat: CAT_SLUG[c] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = catFromSlug((await params).cat);
  if (!cat) return {};
  return { title: CAT_LABEL[cat], description: CAT_BLURB[cat], alternates: { canonical: hrefOf.category(cat) } };
}

export default async function CategoryPage({ params }: Props) {
  const cat = catFromSlug((await params).cat);
  if (!cat) notFound();
  const experiences = allExperiences(await getCountries());

  return (
    <main className="container page">
      <Crumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Danh mục' }, { label: CAT_LABEL[cat] }]} />
      <nav className="catnav" aria-label="Danh mục">
        {CAT_ORDER.map((c) => (
          <Link key={c} href={hrefOf.category(c)} className={c === cat ? undefined : 'lift'} aria-current={c === cat ? 'page' : undefined}>
            <CatIcon cat={c} />
            <span>
              <b>{CAT_LABEL[c]}</b>
              <small>{experiences.filter((e) => e.cat === c).length}</small>
            </span>
          </Link>
        ))}
      </nav>
      <header className="cat-head">
        <div>
          <h1 className="title-m enter">{CAT_LABEL[cat]}</h1>
          <p className="lede">{CAT_BLURB[cat]}</p>
        </div>
      </header>
      <CategoryResults cat={cat} />
    </main>
  );
}

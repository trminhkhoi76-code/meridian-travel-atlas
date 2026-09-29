import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { JA_COUNTRY, JA_UI } from '@/lib/ja';
import type { RouteState } from '@/lib/route';

/** Đường dẫn phân cấp: mỗi mảnh là một cấp zoom, bấm vào là trồi lên cấp đó. */
export default function Crumb({ route }: { route: RouteState }) {
  const nodes: React.ReactNode[] = [];
  const atWorld = route.level === 'world' && !route.isItinerary;
  const ja = route.lang === 'ja';
  const worldLabel = ja ? JA_UI.world : 'Thế giới';

  nodes.push(
    atWorld ? (
      <span className="cur" key="w">
        {worldLabel}
      </span>
    ) : (
      <Link href={hrefOf.world()} key="w">
        {worldLabel}
      </Link>
    ),
  );

  if (route.country) {
    const current = route.level === 'country' && !route.isItinerary;
    nodes.push(
      current ? (
        <span className="cur" key="c">
          {(ja && JA_COUNTRY[route.country.slug]?.name) || route.country.name}
        </span>
      ) : (
        <Link href={hrefOf.country(route.country)} key="c">
          {route.country.name}
        </Link>
      ),
    );
  }

  if (route.city) {
    const current = route.level === 'city' && !route.isItinerary;
    nodes.push(
      current ? (
        <span className="cur" key="t">
          {route.city.name}
        </span>
      ) : (
        <Link href={hrefOf.city(route.city)} key="t">
          {route.city.name}
        </Link>
      ),
    );
  }

  if (route.experience) {
    nodes.push(
      <span className="cur" key="e">
        {route.experience.title}
      </span>,
    );
  }

  if (route.isItinerary) {
    nodes.push(
      <span className="cur" key="i">
        Hành trình
      </span>,
    );
  }

  return (
    <nav className="crumb" aria-label={ja ? JA_UI.crumbLabel : 'Vị trí'}>
      {nodes.flatMap((node, i) =>
        i === 0
          ? [node]
          : [
              <span className="sep" key={`s${i}`} aria-hidden="true">
                /
              </span>,
              node,
            ],
      )}
    </nav>
  );
}

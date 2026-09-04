import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import type { RouteState } from '@/lib/route';

/** Đường dẫn phân cấp: mỗi mảnh là một cấp zoom, bấm vào là trồi lên cấp đó. */
export default function Crumb({ route }: { route: RouteState }) {
  const nodes: React.ReactNode[] = [];
  const atWorld = route.level === 'world' && !route.isItinerary;

  nodes.push(
    atWorld ? (
      <span className="cur" key="w">
        Thế giới
      </span>
    ) : (
      <Link href={hrefOf.world()} key="w">
        Thế giới
      </Link>
    ),
  );

  if (route.country) {
    const current = route.level === 'country' && !route.isItinerary;
    nodes.push(
      current ? (
        <span className="cur" key="c">
          {route.country.name}
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
    <nav className="crumb" aria-label="Vị trí">
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

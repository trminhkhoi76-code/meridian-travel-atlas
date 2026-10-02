import Link from 'next/link';
import type { Country } from '@/lib/catalog';
import { allPlaces, hrefOf } from '@/lib/catalog';
import { vndShort } from '@/lib/format';
import { GALLERY } from '@/lib/gallery';
import type { MapRegion } from '@/lib/map';
import { project, projectPct } from '@/lib/map';
import { CityCard } from './cards';
import Crumbs from './Crumbs';
import ExperienceFilter from './ExperienceFilter';
import { IconPlus, IconUpload } from './Icons';
import MapView from './MapView';
import Photo from './Photo';
import SampleTripButton from './SampleTripButton';
import SectionTabs from './SectionTabs';
import { UploadButton } from './UploadDialog';

/** Cấp 1 · Quốc gia. */
export default function CountryView({ country, map }: { country: Country; map: MapRegion }) {
  const experiences = country.cities.flatMap((c) => c.experiences);
  const placeKeys = new Set(allPlaces([country]).map((p) => p.key));
  const placeByKey = new Map(allPlaces([country]).map((p) => [p.key, p]));
  const photos = GALLERY.filter((g) => placeKeys.has(g.place)).slice(0, 5);
  const route = country.cities.map((c) => c.name).join(', ');

  return (
    <main className="container page">
      <div className="progress" aria-hidden="true" />
      <Crumbs items={[{ label: 'Trang chủ', href: '/' }, { label: country.name }]} />

      <section className="country-hero">
        <div className="text">
          <span className="tag enter">
            Quốc gia · {country.cities.length} thành phố · {experiences.length} trải nghiệm
          </span>
          <h1 className="title-xl enter d1">{country.name}</h1>
          <p className="sub enter d1">{country.native}</p>
          <p className="lede enter d2">{country.blurb}</p>
          <div className="actions enter d3">
            <SampleTripButton countryKey={country.key} className="btn-p press">
              <IconPlus size={18} />
              Lên hành trình mẫu
            </SampleTripButton>
            <a href="#cities" className="btn-s press">
              Xem {country.cities.length} thành phố
            </a>
          </div>
          <dl className="facts two enter d4">
            <div>
              <dt>Mùa đẹp</dt>
              <dd>{country.season}</dd>
            </div>
            <div>
              <dt>Di chuyển</dt>
              <dd>{country.flight}</dd>
            </div>
            <div>
              <dt>Visa</dt>
              <dd>{country.visa}</dd>
            </div>
            <div>
              <dt>Tiền tệ</dt>
              <dd>{country.currency}</dd>
            </div>
          </dl>
        </div>
        <MapView region={map} label={`Bản đồ ${country.name}`} className="enter d2" note="Bản đồ minh hoạ · ghim theo toạ độ thật">
          {country.cities.map((city, i) => {
            const pos = projectPct(map, city.coord);
            const left = project(map, city.coord)[0] > map.size * 0.62;
            return (
              <span key={city.key}>
                <Link href={hrefOf.city(city)} className="pin" style={pos} aria-label={`${city.name}, từ ${vndShort(city.from)}`} />
                <span className={'pin-label' + (left ? ' left' : '')} style={{ ...pos, animationDelay: `${500 + i * 120}ms` }} aria-hidden="true">
                  {city.name} · từ {vndShort(city.from)}
                </span>
              </span>
            );
          })}
        </MapView>
      </section>

      <SectionTabs
        tabs={[
          { id: 'cities', label: `Thành phố (${country.cities.length})` },
          { id: 'exps', label: `Trải nghiệm (${experiences.length})` },
          { id: 'photos', label: 'Ảnh cộng đồng' },
          { id: 'tips', label: 'Gợi ý hành trình' },
        ]}
      />

      <section id="cities" aria-labelledby="h-cities" className="sec sec-tight">
        <h2 id="h-cities" className="h2 reveal">
          Thành phố
        </h2>
        <div className="grid g3">
          {country.cities.map((city) => (
            <CityCard key={city.key} city={city} />
          ))}
        </div>
      </section>

      <section id="exps" aria-labelledby="h-exps" className="sec">
        <ExperienceFilter keys={experiences.map((e) => e.key)} heading={`Trải nghiệm ở ${country.name}`} headingId="h-exps" />
      </section>

      <section id="photos" aria-labelledby="h-photos" className="sec">
        <div className="sec-head reveal">
          <h2 id="h-photos">Ảnh cộng đồng ở {country.name}</h2>
          <Link href={hrefOf.gallery()}>Xem thư viện</Link>
        </div>
        <div className="ugc-row">
          {photos.map((g) => {
            const p = placeByKey.get(g.place)!;
            return (
              <Link key={g.id} href={hrefOf.place(p)} className="reveal" style={{ borderRadius: 14 }}>
                <Photo label={p.name} seed={p.key + g.id} caption={false}>
                  <span className="ph-cap">{p.name}</span>
                </Photo>
              </Link>
            );
          })}
          <UploadButton className="add-photo reveal">
            <IconUpload size={24} />
            Đăng ảnh
          </UploadButton>
        </div>
      </section>

      <section id="tips" aria-labelledby="h-trip" className="sec">
        <div className="tipcard reveal">
          <div>
            <span className="eyebrow">Gợi ý hành trình</span>
            <h2 id="h-trip" className="h3">
              {route}
            </h2>
            <span className="muted">
              Đi qua {country.cities.length} thành phố, mỗi nơi một trải nghiệm được đánh giá cao nhất. Mở sẵn trong trình
              lập hành trình để bạn chỉnh tiếp.
            </span>
          </div>
          <SampleTripButton countryKey={country.key}>Mở hành trình mẫu</SampleTripButton>
        </div>
      </section>
    </main>
  );
}

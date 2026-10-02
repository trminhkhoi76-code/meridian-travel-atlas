import Link from 'next/link';
import type { Place } from '@/lib/catalog';
import { CAT_LABEL, distanceKm, hrefOf } from '@/lib/catalog';
import { coordShort, kmLabel, vnd } from '@/lib/format';
import { GALLERY, initials } from '@/lib/gallery';
import type { MapRegion } from '@/lib/map';
import { project, projectPct } from '@/lib/map';
import { ExperienceRow, Rating } from './cards';
import Crumbs from './Crumbs';
import { IconGrid, IconPin, IconUpload } from './Icons';
import MapView from './MapView';
import Photo from './Photo';
import SaveButton from './SaveButton';
import ShareButton from './ShareButton';
import { UploadButton } from './UploadDialog';

/** Cấp 3 · Địa điểm — có toạ độ thật, ảnh cộng đồng, trải nghiệm tại đây và gần đây. */
export default function PlaceView({ place, map }: { place: Place; map: MapRegion }) {
  const { city, country } = place;
  const near = city.experiences
    .filter((e) => e.place !== place)
    .map((e) => ({ e, km: distanceKm(place.coord, e.place.coord) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4);
  const photos = GALLERY.filter((g) => g.place === place.key).slice(0, 3);
  const captions = [...new Set([place.name, ...place.experiences.map((e) => e.title), place.kind.split(' · ')[0], city.name, country.name])];
  while (captions.length < 5) captions.push(`${place.name} ${captions.length + 1}`);
  const pin = projectPct(map, place.coord);
  const labelLeft = project(map, place.coord)[0] > map.size * 0.6;

  return (
    <main className="container page">
      <div className="progress" aria-hidden="true" />
      <Crumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: country.name, href: hrefOf.country(country) },
          { label: city.name, href: hrefOf.city(city) },
          { label: place.name },
        ]}
      />

      <div className="mosaic">
        {captions.slice(0, 5).map((c, i) => (
          <Photo key={c} label={c} seed={place.key + i} className="enter" style={{ animationDelay: `${i * 60}ms` }}>
            {i === 4 && (
              <Link href={hrefOf.gallery()} className="more press">
                <IconGrid size={16} />
                Xem tất cả ảnh
              </Link>
            )}
          </Photo>
        ))}
      </div>

      <div className="split" style={{ paddingTop: 32 }}>
        <div className="main-8">
          <header className="place-head">
            <div>
              <span className="tag">Địa điểm · {place.kind}</span>
              <h1 className="title-l">{place.name}</h1>
              <span className="where-line">
                <IconPin size={16} />
                {city.name}, {country.name}
              </span>
            </div>
            <div className="actions">
              <SaveButton itemKey={place.key} label={place.name} />
              <ShareButton title={`${place.name} — ${city.name}`} />
            </div>
          </header>

          <section aria-labelledby="h-about" className="block reveal">
            <h2 id="h-about" className="h3">
              Về địa điểm này
            </h2>
            <p>{place.blurb}</p>
            <dl className="facts">
              <div>
                <dt>Mùa đẹp ở {country.name}</dt>
                <dd>{country.season}</dd>
              </div>
              <div>
                <dt>Cách trung tâm {city.name}</dt>
                <dd>{kmLabel(distanceKm(place.coord, city.coord))}</dd>
              </div>
              <div>
                <dt>Toạ độ</dt>
                <dd>{coordShort(place.coord)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="h-here" className="block reveal">
            <h2 id="h-here" className="h3">
              Đặt trải nghiệm tại đây
            </h2>
            {place.experiences.length ? (
              place.experiences.map((e) => (
                <Link key={e.key} href={hrefOf.experience(e)} className="here lift">
                  <Photo label={e.title} seed={e.key} />
                  <div className="here-body">
                    <span className="eyebrow">
                      {CAT_LABEL[e.cat]} · {e.duration}
                    </span>
                    <b className="t">{e.title}</b>
                    <p>{e.blurb}</p>
                    <Rating e={e} />
                  </div>
                  <div className="here-side">
                    <b>{vnd(e.price)}</b>
                    <span>Xem lịch &amp; đặt</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="info">
                <span>
                  Chưa có trải nghiệm bán tại đây — đây là điểm tham quan tự do. Lưu vào hành trình để xếp ngày cùng các
                  trải nghiệm khác ở {city.name}.
                </span>
              </p>
            )}
          </section>

          {near.length > 0 && (
            <section aria-labelledby="h-near" className="block reveal">
              <h2 id="h-near" className="h3">
                Gần {place.name}
              </h2>
              <div className="grid g2">
                {near.map(({ e, km }) => (
                  <ExperienceRow
                    key={e.key}
                    e={e}
                    small
                    className=""
                    meta={`${CAT_LABEL[e.cat]} · ${e.place.name} · ${kmLabel(km).toLowerCase()}`}
                  />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="h-ugc" className="block reveal">
            <div className="sec-head">
              <h2 id="h-ugc" className="h3">
                Ảnh khách chia sẻ ở đây
              </h2>
              <Link href={hrefOf.gallery()}>Xem tất cả</Link>
            </div>
            <div className="ugc4">
              {photos.map((g, i) => (
                <figure key={g.id}>
                  <Photo label={`${place.name}, ảnh của ${g.author}`} seed={place.key + g.id} caption={false}>
                    <span className="sample-tag">Ảnh mẫu</span>
                  </Photo>
                  <figcaption>
                    <span className={'avatar' + (i % 2 ? ' alt' : '')}>{initials(g.author)}</span>
                    {g.author} · {g.when}
                  </figcaption>
                </figure>
              ))}
              <UploadButton place={place.key} className="add-photo">
                <IconUpload size={24} />
                Chia sẻ ảnh của bạn ở {place.name}
              </UploadButton>
            </div>
          </section>
        </div>

        <aside className="side-4" aria-label="Vị trí và hành trình">
          <div className="panel minimap">
            <MapView region={map} label={`${place.name} trên bản đồ ${city.name}`} note={null}>
              {city.places
                .filter((p) => p !== place)
                .map((p) => (
                  <Link key={p.key} href={hrefOf.place(p)} className="pin dim" style={projectPct(map, p.coord)} aria-label={p.name} title={p.name} />
                ))}
              <span className="pin-ring" style={pin} aria-hidden="true" />
              <span className="pin is-sel" style={pin} aria-hidden="true" />
              <span className={'pin-label hl' + (labelLeft ? ' left' : '')} style={pin} aria-hidden="true">
                {place.name}
              </span>
            </MapView>
            <div className="minimap-body">
              <span>
                {place.kind}, {city.name}. Chấm xám là các địa điểm khác ở {city.name}.
              </span>
              <Link href={hrefOf.city(city)} className="btn-s btn-sm press">
                Mở bản đồ {city.name}
              </Link>
            </div>
          </div>
          <div className="panel-dark">
            <b style={{ fontSize: 17, fontWeight: 600 }}>Ghé {place.name} trong chuyến đi?</b>
            <p>Thêm vào hành trình để xếp ngày, kể cả khi bạn chưa đặt trải nghiệm nào ở đây.</p>
            <SaveButton itemKey={place.key} label={place.name} variant="button" className="btn-w btn-block" />
          </div>
        </aside>
      </div>
    </main>
  );
}

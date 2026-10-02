import Link from 'next/link';
import { CAT_ORDER, allExperiences, allPlaces, byRating, findCity, findCountry, hrefOf } from '@/lib/catalog';
import { getCountries } from '@/lib/catalog-service';
import { GALLERY } from '@/lib/gallery';
import { CategoryCard, CountryCard, ExperienceCard } from '@/components/cards';
import Finder from '@/components/Finder';
import Photo from '@/components/Photo';
import { UploadButton } from '@/components/UploadDialog';

/** Gợi ý biên tập ("đang được tìm nhiều") — chưa có số liệu tìm kiếm thật. */
const POPULAR: Array<[string, string]> = [
  ['viet-nam', 'phu-quoc'],
  ['nhat-ban', 'kyoto'],
  ['han-quoc', 'jeju'],
  ['thuy-si', 'zermatt'],
];
/** Bốn ảnh ở hero: [quốc gia, thành phố, địa điểm]. */
const HERO: Array<[string, string, string]> = [
  ['viet-nam', 'ha-giang', 'deo-ma-pi-leng'],
  ['nhat-ban', 'kyoto', 'fushimi-inari'],
  ['han-quoc', 'jeju', 'aewol'],
  ['thuy-si', 'zermatt', 'gornergrat'],
];

export default async function HomePage() {
  const countries = await getCountries();
  const experiences = allExperiences(countries);
  const places = new Map(allPlaces(countries).map((p) => [p.key, p]));
  const cityCount = countries.reduce((n, c) => n + c.cities.length, 0);
  const top = [...experiences].sort(byRating).slice(0, 4);
  const city = (c: string, t: string) => findCity(findCountry(countries, c), t)!;
  const band = GALLERY.slice(0, 5).map((g) => ({ ...g, p: places.get(g.place)! }));
  const bandClass = ['tall', '', '', 'tall', 'wide'];

  return (
    <main>
      <section className="container hero">
        <div className="hero-text">
          <p className="eyebrow enter">
            {experiences.length} trải nghiệm · {cityCount} thành phố · {countries.length} quốc gia
          </p>
          <h1 className="enter d1">Tìm chuyến đi tiếp theo, đặt trọn trong một giỏ.</h1>
          <p className="lede enter d2">
            Duyệt theo quốc gia, thành phố hay loại trải nghiệm. Lưu những gì bạn thích vào hành trình, rồi gửi yêu cầu
            đặt cả chuyến một lần.
          </p>
          <Finder />
          <div className="popular enter d4">
            <span>Gợi ý:</span>
            {POPULAR.map(([c, t]) => {
              const x = city(c, t);
              return (
                <Link key={x.key} href={hrefOf.city(x)} className="press">
                  {x.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="hero-art drift" aria-hidden="true">
          {HERO.map(([c, t, p], i) => {
            const place = city(c, t).places.find((x) => x.slug === p)!;
            return (
              <Photo
                key={p}
                label={`${place.name}, ${place.city.name}`}
                seed={place.key}
                className="enter"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              />
            );
          })}
        </div>
      </section>

      <section className="container sec" aria-labelledby="h-cat">
        <div className="sec-head reveal">
          <h2 id="h-cat">Khám phá theo loại trải nghiệm</h2>
          <Link href={hrefOf.category('STAY')}>Xem tất cả danh mục</Link>
        </div>
        <div className="grid g5">
          {CAT_ORDER.map((cat) => (
            <CategoryCard key={cat} cat={cat} count={experiences.filter((e) => e.cat === cat).length} />
          ))}
        </div>
      </section>

      <section className="container sec" aria-labelledby="h-country">
        <div className="sec-head reveal">
          <h2 id="h-country">Chọn quốc gia</h2>
          <span className="note">Mỗi quốc gia có {countries[0].cities.length} thành phố</span>
        </div>
        <div className="grid g6">
          {countries.map((c) => (
            <CountryCard key={c.key} country={c} />
          ))}
        </div>
      </section>

      <section className="container sec" aria-labelledby="h-top">
        <div className="sec-head reveal">
          <h2 id="h-top">Được đánh giá cao nhất</h2>
          <Link href={hrefOf.search()}>Tìm thêm</Link>
        </div>
        <div className="grid g4">
          {top.map((e) => (
            <ExperienceCard key={e.key} e={e} />
          ))}
        </div>
      </section>

      <section className="container sec" aria-labelledby="h-gal">
        <div className="band reveal">
          <div className="band-text">
            <p className="eyebrow">Từ cộng đồng</p>
            <h2 id="h-gal">Ảnh của khách đã đi, gắn đúng địa điểm.</h2>
            <p>Mỗi ảnh dẫn tới địa điểm và trải nghiệm có thể đặt ngay tại đó.</p>
            <div className="actions">
              <Link href={hrefOf.gallery()} className="btn-w press">
                Vào thư viện ảnh
              </Link>
              <UploadButton className="btn-o press">Đăng ảnh của bạn</UploadButton>
            </div>
          </div>
          <div className="band-art">
            {band.map((g, i) => (
              <Link key={g.id} href={hrefOf.place(g.p)} className={bandClass[i] || undefined}>
                <Photo label={`${g.p.name} · ${g.p.city.name}`} seed={g.p.key + g.id} caption={false}>
                  <span className="ph-cap">
                    {g.p.name} · {g.p.city.name}
                  </span>
                </Photo>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container sec" aria-labelledby="h-how" style={{ paddingBottom: 72 }}>
        <h2 id="h-how" className="h2">
          Một chuyến đi, ba bước
        </h2>
        <ol className="grid g3 steps3">
          <li className="reveal">
            <span className="n">1</span>
            <b>Lưu địa điểm và trải nghiệm</b>
            <span>Bấm lưu ở bất kỳ cấp nào: thành phố, địa điểm hay từng trải nghiệm.</span>
          </li>
          <li className="reveal">
            <span className="n">2</span>
            <b>Xếp theo ngày trong hành trình</b>
            <span>Đổi thứ tự điểm dừng, chỉnh số ngày, xem tuyến đường trên bản đồ và tổng chi phí cập nhật ngay.</span>
          </li>
          <li className="reveal">
            <span className="n">3</span>
            <b>Gửi một yêu cầu đặt cả chuyến</b>
            <span>Giỏ hàng gom mọi trải nghiệm. Nhân viên xác nhận chỗ trước khi bạn thanh toán.</span>
          </li>
        </ol>
      </section>
    </main>
  );
}

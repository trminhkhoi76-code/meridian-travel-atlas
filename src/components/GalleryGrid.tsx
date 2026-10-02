'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { byRating, hrefOf } from '@/lib/catalog';
import { GALLERY, initials } from '@/lib/gallery';
import { useCatalog } from './CatalogProvider';
import { IconPin, IconUpload } from './Icons';
import Photo from './Photo';
import SaveButton from './SaveButton';
import { useUpload } from './UploadDialog';

/** Lưới so le (CSS columns) + chip lọc theo quốc gia. `#dang-anh` trên URL mở sẵn hộp thoại đăng ảnh. */
export default function GalleryGrid() {
  const { countries, places } = useCatalog();
  const { open } = useUpload();
  const [country, setCountry] = useState<string>('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.location.hash === '#dang-anh') open();
  }, [open]);

  const list = GALLERY.map((g) => ({ g, p: places.get(g.place)! })).filter(
    ({ p }) => p && (country === 'all' || p.country.key === country),
  );

  return (
    <>
      <header className="gal-head enter">
        <div>
          <h1 className="title-l">Thư viện ảnh</h1>
          <p className="lede">
            Ảnh của khách đã đi. Mỗi ảnh gắn với một địa điểm, bấm vào để xem và đặt trải nghiệm ở đó.
          </p>
        </div>
        <button type="button" className="btn-p press" onClick={() => open()}>
          <IconUpload size={18} />
          Đăng ảnh
        </button>
      </header>

      <div className="gal-bar">
        <div className="pills" role="group" aria-label="Lọc theo quốc gia">
          {[{ key: 'all', name: 'Tất cả' }, ...countries].map((c) => (
            <button
              key={c.key}
              type="button"
              className="pill press"
              aria-pressed={country === c.key}
              onClick={() => {
                setCountry(c.key);
                setTick((t) => t + 1);
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <span className="note">Ảnh mẫu — sẽ thay bằng ảnh khách gửi khi kho ảnh hoạt động.</span>
      </div>

      {list.length === 0 ? (
        <div className="empty">Chưa có ảnh ở quốc gia này. Bạn có thể là người đầu tiên đăng ảnh.</div>
      ) : (
        <div className="masonry" key={tick}>
          {list.map(({ g, p }, i) => {
            const book = [...p.experiences].sort(byRating)[0];
            return (
              <figure key={g.id} className="gx cardin" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="gx-img" style={{ ['--h' as string]: `${g.h}px` }}>
                  <Photo label={`${p.name}, ảnh của ${g.author}`} seed={p.key + g.id} caption={false} />
                  <span className="sample-tag">Ảnh mẫu</span>
                  <SaveButton itemKey={p.key} label={p.name} variant="float" />
                  {book && (
                    <Link href={hrefOf.experience(book)} className="gx-book hov press">
                      Đặt ở đây
                    </Link>
                  )}
                </div>
                <figcaption>
                  <Link href={hrefOf.place(p)}>
                    <IconPin size={15} />
                    {p.name}
                  </Link>
                  <span>
                    <span className="avatar">{initials(g.author)}</span>
                    {g.author} · {p.city.name} · {g.when}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </>
  );
}

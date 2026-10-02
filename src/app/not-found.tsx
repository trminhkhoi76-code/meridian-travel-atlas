import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { getCountries } from '@/lib/catalog-service';

export default async function NotFound() {
  const countries = await getCountries();
  return (
    <main className="container">
      <div className="narrow" style={{ textAlign: 'center', alignItems: 'center' }}>
        <p className="eyebrow">Không tìm thấy trang</p>
        <h1 className="title-m">Đường dẫn này không khớp điểm đến nào.</h1>
        <p className="lede">Có thể trang đã đổi chỗ. Thử một trong sáu quốc gia, hoặc tìm theo tên.</p>
        <div className="pills" style={{ justifyContent: 'center' }}>
          {countries.map((c) => (
            <Link key={c.key} href={hrefOf.country(c)} className="pill press">
              {c.name}
            </Link>
          ))}
        </div>
        <Link href={hrefOf.search()} className="btn-p press">
          Tìm điểm đến
        </Link>
      </div>
    </main>
  );
}

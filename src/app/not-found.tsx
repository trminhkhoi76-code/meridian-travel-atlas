import Link from 'next/link';
import { hrefOf } from '@/lib/catalog';
import { getCountries } from '@/lib/catalog-service';

export default async function NotFound() {
  const countries = await getCountries();
  return (
    <div className="pbody">
      <p className="mono">Ngoài bản đồ</p>
      <h1 className="ptitle sm">Không có điểm đến nào ở toạ độ này.</h1>
      <p className="pdesc">
        Đường dẫn không khớp với quốc gia, thành phố hay trải nghiệm nào trong danh mục mùa này.
      </p>
      <div className="sechead">
        <span className="mono">Thử một trong sáu điểm đến</span>
      </div>
      <div className="rows">
        {countries.map((country) => (
          <Link key={country.key} href={hrefOf.country(country)} className="row">
            <span className="txt">
              <b>{country.name}</b>
              <small>{country.season}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

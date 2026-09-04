import Link from 'next/link';
import { COUNTRIES, TOTAL_CITIES, TOTAL_EXPERIENCES, hrefOf } from '@/lib/catalog';
import { vnd } from '@/lib/format';

export default function WorldPanel() {
  return (
    <div className="pbody">
      <p className="mono">Điểm đến · mùa 2026</p>
      <h1 className="ptitle">Bạn muốn đi đâu.</h1>
      <p className="pdesc">
        Chọn một quốc gia ở đây, bấm ghim trên quả cầu, hoặc cuộn để rơi thẳng vào nơi đang hướng về
        bạn. {TOTAL_CITIES} thành phố và {TOTAL_EXPERIENCES} trải nghiệm, tất cả đặt được trực tiếp.
      </p>
      <div className="sechead">
        <span className="mono">Quốc gia</span>
        <span className="mono">Giá từ / khách</span>
      </div>
      <div className="rows">
        {COUNTRIES.map((country) => (
          <Link key={country.key} href={hrefOf.country(country)} className="row">
            <span className="txt">
              <b>{country.name}</b>
              <small>
                {country.native} · {country.season}
              </small>
            </span>
            <span className="pr">
              <b>{vnd(country.from)}</b>
              <small>{country.cities.length} thành phố</small>
            </span>
          </Link>
        ))}
      </div>

      <p className="note">
        Giá đã gồm hướng dẫn viên, vé vào cửa và di chuyển tại điểm. Chưa gồm vé máy bay quốc tế,
        bảo hiểm và phí thị thực.
      </p>
    </div>
  );
}

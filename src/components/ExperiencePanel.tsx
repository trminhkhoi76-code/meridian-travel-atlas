'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CAT_INCLUDES, CAT_LABEL, DEPARTURES, EXPERIENCE_BY_KEY, hrefOf } from '@/lib/catalog';
import { ratingLabel, vnd } from '@/lib/format';
import { swatch } from '@/lib/swatch';
import { useItinerary } from './ItineraryProvider';

/**
 * Ngày khởi hành và nút đặt nằm ở hai khối khác nhau của bảng (thân và chân),
 * nên cả hai phải cùng một component để dùng chung state ngày đã chọn.
 */
export default function ExperiencePanel({ experienceKey }: { experienceKey: string }) {
  const experience = EXPERIENCE_BY_KEY.get(experienceKey);
  const [departure, setDeparture] = useState(0);
  const { has, add } = useItinerary();

  if (!experience) return null;
  const inItinerary = has(experience.key);
  const chosen = DEPARTURES[departure];

  return (
    <>
      <div className="pbody">
        <Link href={hrefOf.city(experience.city)} className="back">
          ← {experience.city.name}
        </Link>

        <div className="hero-sw" style={{ background: swatch(experience.cat) }}>
          <span>Ảnh minh hoạ</span>
        </div>

        <div className="tagline">
          <span className="tag">{CAT_LABEL[experience.cat]}</span>
          <span className="rate">
            <b>{ratingLabel(experience.rating)}</b> ★ · {experience.reviews} đánh giá
          </span>
        </div>

        <h1 className="ptitle sm">{experience.title}</h1>
        <p className="pnative">
          {experience.city.name}, {experience.country.name} · {experience.duration}
        </p>
        <p className="pdesc">{experience.blurb}</p>

        <div className="sechead">
          <span className="mono">Bao gồm</span>
        </div>
        <ul className="incl">
          {CAT_INCLUDES[experience.cat].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="sechead">
          <span className="mono">Khởi hành gần nhất</span>
        </div>
        <div className="dates">
          {DEPARTURES.map((d, i) => (
            <button
              key={d.date}
              type="button"
              className="date"
              aria-pressed={i === departure}
              onClick={() => setDeparture(i)}
            >
              <b>{d.date}</b>
              <small>{d.day}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="pfoot">
        <div className="amt">
          <span className="mono">
            {chosen.date} · mỗi khách
          </span>
          <b>{vnd(experience.price)}</b>
        </div>
        {inItinerary ? (
          <Link href={hrefOf.itinerary()} className="btn ghost">
            Đã trong hành trình
          </Link>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() =>
              add(experience.key, `Đã thêm “${experience.title}” · khởi hành ${chosen.date}`)
            }
          >
            Thêm vào hành trình
          </button>
        )}
      </div>
    </>
  );
}

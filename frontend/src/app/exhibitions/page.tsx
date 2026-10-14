import Image from "next/image";

import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { rooms } from "../../data/siteData";

export default function ExhibitionsPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero exhibition-page-hero">
        <span className="eyebrow">
          EXHIBITION
        </span>

        <h1>Curated Rooms</h1>

        <p>
          작품을 카테고리가 아닌 하나의 시선과
          맥락으로 묶어 보여줍니다.
        </p>
      </section>

      <section className="exhibition-list">
        {rooms.map((room, index) => {
          const exhibitionUrl =
            `/exhibitions/${room.id}`;

          return (
            <article
              className={`exhibition-row ${
                index % 2 === 1
                  ? "reverse"
                  : ""
              }`}
              id={room.id}
              key={room.id}
            >
              <a
                href={exhibitionUrl}
                className="exhibition-image"
                aria-label={`View ${room.title}`}
              >
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  className="cover-image"
                  sizes="(max-width: 800px) 100vw, 58vw"
                />

                <div className="exhibition-light" />
              </a>

              <div className="exhibition-copy">
                <span className="room-number">
                  {room.number}
                </span>

                <h2>{room.title}</h2>

                <p>{room.description}</p>

                <small>{room.note}</small>

                <a
                  className="text-link"
                  href={exhibitionUrl}
                >
                  View exhibition →
                </a>
              </div>
            </article>
          );
        })}
      </section>

      <SiteFooter />
    </main>
  );
}
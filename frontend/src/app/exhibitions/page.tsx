import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { rooms } from "../../data/siteData";

export const metadata: Metadata = {
  title: "Exhibitions",
  description:
    "Explore SOYO Curated Rooms and discover works through exhibitions and perspectives.",
};

export default function ExhibitionsPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero exhibition-page-hero">
        <span className="eyebrow">EXHIBITION</span>

        <h1>Curated Rooms</h1>

        <p>
          작품을 카테고리가 아닌 하나의 시선과 맥락으로 묶어
          보여줍니다.
        </p>
      </section>

      {rooms.length > 0 ? (
        <section className="exhibition-list">
          {rooms.map((room, index) => {
            const exhibitionUrl = `/exhibitions/${room.id}`;

            return (
              <article
                className={`exhibition-row ${
                  index % 2 === 1 ? "reverse" : ""
                }`}
                id={room.id}
                key={room.id}
              >
                <Link
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
                </Link>

                <div className="exhibition-copy">
                  <span className="room-number">{room.number}</span>

                  <h2>{room.title}</h2>

                  <p>{room.description}</p>

                  <small>{room.note}</small>

                  <Link className="text-link" href={exhibitionUrl}>
                    View exhibition →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="list-empty-state">
          <span className="section-kicker">Exhibitions</span>
          <h2>New curated rooms are being prepared.</h2>
          <p>
            Upcoming exhibitions will appear here when selections are
            ready.
          </p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

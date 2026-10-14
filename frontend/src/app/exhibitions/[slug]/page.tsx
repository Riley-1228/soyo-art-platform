import Image from "next/image";
import { notFound } from "next/navigation";

import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";

import {
  artworks,
  artists,
  rooms,
} from "../../../data/siteData";

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return rooms.map((room) => ({
    slug: room.id,
  }));
}

function getStatusLabel(
  status: "available" | "reserved" | "sold"
) {
  if (status === "reserved") {
    return "Reserved";
  }

  if (status === "sold") {
    return "Sold";
  }

  return "Available";
}

function formatIndex(index: number) {
  if (index < 10) {
    return `0${index}`;
  }

  return String(index);
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;

  const room = rooms.find(
    (item) => item.id === slug
  );

  if (!room) {
    notFound();
  }

  const roomArtists = artists.filter(
    (artist) =>
      room.artistIds.includes(artist.id)
  );

  const roomArtworks = artworks.filter(
    (artwork) =>
      room.artworkIds.includes(artwork.id)
  );

  const isComingSoon =
    roomArtists.length === 0 &&
    roomArtworks.length === 0;

  return (
    <main className="site-shell exhibition-detail-page">
      <SiteHeader />

      {/* HERO */}
      <section className="exhibition-detail-hero">
        <div className="exhibition-detail-hero-media">
          <Image
            src={room.image}
            alt={room.title}
            fill
            priority
            className="cover-image"
            sizes="(max-width: 820px) 100vw, 58vw"
          />

          <div className="exhibition-detail-hero-light" />

          <span className="exhibition-detail-image-note">
            SOYO · CURATED ROOM {room.number}
          </span>
        </div>

        <div className="exhibition-detail-hero-copy">
          <div className="exhibition-detail-topline">
            <span>
              ROOM {room.number}
            </span>

            <span>
              {room.period}
            </span>
          </div>

          <span className="section-kicker">
            Curated Exhibition
          </span>

          <h1>{room.title}</h1>

          <p className="exhibition-detail-description">
            {room.description}
          </p>

          <p className="exhibition-detail-note">
            {room.note}
          </p>

          <a
            href="/exhibitions"
            className="quiet-link"
          >
            ← All Curated Rooms
          </a>
        </div>
      </section>

      {/* CURATORIAL NOTE */}
      <section className="exhibition-curatorial-section">
        <div className="exhibition-section-label">
          <span>01</span>

          <p>
            Curatorial Note
          </p>
        </div>

        <div className="exhibition-curatorial-copy">
          <p>
            {room.curatorialNote}
          </p>
        </div>
      </section>

      {isComingSoon ? (
        <section className="exhibition-coming-soon">
          <span className="section-kicker">
            Upcoming Room
          </span>

          <h2>
            Selections coming soon.
          </h2>

          <p>
            Participating artists and selected works
            for this room are currently being curated.
          </p>

          <a
            href="/exhibitions"
            className="outline-button"
          >
            View Other Rooms

            <span>→</span>
          </a>
        </section>
      ) : (
        <>
          {/* PARTICIPATING ARTISTS */}
          {roomArtists.length > 0 ? (
            <section className="exhibition-artists-section">
              <div className="exhibition-section-heading">
                <div>
                  <span className="section-kicker">
                    Participating Artists
                  </span>

                  <h2>
                    Artists in this room
                  </h2>
                </div>

                <span className="exhibition-section-count">
                  {formatIndex(
                    roomArtists.length
                  )}
                </span>
              </div>

              <div className="exhibition-artist-grid">
                {roomArtists.map(
                  (artist, index) => (
                    <article
                      className="exhibition-artist-card"
                      key={artist.id}
                    >
                      <div className="exhibition-artist-image">
                        <Image
                          src={artist.image}
                          alt={artist.name}
                          fill
                          className="cover-image"
                          sizes="(max-width: 820px) 100vw, 45vw"
                        />
                      </div>

                      <div className="exhibition-artist-copy">
                        <span className="exhibition-artist-index">
                          {formatIndex(
                            index + 1
                          )}
                        </span>

                        <h3>
                          {artist.name}
                        </h3>

                        <small>
                          {artist.location}
                          {" · "}
                          {artist.discipline}
                        </small>

                        <p>
                          {artist.statement}
                        </p>

                        <a
                        href={`/artists/${artist.id}`}
                        className="text-link"
                        >
                        View Artist →
                        </a>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          ) : null}

          {/* SELECTED WORKS */}
          {roomArtworks.length > 0 ? (
            <section className="exhibition-works-section">
              <div className="exhibition-section-heading">
                <div>
                  <span className="section-kicker">
                    Selected Works
                  </span>

                  <h2>
                    Works in this room
                  </h2>
                </div>

                <span className="exhibition-section-count">
                  {formatIndex(
                    roomArtworks.length
                  )}
                </span>
              </div>

              <div className="exhibition-work-grid">
                {roomArtworks.map(
                  (artwork) => {
                    const artworkUrl =
                      `/works/${artwork.id}`;

                    return (
                      <a
                        href={artworkUrl}
                        className="exhibition-work-card"
                        key={artwork.id}
                      >
                        <div className="exhibition-work-image">
                          <Image
                            src={artwork.image}
                            alt={artwork.title}
                            fill
                            className="cover-image"
                            sizes="(max-width: 820px) 100vw, 50vw"
                          />

                          <span
                            className={`exhibition-work-status status-${artwork.status}`}
                          >
                            <i aria-hidden="true" />

                            {getStatusLabel(
                              artwork.status
                            )}
                          </span>
                        </div>

                        <div className="exhibition-work-copy">
                          <div>
                            <span className="exhibition-work-category">
                              {artwork.category}
                            </span>

                            <h3>
                              {artwork.title}
                            </h3>

                            <p>
                              {artwork.artist}
                            </p>

                            <small>
                              {artwork.year}
                              {" · "}
                              {artwork.material}
                              {" · "}
                              {artwork.dimensions}
                            </small>
                          </div>

                          <div className="exhibition-work-bottom">
                            <strong>
                              {artwork.price}
                            </strong>

                            <span aria-hidden="true">
                              →
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  }
                )}
              </div>
            </section>
          ) : null}
        </>
      )}

      <SiteFooter />
    </main>
  );
}
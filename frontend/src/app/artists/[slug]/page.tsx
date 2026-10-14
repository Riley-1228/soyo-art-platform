import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";

import {
  artworks,
  artists,
  rooms,
} from "../../../data/siteData";

type ArtistDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return artists.map((artist) => ({
    slug: artist.id,
  }));
}

export async function generateMetadata({
  params,
}: ArtistDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const artist = artists.find(
    (item) => item.id === slug
  );

  if (!artist) {
    return {
      title: "Artist Not Found",
    };
  }

  return {
    title: artist.name,

    description:
      `${artist.name} — ${artist.location} · ` +
      `${artist.discipline}. ${artist.statement}`,
  };
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

export default async function ArtistDetailPage({
  params,
}: ArtistDetailPageProps) {
  const { slug } = await params;

  const artist = artists.find(
    (item) => item.id === slug
  );

  if (!artist) {
    notFound();
  }

  const artistArtworks = artworks.filter(
    (artwork) =>
      artwork.artistId === artist.id
  );

  const artistRooms = rooms.filter(
    (room) =>
      room.artistIds.includes(artist.id)
  );

  return (
    <main className="site-shell artist-detail-page">
      <SiteHeader />

      {/* HERO */}
      <section className="artist-detail-hero">
        <div className="artist-detail-hero-media">
          <Image
            src={artist.image}
            alt={artist.name}
            fill
            priority
            className="cover-image"
            sizes="(max-width: 820px) 100vw, 48vw"
          />

          <div className="artist-detail-image-light" />

          <span className="artist-detail-image-note">
            SOYO · ARTIST PROFILE
          </span>
        </div>

        <div className="artist-detail-hero-copy">
          <div className="artist-detail-topline">
            <span>
              {artist.location}
            </span>

            <span>
              {artist.discipline}
            </span>
          </div>

          <span className="section-kicker">
            Artist
          </span>

          <h1>
            {artist.name}
          </h1>

          <p className="artist-detail-statement">
            {artist.statement}
          </p>

          <a
            href="/artists"
            className="quiet-link"
          >
            ← All Artists
          </a>
        </div>
      </section>

      {/* ABOUT */}
      <section className="artist-detail-about">
        <div className="artist-detail-section-label">
          <span>01</span>

          <p>
            About the Artist
          </p>
        </div>

        <div className="artist-detail-bio">
          <p>
            {artist.bio}
          </p>
        </div>
      </section>

      {/* SELECTED WORKS */}
      <section className="artist-detail-works">
        <div className="artist-detail-section-heading">
          <div>
            <span className="section-kicker">
              Selected Works
            </span>

            <h2>
              Works by {artist.name}
            </h2>
          </div>

          <span className="artist-detail-count">
            {formatIndex(
              artistArtworks.length
            )}
          </span>
        </div>

        {artistArtworks.length > 0 ? (
          <div className="artist-detail-work-grid">
            {artistArtworks.map(
              (artwork) => {
                const artworkUrl =
                  `/works/${artwork.id}`;

                return (
                  <a
                    href={artworkUrl}
                    className="artist-detail-work-card"
                    key={artwork.id}
                  >
                    <div className="artist-detail-work-image">
                      <Image
                        src={artwork.image}
                        alt={artwork.title}
                        fill
                        className="cover-image"
                        sizes="(max-width: 820px) 100vw, 50vw"
                      />

                      <span
                        className={`artist-detail-work-status status-${artwork.status}`}
                      >
                        <i aria-hidden="true" />

                        {getStatusLabel(
                          artwork.status
                        )}
                      </span>
                    </div>

                    <div className="artist-detail-work-copy">
                      <span className="artist-detail-work-category">
                        {artwork.category}
                      </span>

                      <h3>
                        {artwork.title}
                      </h3>

                      <small>
                        {artwork.year}
                        {" · "}
                        {artwork.material}
                      </small>

                      <p>
                        {artwork.dimensions}
                      </p>

                      <div className="artist-detail-work-bottom">
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
        ) : (
          <p className="artist-detail-empty">
            Selected works will be added soon.
          </p>
        )}
      </section>

      {/* EXHIBITIONS */}
      {artistRooms.length > 0 ? (
        <section className="artist-detail-exhibitions">
          <div className="artist-detail-section-heading">
            <div>
              <span className="section-kicker">
                Exhibitions
              </span>

              <h2>
                Curated Rooms
              </h2>
            </div>

            <span className="artist-detail-count">
              {formatIndex(
                artistRooms.length
              )}
            </span>
          </div>

          <div className="artist-detail-room-grid">
            {artistRooms.map((room) => (
              <a
                href={`/exhibitions/${room.id}`}
                className="artist-detail-room-card"
                key={room.id}
              >
                <div className="artist-detail-room-image">
                  <Image
                    src={room.image}
                    alt={room.title}
                    fill
                    className="cover-image"
                    sizes="(max-width: 820px) 100vw, 50vw"
                  />

                  <div className="artist-detail-room-light" />
                </div>

                <div className="artist-detail-room-copy">
                  <span>
                    ROOM {room.number}
                  </span>

                  <h3>
                    {room.title}
                  </h3>

                  <p>
                    {room.description}
                  </p>

                  <small>
                    {room.period}
                  </small>

                  <strong>
                    View Exhibition →
                  </strong>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
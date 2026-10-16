import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

type ExhibitionApi = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  note: string;
  period: string;
  curatorialNote: string;
  artistIds: string[];
  artworkIds: string[];
};

type ArtistApi = {
  id: string;
  name: string;
  location: string;
  discipline: string;
  image: string;
  statement: string;
  bio: string;
  artworkIds: string[];
  exhibitionIds: string[];
};

type ArtworkApi = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  location: string;
  year: string;
  material: string;
  dimensions: string;
  category: string;
  edition: string;
  priceAmount: number;
  currency: string;
  price: string;
  status: ArtworkStatus;
  image: string;
  description: string;
  exhibitionId: string | null;
  exhibitionIds: string[];
};

type ExhibitionApiResponse = {
  ok: boolean;
  exhibition?: ExhibitionApi;
  error?: string;
};

type ArtistsApiResponse = {
  ok: boolean;
  artists?: ArtistApi[];
  error?: string;
};

type ArtworksApiResponse = {
  ok: boolean;
  artworks?: ArtworkApi[];
  error?: string;
};

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

async function getExhibition(
  slug: string
): Promise<ExhibitionApi | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/exhibitions/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Exhibition API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ExhibitionApiResponse;

  if (
    !payload.ok ||
    !payload.exhibition
  ) {
    throw new Error(
      payload.error ||
        "Exhibition API returned an invalid response."
    );
  }

  return payload.exhibition;
}

async function getArtists(): Promise<ArtistApi[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/artists`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Artist API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ArtistsApiResponse;

  if (
    !payload.ok ||
    !Array.isArray(payload.artists)
  ) {
    throw new Error(
      payload.error ||
        "Artist API returned an invalid response."
    );
  }

  return payload.artists;
}

async function getArtworks(): Promise<ArtworkApi[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/artworks`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Artwork API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ArtworksApiResponse;

  if (
    !payload.ok ||
    !Array.isArray(payload.artworks)
  ) {
    throw new Error(
      payload.error ||
        "Artwork API returned an invalid response."
    );
  }

  return payload.artworks;
}

export async function generateMetadata({
  params,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const room =
      await getExhibition(slug);

    if (!room) {
      return {
        title: "Exhibition Not Found",
      };
    }

    return {
      title: room.title,
      description:
        `${room.title} — ${room.description}. ` +
        `${room.period}. Curated by SOYO.`,
    };
  } catch {
    return {
      title: "Exhibition | SOYO",
    };
  }
}

function getStatusLabel(
  status: ArtworkStatus
) {
  if (status === "reserved") {
    return "Reserved";
  }

  if (status === "sold") {
    return "Sold";
  }

  return "Available";
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;

  const room =
    await getExhibition(slug);

  if (!room) {
    notFound();
  }

  const [
    allArtists,
    allArtworks,
  ] = await Promise.all([
    getArtists(),
    getArtworks(),
  ]);

  const artistsById =
    new Map(
      allArtists.map((artist) => [
        artist.id,
        artist,
      ])
    );

  const artworksById =
    new Map(
      allArtworks.map((artwork) => [
        artwork.id,
        artwork,
      ])
    );

  const roomArtists =
    room.artistIds
      .map((id) => artistsById.get(id))
      .filter(
        (artist): artist is ArtistApi =>
          artist !== undefined
      );

  const roomArtworks =
    room.artworkIds
      .map((id) => artworksById.get(id))
      .filter(
        (artwork): artwork is ArtworkApi =>
          artwork !== undefined
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

          <h1>
            {room.title}
          </h1>

          <p className="exhibition-detail-description">
            {room.description}
          </p>

          <p className="exhibition-detail-note">
            {room.note}
          </p>

          <Link
            href="/exhibitions"
            className="quiet-link"
          >
            ← All Curated Rooms
          </Link>
        </div>
      </section>

      {/* CURATORIAL NOTE */}
      <section className="exhibition-curatorial-section">
        <div className="exhibition-section-label">
          <span>01</span>
          <p>Curatorial Note</p>
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

          <Link
            href="/exhibitions"
            className="outline-button"
          >
            View Other Rooms
            <span>→</span>
          </Link>
        </section>
      ) : (
        <>
          {/* ARTISTS */}
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
                  {String(
                    roomArtists.length
                  ).padStart(2, "0")}
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
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
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

                        <Link
                          href="/artists"
                          className="text-link"
                        >
                          View Artist Index →
                        </Link>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          ) : null}

          {/* WORKS */}
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
                  {String(
                    roomArtworks.length
                  ).padStart(2, "0")}
                </span>
              </div>

              <div className="exhibition-work-grid">
                {roomArtworks.map(
                  (artwork) => (
                    <Link
                      href={`/works/${artwork.id}`}
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
                    </Link>
                  )
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

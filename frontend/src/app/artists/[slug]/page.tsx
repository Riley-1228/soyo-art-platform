import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";

type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

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

type ArtistApiResponse = {
  ok: boolean;
  artist?: ArtistApi;
  error?: string;
};

type ArtworksApiResponse = {
  ok: boolean;
  artworks?: ArtworkApi[];
  error?: string;
};

type ExhibitionsApiResponse = {
  ok: boolean;
  exhibitions?: ExhibitionApi[];
  error?: string;
};

type ArtistDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

async function getArtist(
  slug: string
): Promise<ArtistApi | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/artists/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Artist API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ArtistApiResponse;

  if (!payload.ok || !payload.artist) {
    throw new Error(
      payload.error ||
        "Artist API returned an invalid response."
    );
  }

  return payload.artist;
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

async function getExhibitions(): Promise<ExhibitionApi[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/exhibitions`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Exhibition API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ExhibitionsApiResponse;

  if (
    !payload.ok ||
    !Array.isArray(payload.exhibitions)
  ) {
    throw new Error(
      payload.error ||
        "Exhibition API returned an invalid response."
    );
  }

  return payload.exhibitions;
}

export async function generateMetadata({
  params,
}: ArtistDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const artist =
      await getArtist(slug);

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
  } catch {
    return {
      title: "Artist | SOYO",
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

  const artist =
    await getArtist(slug);

  if (!artist) {
    notFound();
  }

  const [
    allArtworks,
    allExhibitions,
  ] = await Promise.all([
    getArtworks(),
    getExhibitions(),
  ]);

  const artworksById =
    new Map(
      allArtworks.map((artwork) => [
        artwork.id,
        artwork,
      ])
    );

  const exhibitionsById =
    new Map(
      allExhibitions.map((exhibition) => [
        exhibition.id,
        exhibition,
      ])
    );

  const artistArtworks =
    artist.artworkIds
      .map((id) => artworksById.get(id))
      .filter(
        (artwork): artwork is ArtworkApi =>
          artwork !== undefined
      );

  const artistRooms =
    artist.exhibitionIds
      .map((id) => exhibitionsById.get(id))
      .filter(
        (
          exhibition
        ): exhibition is ExhibitionApi =>
          exhibition !== undefined
      );

  return (
    <main className="site-shell artist-detail-page">
      <SiteHeader />

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

          <Link
            href="/artists"
            className="quiet-link"
          >
            ← All Artists
          </Link>
        </div>
      </section>

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
                  <Link
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
                  </Link>
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
              <Link
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
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}

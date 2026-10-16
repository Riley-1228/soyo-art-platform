import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

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

type ArtistsApiResponse = {
  ok: boolean;
  artists?: ArtistApi[];
  error?: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

function formatIndex(index: number) {
  if (index < 10) {
    return `0${index}`;
  }

  return String(index);
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

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Discover emerging artists and creative practices curated by SOYO.",
};

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  let artists: ArtistApi[] = [];
  let loadFailed = false;

  try {
    artists = await getArtists();
  } catch (error) {
    loadFailed = true;

    console.error(
      "Failed to load SOYO artists:",
      error
    );
  }

  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero compact-page-hero">
        <span className="eyebrow">ARTISTS</span>

        <h1>Artists</h1>

        <p>
          SOYO가 주목하는 동시대 창작자와 그들의 작업 세계를
          소개합니다.
        </p>
      </section>

      {loadFailed ? (
        <section className="list-empty-state">
          <span className="section-kicker">
            Artists
          </span>

          <h2>
            Artist profiles are temporarily unavailable.
          </h2>

          <p>
            Please try again shortly.
          </p>
        </section>
      ) : artists.length > 0 ? (
        <section className="artists-grid">
          {artists.map((artist, index) => {
            const artistUrl =
              `/artists/${artist.id}`;

            return (
              <article
                className="artist-card"
                key={artist.id}
              >
                <Link
                  href={artistUrl}
                  className={`artist-card-image artist-crop-${
                    index + 1
                  }`}
                  aria-label={`View ${artist.name}`}
                >
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    className="cover-image"
                    sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  />
                </Link>

                <span className="artist-index">
                  {formatIndex(index + 1)}
                </span>

                <h2>
                  <Link
                    href={artistUrl}
                    className="artist-card-title-link"
                  >
                    {artist.name}
                  </Link>
                </h2>

                <small>
                  {artist.location}
                  {" · "}
                  {artist.discipline}
                </small>

                <p>{artist.statement}</p>

                <Link
                  href={artistUrl}
                  className="text-link"
                >
                  View Artist →
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="list-empty-state">
          <span className="section-kicker">
            Artists
          </span>

          <h2>
            Artist profiles are coming soon.
          </h2>

          <p>
            SOYO is currently preparing the next group of participating
            creators.
          </p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

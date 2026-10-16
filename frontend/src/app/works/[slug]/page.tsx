import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PurchaseInquiry from "@/components/PurchaseInquiry";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

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

type ArtworkResponse = {
  ok: boolean;
  artwork?: ArtworkApi;
  error?: string;
};

type ArtistResponse = {
  ok: boolean;
  artist?: ArtistApi;
  error?: string;
};

type ExhibitionResponse = {
  ok: boolean;
  exhibition?: ExhibitionApi;
  error?: string;
};

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

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

async function getArtwork(
  slug: string
): Promise<ArtworkApi | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/artworks/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Artwork API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ArtworkResponse;

  if (
    !payload.ok ||
    !payload.artwork
  ) {
    throw new Error(
      payload.error ||
        "Artwork API returned an invalid response."
    );
  }

  return payload.artwork;
}

async function getArtist(
  artistId: string
): Promise<ArtistApi | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/artists/${encodeURIComponent(artistId)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error(
      `Artist API request failed with status ${response.status}.`
    );
    return null;
  }

  const payload =
    (await response.json()) as ArtistResponse;

  if (
    !payload.ok ||
    !payload.artist
  ) {
    return null;
  }

  return payload.artist;
}

async function getExhibition(
  exhibitionId: string
): Promise<ExhibitionApi | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/exhibitions/${encodeURIComponent(exhibitionId)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error(
      `Exhibition API request failed with status ${response.status}.`
    );
    return null;
  }

  const payload =
    (await response.json()) as ExhibitionResponse;

  if (
    !payload.ok ||
    !payload.exhibition
  ) {
    return null;
  }

  return payload.exhibition;
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } =
    await params;

  try {
    const artwork =
      await getArtwork(
        slug
      );

    if (!artwork) {
      return {
        title:
          "Artwork Not Found",
      };
    }

    return {
      title:
        artwork.title,

      description:
        `${artwork.title} by ${artwork.artist}. ` +
        `${artwork.year} · ${artwork.material}. ` +
        "Discover this work on SOYO.",
    };
  } catch {
    return {
      title:
        "Artwork | SOYO",
    };
  }
}

export default async function ArtworkDetailPage({
  params,
}: ArtworkDetailPageProps) {
  const { slug } =
    await params;

  const artwork =
    await getArtwork(
      slug
    );

  if (!artwork) {
    notFound();
  }

  const [
    artist,
    exhibition,
  ] = await Promise.all([
    getArtist(
      artwork.artistId
    ),

    artwork.exhibitionId
      ? getExhibition(
          artwork.exhibitionId
        )
      : Promise.resolve(
          null
        ),
  ]);

  const statusLabel =
    getStatusLabel(
      artwork.status
    );

  return (
    <main className="site-shell artwork-detail-page">
      <SiteHeader />

      <section className="artwork-detail-hero">
        <div className="artwork-detail-media">
          <div className="artwork-detail-image-wrap">
            <Image
              src={
                artwork.image
              }
              alt={
                artwork.title
              }
              fill
              priority
              sizes="(max-width: 820px) 100vw, 58vw"
              className="artwork-detail-image"
            />
          </div>

          <span className="artwork-detail-image-note">
            SOYO · CURATED ART &amp; OBJECT
          </span>
        </div>

        <aside className="artwork-detail-info">
          <div className="artwork-detail-topline">
            <span>
              {
                artwork.category
              }
            </span>

            <span
              className={`artwork-status status-${artwork.status}`}
            >
              <i
                aria-hidden="true"
              />

              {
                statusLabel
              }
            </span>
          </div>

          <div className="artwork-detail-heading">
            <h1>
              {
                artwork.title
              }
            </h1>

            {artist ? (
              <Link
                href={`/artists/${artist.id}`}
                className="artwork-artist-link"
              >
                {
                  artist.name
                }

                <span>
                  →
                </span>
              </Link>
            ) : (
              <p className="artwork-artist-link">
                {
                  artwork.artist
                }
              </p>
            )}
          </div>

          <div className="artwork-detail-rule" />

          <dl className="artwork-specs">
            <div>
              <dt>Year</dt>
              <dd>
                {
                  artwork.year
                }
              </dd>
            </div>

            <div>
              <dt>
                Material
              </dt>

              <dd>
                {
                  artwork.material
                }
              </dd>
            </div>

            <div>
              <dt>
                Dimensions
              </dt>

              <dd>
                {
                  artwork.dimensions
                }
              </dd>
            </div>

            <div>
              <dt>
                Edition
              </dt>

              <dd>
                {
                  artwork.edition
                }
              </dd>
            </div>

            <div>
              <dt>
                Location
              </dt>

              <dd>
                {
                  artwork.location
                }
              </dd>
            </div>
          </dl>

          <div className="artwork-price-block">
            <span>
              Price
            </span>

            <strong>
              {
                artwork.price
              }
            </strong>
          </div>

          {artwork.status ===
          "sold" ? (
            <div className="artwork-sold-button">
              Sold
            </div>
          ) : (
            <PurchaseInquiry
              artworkId={
                artwork.id
              }
              artworkTitle={
                artwork.title
              }
              artist={
                artwork.artist
              }
              price={
                artwork.price
              }
            />
          )}

          <p className="artwork-purchase-note">
            Purchase and availability are confirmed
            directly by SOYO.
          </p>
        </aside>
      </section>

      <section className="artwork-detail-story">
        <div className="artwork-story-label">
          <span>
            01
          </span>

          <p>
            About the Work
          </p>
        </div>

        <div className="artwork-story-copy">
          <p>
            {
              artwork.description
            }
          </p>
        </div>
      </section>

      {artist ? (
        <section className="artwork-detail-artist">
          <div className="artwork-detail-artist-image">
            <Image
              src={
                artist.image
              }
              alt={
                artist.name
              }
              fill
              sizes="(max-width: 820px) 100vw, 42vw"
              className="cover-image"
            />
          </div>

          <div className="artwork-detail-artist-copy">
            <span className="section-kicker">
              Artist
            </span>

            <h2>
              {
                artist.name
              }
            </h2>

            <small>
              {
                artist.location
              }
              {" · "}
              {
                artist.discipline
              }
            </small>

            <p>
              {
                artist.statement
              }
            </p>

            <Link
              href={`/artists/${artist.id}`}
              className="text-link"
            >
              View Artist →
            </Link>
          </div>
        </section>
      ) : null}

      {exhibition ? (
        <section className="artwork-detail-exhibition">
          <div>
            <span className="section-kicker">
              Currently Exhibited In
            </span>

            <small>
              ROOM{" "}
              {
                exhibition.number
              }
            </small>

            <h2>
              {
                exhibition.title
              }
            </h2>

            <p>
              {
                exhibition.description
              }
            </p>
          </div>

          <Link
            href={`/exhibitions/${exhibition.id}`}
            className="outline-button"
          >
            View Exhibition
            <span>→</span>
          </Link>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}

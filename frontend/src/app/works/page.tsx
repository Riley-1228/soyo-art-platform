import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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

type ArtworksApiResponse = {
  ok: boolean;
  artworks?: ArtworkApi[];
  error?: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

function getStatusLabel(
  status: ArtworkStatus
) {
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  return "Available";
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

export const metadata: Metadata = {
  title: "Works",
  description:
    "Explore selected contemporary artworks curated by SOYO.",
};

/*
 * /works now reads from the SOYO backend on every request.
 * This keeps the Alpha catalogue in sync with Neon without
 * requiring a new frontend deployment for data-only changes.
 */
export const dynamic = "force-dynamic";

export default async function WorksPage() {
  let artworks: ArtworkApi[] = [];
  let loadFailed = false;

  try {
    artworks = await getArtworks();
  } catch (error) {
    loadFailed = true;
    console.error(
      "Failed to load SOYO artworks:",
      error
    );
  }

  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero compact-page-hero">
        <span className="eyebrow">
          WORKS · PREVIEW CATALOGUE
        </span>
        <h1>Works</h1>
        <p>
          작품 자체와 재료, 제작방식, 희소성을 중심으로 탐색합니다.
        </p>
      </section>

      {loadFailed ? (
        <section className="list-empty-state">
          <span className="section-kicker">
            Works
          </span>
          <h2>
            The catalogue is temporarily unavailable.
          </h2>
          <p>
            Please try again shortly.
          </p>
        </section>
      ) : artworks.length > 0 ? (
        <section className="works-page-grid">
          {artworks.map((artwork) => {
            const artworkUrl =
              `/works/${artwork.id}`;

            const statusLabel =
              getStatusLabel(
                artwork.status
              );

            return (
              <article
                className="work-list-card"
                id={artwork.id}
                key={artwork.id}
              >
                <Link
                  href={artworkUrl}
                  className="work-list-image"
                  aria-label={`View ${artwork.title}`}
                >
                  <Image
                    src={artwork.image}
                    alt={artwork.title}
                    fill
                    className="cover-image"
                    sizes="(max-width: 760px) 100vw, 50vw"
                  />

                  <div className="museum-spotlight subtle" />
                </Link>

                <div className="work-list-info">
                  <div className="work-list-topline">
                    <span>
                      {artwork.category}
                    </span>

                    <span
                      className={`work-list-status status-${artwork.status}`}
                    >
                      <i aria-hidden="true" />
                      {statusLabel}
                    </span>
                  </div>

                  <h2>
                    <Link href={artworkUrl}>
                      {artwork.title}
                    </Link>
                  </h2>

                  <p>
                    {artwork.artist}
                  </p>

                  <small>
                    {artwork.location}
                    {" · "}
                    {artwork.edition}
                  </small>

                  <strong>
                    {artwork.price}
                  </strong>

                  <Link
                    href={artworkUrl}
                    className="outline-button"
                  >
                    {artwork.status ===
                    "sold"
                      ? "View Work"
                      : "Purchase Inquiry"}

                    <span>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="list-empty-state">
          <span className="section-kicker">
            Works
          </span>
          <h2>
            No works are available yet.
          </h2>
          <p>
            New selections will appear here as
            SOYO adds them to the preview
            catalogue.
          </p>
        </section>
      )}

      <p className="preview-note">
        * 현재 작품 및 가격 정보는 테스트 사이트용 preview data입니다.
      </p>

      <SiteFooter />
    </main>
  );
}

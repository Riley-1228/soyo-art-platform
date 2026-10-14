import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";


import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import PurchaseInquiry from "@/components/PurchaseInquiry";
import {
  artworks,
  artists,
  rooms,
} from "@/data/siteData";

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return artworks.map((artwork) => ({
    slug: artwork.id,
  }));
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const artwork = artworks.find(
    (item) => item.id === slug
  );

  if (!artwork) {
    return {
      title: "Artwork Not Found",
    };
  }

  return {
    title: artwork.title,

    description:
      `${artwork.title} by ${artwork.artist}. ` +
      `${artwork.year} · ${artwork.material}. ` +
      `Discover this work on SOYO.`,
  };
}

function getStatusLabel(status: string) {
  if (status === "reserved") {
    return "Reserved";
  }

  if (status === "sold") {
    return "Sold";
  }

  return "Available";
}

export default async function ArtworkDetailPage({
  params,
}: ArtworkDetailPageProps) {
  const { slug } = await params;

  const artwork = artworks.find(
    (item) => item.id === slug
  );

  if (!artwork) {
    notFound();
  }

  const artist = artists.find(
    (item) => item.id === artwork.artistId
  );

  const exhibition = rooms.find(
    (item) => item.id === artwork.exhibitionId
  );

  const statusLabel = getStatusLabel(
    artwork.status
  );

  return (
    <main className="site-shell artwork-detail-page">
      <SiteHeader />

      <section className="artwork-detail-hero">

        {/* LEFT — ARTWORK */}
        <div className="artwork-detail-media">

          <div className="artwork-detail-image-wrap">
            <Image
              src={artwork.image}
              alt={artwork.title}
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


        {/* RIGHT — INFORMATION */}
        <aside className="artwork-detail-info">

          <div className="artwork-detail-topline">
            <span>
              {artwork.category}
            </span>

            <span
              className={`artwork-status status-${artwork.status}`}
            >
              <i aria-hidden="true" />
              {statusLabel}
            </span>
          </div>


          <div className="artwork-detail-heading">
            <h1>
              {artwork.title}
            </h1>

            {artist ? (
              <Link
                href={`/artists/${artist.id}`}
                className="artwork-artist-link"
              >
                {artist.name}
                <span>→</span>
              </Link>
            ) : (
              <p className="artwork-artist-link">
                {artwork.artist}
              </p>
            )}
          </div>


          <div className="artwork-detail-rule" />


          <dl className="artwork-specs">

            <div>
              <dt>Year</dt>
              <dd>{artwork.year}</dd>
            </div>

            <div>
              <dt>Material</dt>
              <dd>{artwork.material}</dd>
            </div>

            <div>
              <dt>Dimensions</dt>
              <dd>{artwork.dimensions}</dd>
            </div>

            <div>
              <dt>Edition</dt>
              <dd>{artwork.edition}</dd>
            </div>

            <div>
              <dt>Location</dt>
              <dd>{artwork.location}</dd>
            </div>

          </dl>


          <div className="artwork-price-block">
            <span>Price</span>
            <strong>
              {artwork.price}
            </strong>
          </div>


          {artwork.status === "sold" ? (
            <div className="artwork-sold-button">
              Sold
            </div>
          ) : (
            <PurchaseInquiry
              artworkId={artwork.id}
              artworkTitle={artwork.title}
              artist={artwork.artist}
              price={artwork.price}
            />
          )}


          <p className="artwork-purchase-note">
            Purchase and availability are confirmed
            directly by SOYO.
          </p>

        </aside>
      </section>


      {/* ABOUT THE WORK */}

      <section className="artwork-detail-story">

        <div className="artwork-story-label">
          <span>01</span>
          <p>About the Work</p>
        </div>

        <div className="artwork-story-copy">
          <p>
            {artwork.description}
          </p>
        </div>

      </section>


      {/* ARTIST */}

      {artist ? (
        <section className="artwork-detail-artist">

          <div className="artwork-detail-artist-image">
            <Image
              src={artist.image}
              alt={artist.name}
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
              {artist.name}
            </h2>

            <small>
              {artist.location}
              {" · "}
              {artist.discipline}
            </small>

            <p>
              {artist.statement}
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


      {/* EXHIBITION */}

      {exhibition ? (
        <section className="artwork-detail-exhibition">

          <div>
            <span className="section-kicker">
              Currently Exhibited In
            </span>

            <small>
              ROOM {exhibition.number}
            </small>

            <h2>
              {exhibition.title}
            </h2>

            <p>
              {exhibition.description}
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
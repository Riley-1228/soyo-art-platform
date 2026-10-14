import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { artists } from "../../data/siteData";

function formatIndex(index: number) {
  if (index < 10) {
    return `0${index}`;
  }

  return String(index);
}

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Discover emerging artists and creative practices curated by SOYO.",
};

export default function ArtistsPage() {
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

      {artists.length > 0 ? (
        <section className="artists-grid">
          {artists.map((artist, index) => {
            const artistUrl = `/artists/${artist.id}`;

            return (
              <article className="artist-card" key={artist.id}>
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

                <Link href={artistUrl} className="text-link">
                  View Artist →
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="list-empty-state">
          <span className="section-kicker">Artists</span>
          <h2>Artist profiles are coming soon.</h2>
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

import Image from "next/image";

import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { artists } from "../../data/siteData";

function formatIndex(index: number) {
  if (index < 10) {
    return `0${index}`;
  }

  return String(index);
}

export default function ArtistsPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero compact-page-hero">
        <span className="eyebrow">
          ARTISTS
        </span>

        <h1>Artists</h1>

        <p>
          SOYO가 주목하는 동시대 창작자와
          그들의 작업 세계를 소개합니다.
        </p>
      </section>

      <section className="artists-grid">
        {artists.map((artist, index) => {
          const artistUrl =
            `/artists/${artist.id}`;

          return (
            <article
              className="artist-card"
              key={artist.id}
            >
              <a
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
              </a>

              <span className="artist-index">
                {formatIndex(index + 1)}
              </span>

              <h2>
                <a
                  href={artistUrl}
                  className="artist-card-title-link"
                >
                  {artist.name}
                </a>
              </h2>

              <small>
                {artist.location}
                {" · "}
                {artist.discipline}
              </small>

              <p>
                {artist.statement}
              </p>

              <a
                href={artistUrl}
                className="text-link"
              >
                View Artist →
              </a>
            </article>
          );
        })}
      </section>

      <SiteFooter />
    </main>
  );
}
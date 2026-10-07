import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { artists } from "@/data/siteData";

export default function ArtistsPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />
      <section className="page-hero compact-page-hero">
        <span className="eyebrow">ARTIST DISCOVERY</span>
        <h1>Artists</h1>
        <p>유명세보다 작업의 맥락과 제작방식을 먼저 봅니다.</p>
      </section>

      <section className="artists-grid">
        {artists.map((artist, index) => (
          <article className="artist-card" key={artist.id}>
            <div className={`artist-card-image artist-crop-${index + 1}`}>
              <Image src={artist.image} alt={artist.name} fill className="cover-image" sizes="(max-width: 700px) 100vw, 25vw" />
            </div>
            <span className="artist-index">{String(index + 1).padStart(2, "0")}</span>
            <h2>{artist.name}</h2>
            <small>{artist.location} · {artist.discipline}</small>
            <p>{artist.statement}</p>
            <Link className="text-link" href="/works">View Works →</Link>
          </article>
        ))}
      </section>
      <p className="preview-note">* 작가 정보는 레이아웃 확인을 위한 preview data입니다.</p>
      <SiteFooter />
    </main>
  );
}

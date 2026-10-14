import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { artworks } from "@/data/siteData";

export default function WorksPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />
      <section className="page-hero compact-page-hero">
        <span className="eyebrow">WORKS · PREVIEW CATALOGUE</span>
        <h1>Works</h1>
        <p>작품 자체와 재료, 제작방식, 희소성을 중심으로 탐색합니다.</p>
      </section>

      <section className="works-page-grid">
        {artworks.map((artwork) => (
          <article className="work-list-card" id={artwork.id} key={artwork.id}>
            <div className="work-list-image">
              <Image src={artwork.image} alt={artwork.title} fill className="cover-image" sizes="(max-width: 760px) 100vw, 50vw" />
              <div className="museum-spotlight subtle" />
            </div>
            <div className="work-list-info">
              <div className="work-list-topline"><span>{artwork.category}</span><span>{artwork.edition}</span></div>
              <h2>{artwork.title}</h2>
              <p>{artwork.artist}</p>
              <small>{artwork.location}</small>
              <strong>{artwork.price}</strong>
              <button type="button" className="outline-button">Purchase Inquiry <span>→</span></button>
            </div>
          </article>
        ))}
      </section>
      <p className="preview-note">* 현재 작품 및 가격 정보는 테스트 사이트용 mock data입니다.</p>
      <SiteFooter />
    </main>
  );
}

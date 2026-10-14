import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function AboutPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="eyebrow">ABOUT SOYO</span>
          <h1>Discover before<br />they are known.</h1>
          <p>작품만 판매하는 마켓플레이스가 아니라, 아직 알려지지 않은 창작자와 사람이 만든 물성을 하나의 전시 경험으로 발견하는 플랫폼을 지향합니다.</p>
        </div>
        <div className="about-hero-image">
          <Image src="/images/process/process-01-studio.jpg" alt="Artist working in a studio" fill className="cover-image" sizes="(max-width: 800px) 100vw, 54vw" />
        </div>
      </section>

      <section className="about-principles">
        <span className="eyebrow">OUR CURATION</span>
        <div className="principle-grid">
          <article><strong>01</strong><h2>Creator</h2><p>누가 만들었는지, 어떤 작업을 해왔는지.</p></article>
          <article><strong>02</strong><h2>Process</h2><p>어떤 재료와 방식, 시간으로 만들어졌는지.</p></article>
          <article><strong>03</strong><h2>Scarcity</h2><p>Original, Unique, Limited Edition의 맥락.</p></article>
          <article><strong>04</strong><h2>Provenance</h2><p>작품 정보와 소유 이력을 기록하는 방향.</p></article>
        </div>
      </section>

      <section className="verification-section">
        <div>
          <span className="eyebrow">HUMAN-MADE VERIFICATION</span>
          <h2>Made by a person.<br />Documented with context.</h2>
        </div>
        <div className="verification-list">
          <p>Creator Identity</p><p>Material & Production Process</p><p>Production Time</p><p>Edition & Signature</p><p>AI Usage Disclosure</p><p>Certificate & Ownership History</p>
        </div>
      </section>

      <section className="about-inquiry" id="inquiry">
        <div className="about-inquiry-image">
          <Image src="/images/b2b/b2b-gallery.jpg" alt="Curated gallery space" fill className="cover-image" sizes="(max-width: 800px) 100vw, 58vw" />
        </div>
        <div className="about-inquiry-copy">
          <span className="eyebrow">COLLECTORS · INTERIORS · BRANDS</span>
          <h2>Commission & B2B Inquiry</h2>
          <p>공간 큐레이션, 브랜드 협업, 주문 제작 프로젝트를 위한 테스트 문의 영역입니다.</p>
          <a className="primary-button" href="mailto:hello@example.com">Get in touch <span>→</span></a>
          <Link className="quiet-link" href="/works">Explore works</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

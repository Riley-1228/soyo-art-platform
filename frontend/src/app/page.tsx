import Image from "next/image";
import Link from "next/link";
import HeroArtworkSlider from "@/components/HeroArtworkSlider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { rooms } from "@/data/siteData";

export default function Home() {
  return (
    <main className="site-shell home-page">
      <SiteHeader />

      <section className="home-hero" aria-label="SOYO featured exhibition">
        <Image
          src="/images/hero/hero-gallery-clean.png"
          alt="Sunlit gallery interior"
          fill
          priority
          sizes="100vw"
          className="home-hero-bg cover-image"
        />

        <div className="home-hero-gallery-wall" aria-hidden="true" />
        <div className="home-hero-left-grade" aria-hidden="true" />
        <div className="home-hero-soft-light" aria-hidden="true" />

        <div className="home-hero-copy">
          <span className="eyebrow">SOYO · CURATED ART & OBJECT</span>
          <h1>
            Step into
            <br />a living
            <br />exhibition.
          </h1>
          <div className="hero-copy-rule" />
          <p>
            Discover emerging creators from Asia.
            <br />A more diverse art world, starting here.
          </p>
          <Link className="primary-button" href="/exhibitions">
            Enter Exhibition <span>→</span>
          </Link>
        </div>

        <div className="home-hero-slider-wrap">
          <HeroArtworkSlider />
        </div>

        <div className="gold-thread" aria-hidden="true" />
        <div className="hero-side-note" aria-hidden="true">
          <span>ART</span>
          <span>CONNECTS</span>
          <span>MORE</span>
          <span>POSSIBILITIES</span>
        </div>
      </section>

      <section className="home-rooms" aria-labelledby="rooms-title">
        <div className="home-rooms-intro">
          <span className="section-kicker">Current Exhibition</span>
          <h2 id="rooms-title">Curated Rooms</h2>
          <p>상품 목록이 아니라 서로 다른 시선의 전시 공간을 탐험합니다.</p>
          <Link className="text-link" href="/exhibitions">
            View All Exhibitions →
          </Link>
        </div>

        <div className="home-room-grid">
          {rooms.map((room) => (
            <Link
              className="home-room-card"
              href={`/exhibitions#${room.id}`}
              key={room.id}
            >
              <div className="home-room-media">
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  className="cover-image"
                  sizes="(max-width: 800px) 90vw, 21vw"
                />
                <div className="room-light" />
              </div>
              <div className="home-room-meta">
                <span>{room.number}</span>
                <div>
                  <h3>{room.title}</h3>
                  <p>{room.description}</p>
                </div>
                <i>→</i>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-b2b" aria-labelledby="b2b-title">
        <div className="home-b2b-media">
          <Image
            src="/images/b2b/b2b-gallery.jpg"
            alt="Curated art in an interior"
            fill
            className="cover-image"
            sizes="(max-width: 800px) 100vw, 64vw"
          />
          <div className="home-b2b-light" />
        </div>
        <div className="home-b2b-copy">
          <span className="eyebrow">COLLECTORS · INTERIORS · BRANDS</span>
          <h2 id="b2b-title">Commission &amp;<br />B2B Inquiry</h2>
          <p>
            공간 큐레이션, 브랜드 협업, 주문 제작 프로젝트를 위한
            <br />SOYO의 B2B 제안 영역입니다.
          </p>
          <Link className="primary-button" href="/about#inquiry">
            Get in touch <span>→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

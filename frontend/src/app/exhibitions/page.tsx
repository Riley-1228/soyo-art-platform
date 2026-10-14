import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { rooms } from "@/data/siteData";

export default function ExhibitionsPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader />
      <section className="page-hero exhibition-page-hero">
        <span className="eyebrow">EXHIBITION</span>
        <h1>Curated Rooms</h1>
        <p>작품을 카테고리가 아닌 하나의 시선과 맥락으로 묶어 보여줍니다.</p>
      </section>

      <section className="exhibition-list">
        {rooms.map((room, index) => (
          <article className={`exhibition-row ${index % 2 ? "reverse" : ""}`} id={room.id} key={room.id}>
            <div className="exhibition-image">
              <Image src={room.image} alt={room.title} fill className="cover-image" sizes="(max-width: 800px) 100vw, 58vw" />
              <div className="exhibition-light" />
            </div>
            <div className="exhibition-copy">
              <span className="room-number">{room.number}</span>
              <h2>{room.title}</h2>
              <p>{room.description}</p>
              <small>{room.note}</small>
              <Link className="text-link" href="/works">View works in this room →</Link>
            </div>
          </article>
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}

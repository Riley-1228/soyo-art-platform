import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <main className="site-shell not-found-page">
      <SiteHeader />

      <section className="not-found-content">
        <span className="eyebrow">404 · SOYO</span>
        <p className="not-found-code" aria-hidden="true">
          404
        </p>
        <h1>This page is not part of the exhibition.</h1>
        <p>
          The work, artist, or exhibition may have moved or may no longer
          be available in this preview.
        </p>

        <div className="not-found-actions">
          <Link href="/" className="primary-button">
            Return Home <span>→</span>
          </Link>

          <Link href="/works" className="quiet-link">
            Explore Works
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

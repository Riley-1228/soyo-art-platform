import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>SOYO</strong>
        <span>ART LIVES BETWEEN PEOPLE.</span>
      </div>
      <nav>
        <Link href="/works">Works</Link>
        <Link href="/artists">Artists</Link>
        <Link href="/exhibitions">Exhibition</Link>
        <Link href="/about">About</Link>
      </nav>
      <small>© 2026 SOYO · Preview site</small>
    </footer>
  );
}

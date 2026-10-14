import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="logo" href="/" aria-label="SOYO home">
        <Image
          src="/images/logo/soyo-primary.png"
          alt="SOYO Art & Object"
          width={220}
          height={110}
          priority
          className="site-logo-image"
        />
      </Link>

      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link href="/works">Works</Link>
        <Link href="/artists">Artists</Link>
        <Link href="/exhibitions">Exhibition</Link>
        <Link href="/about">About</Link>
      </nav>

      <div className="header-actions" aria-label="Site actions">
        <Link href="/works" aria-label="Search works" className="header-icon">⌕</Link>
        <Link href="/about#inquiry" aria-label="Inquiry" className="header-icon">＋</Link>
      </div>
    </header>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const closeMobileNav = () => {
    setMobileOpen(false);
  };

  return (
    <header className="site-header">
      <Link className="logo" href="/" aria-label="SOYO home" onClick={closeMobileNav}>
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
        <Link href="/works" aria-label="Explore works" className="header-icon">
          {"\u2315"}
        </Link>
        <Link href="/about#inquiry" aria-label="B2B inquiry" className="header-icon">
          +
        </Link>
      </div>

      <div className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="mobile-nav-trigger"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-panel"
          onClick={() => setMobileOpen((current) => !current)}
        >
          <span className="mobile-nav-label">Menu</span>
          <span className="mobile-nav-symbol" aria-hidden="true">+</span>
        </button>

        {mobileOpen ? (
          <nav
            className="mobile-nav-panel"
            id="mobile-navigation-panel"
            aria-label="Mobile navigation"
          >
            <div className="mobile-nav-links">
              <Link href="/works" onClick={closeMobileNav}>
                <span>01</span>
                Works
              </Link>
              <Link href="/artists" onClick={closeMobileNav}>
                <span>02</span>
                Artists
              </Link>
              <Link href="/exhibitions" onClick={closeMobileNav}>
                <span>03</span>
                Exhibition
              </Link>
              <Link href="/about" onClick={closeMobileNav}>
                <span>04</span>
                About
              </Link>
            </div>

            <Link
              className="mobile-nav-inquiry"
              href="/about#inquiry"
              onClick={closeMobileNav}
            >
              Commission & B2B Inquiry <span aria-hidden="true">-&gt;</span>
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

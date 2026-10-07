"use client";

import Image from "next/image";
import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { artworks } from "@/data/siteData";

type Position = "active" | "prev" | "next" | "hidden";

function positionFor(index: number, active: number, length: number): Position {
  const offset = (index - active + length) % length;

  if (offset === 0) return "active";
  if (offset === 1) return "next";
  if (offset === length - 1) return "prev";

  return "hidden";
}

export default function HeroArtworkSlider() {
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const pointerStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const length = artworks.length;

  const previous = useCallback(() => {
    setActive((current) => (current - 1 + length) % length);
  }, [length]);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % length);
  }, [length]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
    suppressClick.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;

    const delta = event.clientX - pointerStart.current;
    const limitedDelta = Math.max(-150, Math.min(150, delta));

    setDragX(limitedDelta);

    if (Math.abs(delta) > 8) {
      suppressClick.current = true;
    }
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;

    const delta = event.clientX - pointerStart.current;

    pointerStart.current = null;
    setDragging(false);
    setDragX(0);

    if (delta <= -52) {
      next();
    } else if (delta >= 52) {
      previous();
    }
  };

  const cancelDrag = () => {
    pointerStart.current = null;
    setDragging(false);
    setDragX(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  };

  return (
    <div className="soyo-art-slider" aria-label="Featured artworks carousel">
      <div
        className={`soyo-art-stage ${dragging ? "is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured artworks"
      >
        <div className="soyo-art-active-halo" aria-hidden="true" />
        <div className="soyo-art-top-light" aria-hidden="true" />
        <div className="soyo-art-floor-light" aria-hidden="true" />

        <div
          className="soyo-art-drag-layer"
          style={{ transform: `translate3d(${dragX}px, 0, 0)` }}
        >
          {artworks.map((artwork, index) => {
            const position = positionFor(index, active, length);
            const isActive = position === "active";
            const isHidden = position === "hidden";

            return (
              <article
                className={`soyo-art-card is-${position}`}
                key={artwork.id}
                aria-hidden={isHidden}
              >
                <Link
                  href="/works"
                  className="soyo-art-card-link"
                  draggable={false}
                  tabIndex={isHidden ? -1 : 0}
                  aria-label={
                    isActive
                      ? `Open ${artwork.title}`
                      : `Show ${artwork.title}`
                  }
                  onClick={(event) => {
                    if (suppressClick.current) {
                      event.preventDefault();
                      suppressClick.current = false;
                      return;
                    }

                    if (!isActive) {
                      event.preventDefault();
                      setActive(index);
                    }
                  }}
                >
                  <div className="soyo-art-frame">
                    <div className="soyo-art-image-wrap">
                      <Image
                        src={artwork.image}
                        alt={artwork.title}
                        fill
                        sizes="(max-width: 620px) 62vw, (max-width: 980px) 38vw, 430px"
                        className="soyo-art-image"
                        priority={index === 0}
                        draggable={false}
                      />
                      <div className="soyo-art-glass-light" aria-hidden="true" />
                      <div className="soyo-art-inactive-shade" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="soyo-art-meta">
                    <div>
                      <strong>{artwork.title}</strong>
                      <small>{artwork.artist}</small>
                    </div>
                    <span aria-hidden="true">→</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      <div className="soyo-art-controls" aria-label="Artwork carousel controls">
        <button
          type="button"
          className="soyo-art-arrow"
          onClick={previous}
          aria-label="Previous artwork"
        >
          ←
        </button>

        <div className="soyo-art-progress">
          {artworks.map((artwork, index) => (
            <button
              type="button"
              className={index === active ? "is-current" : ""}
              onClick={() => setActive(index)}
              key={artwork.id}
              aria-label={`Show ${artwork.title}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className="soyo-art-arrow"
          onClick={next}
          aria-label="Next artwork"
        >
          →
        </button>

        <span className="soyo-art-counter" aria-live="polite">
          {String(active + 1).padStart(2, "0")} / {String(length).padStart(2, "0")}
        </span>

        <span className="soyo-art-drag-hint">DRAG TO EXPLORE</span>
      </div>
    </div>
  );
}

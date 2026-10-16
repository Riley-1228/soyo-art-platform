"use client";

import Image from "next/image";
import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type HeroArtwork = {
  id: string;
  title: string;
  artist: string;
  image: string;
};

type HeroArtworkSliderProps = {
  artworks: HeroArtwork[];
};

function positionFor(
  index: number,
  active: number,
  length: number
) {
  const offset =
    (index - active + length) % length;

  if (offset === 0) return "is-active";
  if (offset === 1) return "is-next";
  if (offset === 2) return "is-far-next";
  if (offset === length - 1) return "is-prev";

  return "is-hidden";
}

export default function HeroArtworkSlider({
  artworks,
}: HeroArtworkSliderProps) {
  const [active, setActive] =
    useState(0);

  const [dragX, setDragX] =
    useState(0);

  const [dragging, setDragging] =
    useState(false);

  const pointerStart =
    useRef<number | null>(null);

  const suppressClick =
    useRef(false);

  const length =
    artworks.length;

  const resolvedActive =
    length === 0
      ? 0
      : active % length;

  const previous = useCallback(() => {
    if (length === 0) return;

    setActive(
      (current) =>
        (current - 1 + length) %
        length
    );
  }, [length]);

  const next = useCallback(() => {
    if (length === 0) return;

    setActive(
      (current) =>
        (current + 1) % length
    );
  }, [length]);

  useEffect(() => {
    if (length === 0) return;

    const handleKey = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "ArrowLeft"
      ) {
        previous();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        next();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [length, next, previous]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (length === 0) return;

    pointerStart.current =
      event.clientX;

    suppressClick.current =
      false;

    setDragging(true);

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerStart.current ===
      null
    ) {
      return;
    }

    const delta =
      event.clientX -
      pointerStart.current;

    setDragX(
      Math.max(
        -190,
        Math.min(
          190,
          delta
        )
      )
    );

    if (
      Math.abs(delta) > 8
    ) {
      suppressClick.current =
        true;
    }
  };

  const finishDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerStart.current ===
      null
    ) {
      return;
    }

    const delta =
      event.clientX -
      pointerStart.current;

    pointerStart.current =
      null;

    setDragging(false);
    setDragX(0);

    if (delta <= -54) {
      next();
    }

    if (delta >= 54) {
      previous();
    }
  };

  if (length === 0) {
    return (
      <div
        className="hero-slider"
        aria-label="Featured artworks carousel"
      />
    );
  }

  return (
    <div
      className="hero-slider"
      aria-label="Featured artworks carousel"
    >
      <div
        className={`hero-slider-stage ${
          dragging
            ? "is-dragging"
            : ""
        }`}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          finishDrag
        }
        onPointerCancel={
          finishDrag
        }
      >
        <div
          className="active-artwork-aura"
          aria-hidden="true"
        />

        <div
          className="active-artwork-toplight"
          aria-hidden="true"
        />

        <div
          className="hero-slider-drag-layer"
          style={{
            transform:
              `translateX(${dragX}px)`,
          }}
        >
          {artworks.map(
            (
              artwork,
              index
            ) => {
              const position =
                positionFor(
                  index,
                  resolvedActive,
                  length
                );

              const isActive =
                index === resolvedActive;

              return (
                <article
                  className={`hero-slide-card ${position}`}
                  key={
                    artwork.id
                  }
                  aria-hidden={
                    position ===
                    "is-hidden"
                  }
                >
                  <Link
                    href="/works"
                    className="hero-slide-link"
                    draggable={
                      false
                    }
                    aria-label={
                      isActive
                        ? `Open ${artwork.title}`
                        : `Bring ${artwork.title} into focus`
                    }
                    onClick={(
                      event
                    ) => {
                      if (
                        suppressClick.current
                      ) {
                        event.preventDefault();
                        suppressClick.current =
                          false;

                        return;
                      }

                      if (
                        !isActive
                      ) {
                        event.preventDefault();

                        setActive(
                          index
                        );
                      }
                    }}
                  >
                    <span
                      className="hero-hanging-line"
                      aria-hidden="true"
                    />

                    <div className="hero-slide-image">
                      <Image
                        src={
                          artwork.image
                        }
                        alt={
                          artwork.title
                        }
                        fill
                        sizes="(max-width: 760px) 54vw, 360px"
                        className="cover-image"
                        priority={
                          index === 0
                        }
                        draggable={
                          false
                        }
                      />

                      <div
                        className="artwork-glass-light"
                        aria-hidden="true"
                      />

                      <div
                        className="artwork-side-shade"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="hero-slide-meta">
                      <div>
                        <strong>
                          {
                            artwork.title
                          }
                        </strong>

                        <small>
                          {
                            artwork.artist
                          }
                        </small>
                      </div>

                      <span>
                        →
                      </span>
                    </div>
                  </Link>
                </article>
              );
            }
          )}
        </div>
      </div>

      <div
        className="hero-slider-footer"
        aria-label="Artwork carousel controls"
      >
        <button
          type="button"
          className="hero-slider-arrow"
          onClick={previous}
          aria-label="Previous artwork"
        >
          ←
        </button>

        <div
          className="slider-progress"
          aria-hidden="true"
        >
          {artworks.map(
            (
              artwork,
              index
            ) => (
              <button
                type="button"
                className={
                  index === resolvedActive
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActive(
                    index
                  )
                }
                key={
                  artwork.id
                }
                tabIndex={-1}
              />
            )
          )}
        </div>

        <button
          type="button"
          className="hero-slider-arrow"
          onClick={next}
          aria-label="Next artwork"
        >
          →
        </button>

        <span className="slider-count">
          {String(
            resolvedActive + 1
          ).padStart(
            2,
            "0"
          )}{" "}
          /{" "}
          {String(
            length
          ).padStart(
            2,
            "0"
          )}
        </span>

        <span className="drag-hint">
          DRAG TO EXPLORE
        </span>
      </div>
    </div>
  );
}

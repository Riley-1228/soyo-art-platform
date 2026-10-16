import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type ExhibitionApi = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  note: string;
  period: string;
  curatorialNote: string;
  artistIds: string[];
  artworkIds: string[];
};

type ExhibitionsApiResponse = {
  ok: boolean;
  exhibitions?: ExhibitionApi[];
  error?: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

async function getExhibitions(): Promise<ExhibitionApi[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/exhibitions`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Exhibition API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as ExhibitionsApiResponse;

  if (
    !payload.ok ||
    !Array.isArray(payload.exhibitions)
  ) {
    throw new Error(
      payload.error ||
        "Exhibition API returned an invalid response."
    );
  }

  return payload.exhibitions;
}

export const metadata: Metadata = {
  title: "Exhibitions",
  description:
    "Explore SOYO curated rooms and contemporary art exhibitions.",
};

export const dynamic = "force-dynamic";

export default async function ExhibitionsPage() {
  let rooms: ExhibitionApi[] = [];
  let loadFailed = false;

  try {
    rooms = await getExhibitions();
  } catch (error) {
    loadFailed = true;

    console.error(
      "Failed to load SOYO exhibitions:",
      error
    );
  }

  return (
    <main className="site-shell inner-page">
      <SiteHeader />

      <section className="page-hero exhibition-page-hero">
        <span className="eyebrow">
          EXHIBITION
        </span>

        <h1>Curated Rooms</h1>

        <p>
          작품을 카테고리가 아닌 하나의 시선과
          맥락으로 묶어 보여줍니다.
        </p>
      </section>

      {loadFailed ? (
        <section className="list-empty-state">
          <span className="section-kicker">
            Exhibitions
          </span>

          <h2>
            Curated rooms are temporarily unavailable.
          </h2>

          <p>
            Please try again shortly.
          </p>
        </section>
      ) : rooms.length > 0 ? (
        <section className="exhibition-list">
          {rooms.map((room, index) => (
            <article
              className={`exhibition-row ${
                index % 2 ? "reverse" : ""
              }`}
              id={room.id}
              key={room.id}
            >
              <Link
                href={`/exhibitions/${room.id}`}
                className="exhibition-image"
                aria-label={`View ${room.title}`}
              >
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  className="cover-image"
                  sizes="(max-width: 800px) 100vw, 58vw"
                />

                <div className="exhibition-light" />
              </Link>

              <div className="exhibition-copy">
                <span className="room-number">
                  {room.number}
                </span>

                <h2>{room.title}</h2>

                <p>{room.description}</p>

                <small>{room.note}</small>

                <Link
                  className="text-link"
                  href={`/exhibitions/${room.id}`}
                >
                  View exhibition →
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="list-empty-state">
          <span className="section-kicker">
            Exhibitions
          </span>

          <h2>
            Curated rooms are coming soon.
          </h2>

          <p>
            SOYO is currently preparing the next exhibition programme.
          </p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

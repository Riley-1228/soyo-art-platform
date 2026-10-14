import {
  Router,
} from "express";

import {
  getDbPool,
} from "../db";

type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

type ArtworkRow = {
  id: string;
  title: string;
  artist_id: string;
  artist: string;
  location: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  edition: string | null;
  price_amount: string | number | null;
  currency: string;
  status: ArtworkStatus;
  image: string | null;
  description: string | null;
  exhibition_ids: string[] | null;
};

const router =
  Router();

function formatPrice(
  priceAmount: number | null,
  currency: string
) {
  if (priceAmount === null) {
    return "Price on request";
  }

  if (currency === "KRW") {
    return `₩${Math.round(
      priceAmount
    ).toLocaleString("ko-KR")}`;
  }

  return `${currency} ${priceAmount.toLocaleString(
    "en-US"
  )}`;
}

function toArtwork(
  row: ArtworkRow
) {
  const priceAmount =
    row.price_amount === null
      ? null
      : Number(
          row.price_amount
        );

  const exhibitionIds =
    Array.isArray(
      row.exhibition_ids
    )
      ? row.exhibition_ids
      : [];

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistId:
      row.artist_id,
    location:
      row.location || "",
    year:
      row.year || "",
    material:
      row.material || "",
    dimensions:
      row.dimensions || "",
    category:
      row.category || "",
    edition:
      row.edition || "",
    priceAmount,
    currency:
      row.currency,
    price: formatPrice(
      priceAmount,
      row.currency
    ),
    status:
      row.status,
    image:
      row.image || "",
    description:
      row.description || "",
    exhibitionId:
      exhibitionIds[0] || null,
    exhibitionIds,
  };
}

const artworkSelect = `
  select
    a.id,
    a.title,
    a.artist_id,
    ar.name as artist,
    a.location,
    a.year,
    a.material,
    a.dimensions,
    a.category,
    a.edition,
    a.price_amount::text as price_amount,
    a.currency,
    a.status,
    a.image,
    a.description,
    coalesce(
      json_agg(
        ea.exhibition_id
        order by ea.sort_order
      ) filter (
        where ea.exhibition_id is not null
      ),
      '[]'::json
    ) as exhibition_ids
  from artworks a
  inner join artists ar
    on ar.id = a.artist_id
  left join exhibition_artworks ea
    on ea.artwork_id = a.id
`;

const artworkGroupBy = `
  group by
    a.id,
    a.title,
    a.artist_id,
    ar.name,
    a.location,
    a.year,
    a.material,
    a.dimensions,
    a.category,
    a.edition,
    a.price_amount,
    a.currency,
    a.status,
    a.image,
    a.description
`;

router.get(
  "/",
  async (
    _request,
    response
  ) => {
    try {
      const result =
        await getDbPool().query<ArtworkRow>(
          `${artworkSelect}
           ${artworkGroupBy}
           order by a.created_at asc, a.id asc`
        );

      return response.json({
        ok: true,
        artworks:
          result.rows.map(
            toArtwork
          ),
      });
    } catch (error) {
      console.error(
        "SOYO artworks list error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load artworks.",
        });
    }
  }
);

router.get(
  "/:id",
  async (
    request,
    response
  ) => {
    try {
      const artworkId =
        request.params.id;

      const result =
        await getDbPool().query<ArtworkRow>(
          `${artworkSelect}
           where a.id = $1
           ${artworkGroupBy}
           limit 1`,
          [artworkId]
        );

      const row =
        result.rows[0];

      if (!row) {
        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Artwork could not be found.",
          });
      }

      return response.json({
        ok: true,
        artwork:
          toArtwork(row),
      });
    } catch (error) {
      console.error(
        "SOYO artwork detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the artwork.",
        });
    }
  }
);

export default router;

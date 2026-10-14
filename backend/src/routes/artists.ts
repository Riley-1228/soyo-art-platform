import {
  Router,
} from "express";

import {
  getDbPool,
} from "../db";

type ArtistRow = {
  id: string;
  name: string;
  location: string | null;
  discipline: string | null;
  image: string | null;
  statement: string | null;
  bio: string | null;
  artwork_ids: string[] | null;
  exhibition_ids: string[] | null;
};

const router =
  Router();

function toArtist(
  row: ArtistRow
) {
  return {
    id: row.id,
    name: row.name,
    location:
      row.location || "",
    discipline:
      row.discipline || "",
    image:
      row.image || "",
    statement:
      row.statement || "",
    bio:
      row.bio || "",
    artworkIds:
      Array.isArray(
        row.artwork_ids
      )
        ? row.artwork_ids
        : [],
    exhibitionIds:
      Array.isArray(
        row.exhibition_ids
      )
        ? row.exhibition_ids
        : [],
  };
}

const artistSelect = `
  select
    ar.id,
    ar.name,
    ar.location,
    ar.discipline,
    ar.image,
    ar.statement,
    ar.bio,
    coalesce(
      (
        select json_agg(
          a.id
          order by a.created_at asc, a.id asc
        )
        from artworks a
        where a.artist_id = ar.id
      ),
      '[]'::json
    ) as artwork_ids,
    coalesce(
      (
        select json_agg(
          ea.exhibition_id
          order by ea.sort_order asc, ea.exhibition_id asc
        )
        from exhibition_artists ea
        where ea.artist_id = ar.id
      ),
      '[]'::json
    ) as exhibition_ids
  from artists ar
`;

router.get(
  "/",
  async (
    _request,
    response
  ) => {
    try {
      const result =
        await getDbPool().query<ArtistRow>(
          `${artistSelect}
           order by ar.created_at asc, ar.id asc`
        );

      return response.json({
        ok: true,
        artists:
          result.rows.map(
            toArtist
          ),
      });
    } catch (error) {
      console.error(
        "SOYO artists list error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load artists.",
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
      const artistId =
        request.params.id;

      const result =
        await getDbPool().query<ArtistRow>(
          `${artistSelect}
           where ar.id = $1
           limit 1`,
          [artistId]
        );

      const row =
        result.rows[0];

      if (!row) {
        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Artist could not be found.",
          });
      }

      return response.json({
        ok: true,
        artist:
          toArtist(row),
      });
    } catch (error) {
      console.error(
        "SOYO artist detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the artist.",
        });
    }
  }
);

export default router;

import {
  Router,
} from "express";

import {
  getDbPool,
} from "../db";

type ExhibitionRow = {
  id: string;
  room_number: string;
  title: string;
  description: string | null;
  image: string | null;
  note: string | null;
  period: string | null;
  curatorial_note: string | null;
  artist_ids: string[] | null;
  artwork_ids: string[] | null;
};

const router =
  Router();

function toExhibition(
  row: ExhibitionRow
) {
  return {
    id: row.id,
    number:
      row.room_number,
    title: row.title,
    description:
      row.description || "",
    image:
      row.image || "",
    note:
      row.note || "",
    period:
      row.period || "",
    curatorialNote:
      row.curatorial_note || "",
    artistIds:
      Array.isArray(
        row.artist_ids
      )
        ? row.artist_ids
        : [],
    artworkIds:
      Array.isArray(
        row.artwork_ids
      )
        ? row.artwork_ids
        : [],
  };
}

const exhibitionSelect = `
  select
    e.id,
    e.room_number,
    e.title,
    e.description,
    e.image,
    e.note,
    e.period,
    e.curatorial_note,
    coalesce(
      (
        select json_agg(
          ea.artist_id
          order by ea.sort_order asc, ea.artist_id asc
        )
        from exhibition_artists ea
        where ea.exhibition_id = e.id
      ),
      '[]'::json
    ) as artist_ids,
    coalesce(
      (
        select json_agg(
          ew.artwork_id
          order by ew.sort_order asc, ew.artwork_id asc
        )
        from exhibition_artworks ew
        where ew.exhibition_id = e.id
      ),
      '[]'::json
    ) as artwork_ids
  from exhibitions e
`;

router.get(
  "/",
  async (
    _request,
    response
  ) => {
    try {
      const result =
        await getDbPool().query<ExhibitionRow>(
          `${exhibitionSelect}
           order by e.room_number asc, e.id asc`
        );

      return response.json({
        ok: true,
        exhibitions:
          result.rows.map(
            toExhibition
          ),
      });
    } catch (error) {
      console.error(
        "SOYO exhibitions list error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load exhibitions.",
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
      const exhibitionId =
        request.params.id;

      const result =
        await getDbPool().query<ExhibitionRow>(
          `${exhibitionSelect}
           where e.id = $1
           limit 1`,
          [exhibitionId]
        );

      const row =
        result.rows[0];

      if (!row) {
        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Exhibition could not be found.",
          });
      }

      return response.json({
        ok: true,
        exhibition:
          toExhibition(row),
      });
    } catch (error) {
      console.error(
        "SOYO exhibition detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the exhibition.",
        });
    }
  }
);

export default router;

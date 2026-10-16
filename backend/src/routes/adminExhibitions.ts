import {
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import {
  del,
  put,
} from "@vercel/blob";
import multer from "multer";

import type {
  PoolClient,
} from "pg";

import {
  getDbPool,
} from "../db";

import {
  requireAdmin,
} from "../services/adminAuth";

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

type ExhibitionPayload = {
  id?: unknown;
  number?: unknown;
  title?: unknown;
  description?: unknown;
  image?: unknown;
  note?: unknown;
  period?: unknown;
  curatorialNote?: unknown;
  artistIds?: unknown;
  artworkIds?: unknown;
};

const router =
  Router();

router.use(
  requireAdmin
);

const MAX_IMAGE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

const imageUpload =
  multer({
    storage:
      multer.memoryStorage(),
    limits: {
      fileSize:
        MAX_IMAGE_BYTES,
      files: 1,
    },
    fileFilter(
      _request,
      file,
      callback
    ) {
      if (
        !ALLOWED_IMAGE_TYPES.has(
          file.mimetype
        )
      ) {
        callback(
          new Error(
            "Only JPG, PNG, WEBP and AVIF images are allowed."
          )
        );
        return;
      }

      callback(
        null,
        true
      );
    },
  })
    .single("image");

function handleImageUpload(
  request: Request,
  response: Response,
  next: NextFunction
) {
  imageUpload(
    request,
    response,
    (error) => {
      if (!error) {
        next();
        return;
      }

      if (
        error instanceof
          multer.MulterError &&
        error.code ===
          "LIMIT_FILE_SIZE"
      ) {
        response
          .status(413)
          .json({
            ok: false,
            error:
              "Image must be 10 MB or smaller.",
          });
        return;
      }

      response
        .status(400)
        .json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "The image could not be uploaded.",
        });
    }
  );
}

function getBlobToken() {
  const token =
    process.env
      .BLOB_READ_WRITE_TOKEN
      ?.trim();

  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured."
    );
  }

  return token;
}

function safeFileName(
  originalName: string
) {
  const cleaned =
    originalName
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9._-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        ""
      );

  return (
    cleaned ||
    "exhibition-image"
  );
}

function isPublicBlobUrl(
  value: string
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" &&
      url.hostname.endsWith(
        ".public.blob.vercel-storage.com"
      )
    );
  } catch {
    return false;
  }
}

async function deleteBlobBestEffort(
  url: string | null
) {
  if (
    !url ||
    !isPublicBlobUrl(url)
  ) {
    return;
  }

  try {
    await del(
      url,
      {
        token:
          getBlobToken(),
      }
    );
  } catch (error) {
    console.error(
      "SOYO exhibition image cleanup warning:",
      error
    );
  }
}

function cleanRequiredText(
  value: unknown,
  maxLength: number
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength
    );
}

function cleanOptionalText(
  value: unknown,
  maxLength: number
) {
  const cleaned =
    cleanRequiredText(
      value,
      maxLength
    );

  return cleaned || null;
}

function cleanIdList(
  value: unknown
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const cleaned =
    value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map(
        (item) =>
          item
            .trim()
            .slice(0, 120)
      )
      .filter(Boolean);

  return [
    ...new Set(cleaned),
  ];
}

function toExhibition(
  row: ExhibitionRow
) {
  return {
    id:
      row.id,
    number:
      row.room_number,
    title:
      row.title,
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
  SELECT
    e.id,
    e.room_number,
    e.title,
    e.description,
    e.image,
    e.note,
    e.period,
    e.curatorial_note,
    COALESCE(
      (
        SELECT json_agg(
          ea.artist_id
          ORDER BY
            ea.sort_order ASC,
            ea.artist_id ASC
        )
        FROM exhibition_artists AS ea
        WHERE ea.exhibition_id = e.id
      ),
      '[]'::json
    ) AS artist_ids,
    COALESCE(
      (
        SELECT json_agg(
          ew.artwork_id
          ORDER BY
            ew.sort_order ASC,
            ew.artwork_id ASC
        )
        FROM exhibition_artworks AS ew
        WHERE ew.exhibition_id = e.id
      ),
      '[]'::json
    ) AS artwork_ids
  FROM exhibitions AS e
`;

async function getExhibitionById(
  client: PoolClient,
  exhibitionId: string
) {
  const result =
    await client.query<ExhibitionRow>(
      `${exhibitionSelect}
       WHERE e.id = $1
       LIMIT 1`,
      [
        exhibitionId,
      ]
    );

  return result.rows[0];
}

function validateExhibitionPayload(
  body: ExhibitionPayload,
  includeId: boolean
) {
  const id =
    includeId
      ? cleanRequiredText(
          body.id,
          120
        )
      : "";

  const number =
    cleanRequiredText(
      body.number,
      40
    );

  const title =
    cleanRequiredText(
      body.title,
      240
    );

  const description =
    cleanOptionalText(
      body.description,
      3000
    );

  const image =
    cleanRequiredText(
      body.image,
      2000
    );

  const note =
    cleanOptionalText(
      body.note,
      1000
    );

  const period =
    cleanOptionalText(
      body.period,
      300
    );

  const curatorialNote =
    cleanOptionalText(
      body.curatorialNote,
      10000
    );

  const artistIds =
    cleanIdList(
      body.artistIds
    );

  const artworkIds =
    cleanIdList(
      body.artworkIds
    );

  if (
    includeId &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      id
    )
  ) {
    return {
      ok: false as const,
      error:
        "Exhibition ID must use lowercase letters, numbers and hyphens only.",
    };
  }

  if (
    !number ||
    !title
  ) {
    return {
      ok: false as const,
      error:
        "Room number and title are required.",
    };
  }

  if (!image) {
    return {
      ok: false as const,
      error:
        "Exhibition image is required.",
    };
  }

  if (
    artistIds === null ||
    artworkIds === null
  ) {
    return {
      ok: false as const,
      error:
        "Artist and artwork selections must be arrays.",
    };
  }

  return {
    ok: true as const,
    value: {
      id,
      number,
      title,
      description,
      image,
      note,
      period,
      curatorialNote,
      artistIds,
      artworkIds,
    },
  };
}

async function validateRelations(
  client: PoolClient,
  artistIds: string[],
  artworkIds: string[]
) {
  if (artistIds.length > 0) {
    const artistResult =
      await client.query<{
        id: string;
      }>(
        `
          SELECT id
          FROM artists
          WHERE id = ANY($1::text[])
        `,
        [
          artistIds,
        ]
      );

    const found =
      new Set(
        artistResult.rows.map(
          (row) => row.id
        )
      );

    const missing =
      artistIds.filter(
        (id) =>
          !found.has(id)
      );

    if (missing.length > 0) {
      return {
        ok: false as const,
        error:
          `Selected artist could not be found: ${missing[0]}`,
      };
    }
  }

  if (artworkIds.length > 0) {
    const artworkResult =
      await client.query<{
        id: string;
        artist_id: string;
      }>(
        `
          SELECT
            id,
            artist_id
          FROM artworks
          WHERE id = ANY($1::text[])
        `,
        [
          artworkIds,
        ]
      );

    const found =
      new Map<string, string>(
        artworkResult.rows.map(
          (row) => [
            row.id,
            row.artist_id,
          ] as [string, string]
        )
      );

    const missing =
      artworkIds.filter(
        (id) =>
          !found.has(id)
      );

    if (missing.length > 0) {
      return {
        ok: false as const,
        error:
          `Selected artwork could not be found: ${missing[0]}`,
      };
    }

    const artistSet =
      new Set(artistIds);

    const inconsistent =
      artworkIds.find(
        (id) => {
          const artistId =
            found.get(id);

          return (
            !artistId ||
            !artistSet.has(
              artistId
            )
          );
        }
      );

    if (inconsistent) {
      return {
        ok: false as const,
        error:
          "Each selected artwork's artist must also be included in the exhibition.",
      };
    }
  }

  return {
    ok: true as const,
  };
}

async function replaceRelations(
  client: PoolClient,
  exhibitionId: string,
  artistIds: string[],
  artworkIds: string[]
) {
  await client.query(
    `
      DELETE FROM exhibition_artists
      WHERE exhibition_id = $1
    `,
    [
      exhibitionId,
    ]
  );

  await client.query(
    `
      DELETE FROM exhibition_artworks
      WHERE exhibition_id = $1
    `,
    [
      exhibitionId,
    ]
  );

  if (artistIds.length > 0) {
    await client.query(
      `
        INSERT INTO exhibition_artists (
          exhibition_id,
          artist_id,
          sort_order
        )
        SELECT
          $1,
          item.id,
          (item.ordinality - 1)::integer
        FROM unnest($2::text[])
          WITH ORDINALITY AS item(id, ordinality)
      `,
      [
        exhibitionId,
        artistIds,
      ]
    );
  }

  if (artworkIds.length > 0) {
    await client.query(
      `
        INSERT INTO exhibition_artworks (
          exhibition_id,
          artwork_id,
          sort_order
        )
        SELECT
          $1,
          item.id,
          (item.ordinality - 1)::integer
        FROM unnest($2::text[])
          WITH ORDINALITY AS item(id, ordinality)
      `,
      [
        exhibitionId,
        artworkIds,
      ]
    );
  }
}

router.post(
  "/upload-image",
  handleImageUpload,
  async (
    request,
    response
  ) => {
    try {
      if (!request.file) {
        return response
          .status(400)
          .json({
            ok: false,
            error:
              "Please choose an image file.",
          });
      }

      const pathname =
        `soyo/exhibitions/${Date.now()}-${safeFileName(
          request.file.originalname
        )}`;

      const arrayBuffer =
        request.file.buffer.buffer.slice(
          request.file.buffer.byteOffset,
          request.file.buffer.byteOffset +
            request.file.buffer.byteLength
        ) as ArrayBuffer;

      const blob =
        await put(
          pathname,
          arrayBuffer,
          {
            access:
              "public",
            addRandomSuffix:
              true,
            contentType:
              request.file.mimetype,
            token:
              getBlobToken(),
          }
        );

      return response
        .status(201)
        .json({
          ok: true,
          url:
            blob.url,
          pathname:
            blob.pathname,
          contentType:
            blob.contentType,
        });
    } catch (error) {
      console.error(
        "SOYO exhibition image upload error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "The exhibition image could not be uploaded.",
        });
    }
  }
);

router.delete(
  "/upload-image",
  async (
    request,
    response
  ) => {
    const url =
      cleanRequiredText(
        request.body?.url,
        2000
      );

    if (
      !url ||
      !isPublicBlobUrl(url)
    ) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            "A valid SOYO Blob image URL is required.",
        });
    }

    try {
      await del(
        url,
        {
          token:
            getBlobToken(),
        }
      );

      return response.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "SOYO exhibition image cleanup error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "The uploaded image could not be removed.",
        });
    }
  }
);

router.get(
  "/",
  async (
    _request,
    response
  ) => {
    try {
      const result =
        await getDbPool()
          .query<ExhibitionRow>(
            `${exhibitionSelect}
             ORDER BY
               e.room_number ASC,
               e.created_at ASC,
               e.id ASC`
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
        "SOYO admin exhibitions list error:",
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
    const client =
      await getDbPool()
        .connect();

    try {
      const row =
        await getExhibitionById(
          client,
          request.params.id
        );

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
        "SOYO admin exhibition detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the exhibition.",
        });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/",
  async (
    request,
    response
  ) => {
    const parsed =
      validateExhibitionPayload(
        request.body as ExhibitionPayload,
        true
      );

    if (!parsed.ok) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            parsed.error,
        });
    }

    const exhibition =
      parsed.value;

    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      const relationCheck =
        await validateRelations(
          client,
          exhibition.artistIds,
          exhibition.artworkIds
        );

      if (!relationCheck.ok) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(400)
          .json({
            ok: false,
            error:
              relationCheck.error,
          });
      }

      await client.query(
        `
          INSERT INTO exhibitions (
            id,
            room_number,
            title,
            description,
            image,
            note,
            period,
            curatorial_note
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
        `,
        [
          exhibition.id,
          exhibition.number,
          exhibition.title,
          exhibition.description,
          exhibition.image,
          exhibition.note,
          exhibition.period,
          exhibition.curatorialNote,
        ]
      );

      await replaceRelations(
        client,
        exhibition.id,
        exhibition.artistIds,
        exhibition.artworkIds
      );

      const created =
        await getExhibitionById(
          client,
          exhibition.id
        );

      await client.query(
        "COMMIT"
      );

      return response
        .status(201)
        .json({
          ok: true,
          exhibition:
            created
              ? toExhibition(
                  created
                )
              : null,
        });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {
        // Ignore rollback failures.
      }

      const databaseError =
        error as {
          code?: string;
        };

      if (
        databaseError.code ===
        "23505"
      ) {
        return response
          .status(409)
          .json({
            ok: false,
            error:
              "That exhibition ID is already in use.",
          });
      }

      console.error(
        "SOYO admin exhibition create error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not create the exhibition.",
        });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/:id",
  async (
    request,
    response
  ) => {
    const parsed =
      validateExhibitionPayload(
        request.body as ExhibitionPayload,
        false
      );

    if (!parsed.ok) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            parsed.error,
        });
    }

    const exhibition =
      parsed.value;

    const client =
      await getDbPool()
        .connect();

    let oldImage:
      | string
      | null = null;

    try {
      await client.query(
        "BEGIN"
      );

      const existing =
        await client.query<{
          image: string | null;
        }>(
          `
            SELECT image
            FROM exhibitions
            WHERE id = $1
            LIMIT 1
          `,
          [
            request.params.id,
          ]
        );

      if (
        existing.rowCount !== 1
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Exhibition could not be found.",
          });
      }

      oldImage =
        existing.rows[0].image;

      const relationCheck =
        await validateRelations(
          client,
          exhibition.artistIds,
          exhibition.artworkIds
        );

      if (!relationCheck.ok) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(400)
          .json({
            ok: false,
            error:
              relationCheck.error,
          });
      }

      await client.query(
        `
          UPDATE exhibitions
          SET
            room_number = $2,
            title = $3,
            description = $4,
            image = $5,
            note = $6,
            period = $7,
            curatorial_note = $8,
            updated_at = now()
          WHERE id = $1
        `,
        [
          request.params.id,
          exhibition.number,
          exhibition.title,
          exhibition.description,
          exhibition.image,
          exhibition.note,
          exhibition.period,
          exhibition.curatorialNote,
        ]
      );

      await replaceRelations(
        client,
        request.params.id,
        exhibition.artistIds,
        exhibition.artworkIds
      );

      const updated =
        await getExhibitionById(
          client,
          request.params.id
        );

      await client.query(
        "COMMIT"
      );

      if (
        oldImage &&
        oldImage !==
          exhibition.image
      ) {
        void deleteBlobBestEffort(
          oldImage
        );
      }

      return response.json({
        ok: true,
        exhibition:
          updated
            ? toExhibition(
                updated
              )
            : null,
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {
        // Ignore rollback failures.
      }

      console.error(
        "SOYO admin exhibition update error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not update the exhibition.",
        });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:id",
  async (
    request,
    response
  ) => {
    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      const existing =
        await client.query<{
          image: string | null;
        }>(
          `
            SELECT image
            FROM exhibitions
            WHERE id = $1
            LIMIT 1
          `,
          [
            request.params.id,
          ]
        );

      if (
        existing.rowCount !== 1
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Exhibition could not be found.",
          });
      }

      await client.query(
        `
          DELETE FROM exhibitions
          WHERE id = $1
        `,
        [
          request.params.id,
        ]
      );

      await client.query(
        "COMMIT"
      );

      void deleteBlobBestEffort(
        existing.rows[0].image
      );

      return response.json({
        ok: true,
        deletedId:
          request.params.id,
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {
        // Ignore rollback failures.
      }

      console.error(
        "SOYO admin exhibition delete error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not delete the exhibition.",
        });
    } finally {
      client.release();
    }
  }
);

export default router;

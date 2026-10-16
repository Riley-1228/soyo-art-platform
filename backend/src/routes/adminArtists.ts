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

type ArtistPayload = {
  id?: unknown;
  name?: unknown;
  location?: unknown;
  discipline?: unknown;
  image?: unknown;
  statement?: unknown;
  bio?: unknown;
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
    "artist-image"
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
      "SOYO artist image cleanup warning:",
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

function toArtist(
  row: ArtistRow
) {
  return {
    id:
      row.id,
    name:
      row.name,
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
  SELECT
    ar.id,
    ar.name,
    ar.location,
    ar.discipline,
    ar.image,
    ar.statement,
    ar.bio,
    COALESCE(
      (
        SELECT json_agg(
          a.id
          ORDER BY a.created_at ASC, a.id ASC
        )
        FROM artworks AS a
        WHERE a.artist_id = ar.id
      ),
      '[]'::json
    ) AS artwork_ids,
    COALESCE(
      (
        SELECT json_agg(
          ea.exhibition_id
          ORDER BY ea.sort_order ASC, ea.exhibition_id ASC
        )
        FROM exhibition_artists AS ea
        WHERE ea.artist_id = ar.id
      ),
      '[]'::json
    ) AS exhibition_ids
  FROM artists AS ar
`;

async function getArtistById(
  client: PoolClient,
  artistId: string
) {
  const result =
    await client.query<ArtistRow>(
      `${artistSelect}
       WHERE ar.id = $1
       LIMIT 1`,
      [
        artistId,
      ]
    );

  return result.rows[0];
}

function validateArtistPayload(
  body: ArtistPayload,
  includeId: boolean
) {
  const id =
    includeId
      ? cleanRequiredText(
          body.id,
          120
        )
      : "";

  const name =
    cleanRequiredText(
      body.name,
      240
    );

  const location =
    cleanOptionalText(
      body.location,
      200
    );

  const discipline =
    cleanOptionalText(
      body.discipline,
      200
    );

  const image =
    cleanRequiredText(
      body.image,
      2000
    );

  const statement =
    cleanOptionalText(
      body.statement,
      3000
    );

  const bio =
    cleanOptionalText(
      body.bio,
      10000
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
        "Artist ID must use lowercase letters, numbers and hyphens only.",
    };
  }

  if (!name) {
    return {
      ok: false as const,
      error:
        "Artist name is required.",
    };
  }

  if (!image) {
    return {
      ok: false as const,
      error:
        "Artist image is required.",
    };
  }

  return {
    ok: true as const,
    value: {
      id,
      name,
      location,
      discipline,
      image,
      statement,
      bio,
    },
  };
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
        `soyo/artists/${Date.now()}-${safeFileName(
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
        "SOYO artist image upload error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "The artist image could not be uploaded.",
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
        "SOYO artist image cleanup error:",
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
          .query<ArtistRow>(
            `${artistSelect}
             ORDER BY
               ar.updated_at DESC,
               ar.created_at DESC,
               ar.id ASC`
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
        "SOYO admin artists list error:",
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
    const client =
      await getDbPool()
        .connect();

    try {
      const row =
        await getArtistById(
          client,
          request.params.id
        );

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
        "SOYO admin artist detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the artist.",
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
      validateArtistPayload(
        request.body as ArtistPayload,
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

    const artist =
      parsed.value;

    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      await client.query(
        `
          INSERT INTO artists (
            id,
            name,
            location,
            discipline,
            image,
            statement,
            bio
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          artist.id,
          artist.name,
          artist.location,
          artist.discipline,
          artist.image,
          artist.statement,
          artist.bio,
        ]
      );

      const created =
        await getArtistById(
          client,
          artist.id
        );

      await client.query(
        "COMMIT"
      );

      return response
        .status(201)
        .json({
          ok: true,
          artist:
            created
              ? toArtist(
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
              "That artist ID is already in use.",
          });
      }

      console.error(
        "SOYO admin artist create error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not create the artist.",
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
      validateArtistPayload(
        request.body as ArtistPayload,
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

    const artist =
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
            FROM artists
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
              "Artist could not be found.",
          });
      }

      oldImage =
        existing.rows[0].image;

      await client.query(
        `
          UPDATE artists
          SET
            name = $2,
            location = $3,
            discipline = $4,
            image = $5,
            statement = $6,
            bio = $7,
            updated_at = now()
          WHERE id = $1
        `,
        [
          request.params.id,
          artist.name,
          artist.location,
          artist.discipline,
          artist.image,
          artist.statement,
          artist.bio,
        ]
      );

      const updated =
        await getArtistById(
          client,
          request.params.id
        );

      await client.query(
        "COMMIT"
      );

      if (
        oldImage &&
        oldImage !==
          artist.image
      ) {
        void deleteBlobBestEffort(
          oldImage
        );
      }

      return response.json({
        ok: true,
        artist:
          updated
            ? toArtist(
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
        "SOYO admin artist update error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not update the artist.",
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

      const artistResult =
        await client.query<{
          image: string | null;
        }>(
          `
            SELECT image
            FROM artists
            WHERE id = $1
            LIMIT 1
          `,
          [
            request.params.id,
          ]
        );

      if (
        artistResult.rowCount !== 1
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Artist could not be found.",
          });
      }

      const linkedWorks =
        await client.query<{
          count: string;
        }>(
          `
            SELECT count(*)::text AS count
            FROM artworks
            WHERE artist_id = $1
          `,
          [
            request.params.id,
          ]
        );

      const artworkCount =
        Number(
          linkedWorks.rows[0]
            ?.count || "0"
        );

      if (
        artworkCount > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(409)
          .json({
            ok: false,
            error:
              `This artist is linked to ${artworkCount} artwork${artworkCount === 1 ? "" : "s"}. Reassign or delete those works first.`,
          });
      }

      await client.query(
        `
          DELETE FROM artists
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
        artistResult.rows[0]
          .image
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

      const databaseError =
        error as {
          code?: string;
        };

      if (
        databaseError.code ===
        "23503"
      ) {
        return response
          .status(409)
          .json({
            ok: false,
            error:
              "This artist is still linked to another SOYO record.",
          });
      }

      console.error(
        "SOYO admin artist delete error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not delete the artist.",
        });
    } finally {
      client.release();
    }
  }
);

export default router;

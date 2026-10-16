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

type ArtworkPayload = {
  id?: unknown;
  title?: unknown;
  artistId?: unknown;
  location?: unknown;
  year?: unknown;
  material?: unknown;
  dimensions?: unknown;
  category?: unknown;
  edition?: unknown;
  priceAmount?: unknown;
  currency?: unknown;
  status?: unknown;
  image?: unknown;
  description?: unknown;
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
    "artwork-image"
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

function cleanCurrency(
  value: unknown
) {
  const currency =
    cleanRequiredText(
      value,
      3
    )
      .toUpperCase();

  return /^[A-Z]{3}$/.test(
    currency
  )
    ? currency
    : "";
}

function cleanStatus(
  value: unknown
):
  | ArtworkStatus
  | "" {
  if (
    value === "available" ||
    value === "reserved" ||
    value === "sold"
  ) {
    return value;
  }

  return "";
}

function parsePriceAmount(
  value: unknown
):
  | {
      ok: true;
      value: number | null;
    }
  | {
      ok: false;
      value: null;
    } {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return {
      ok: true,
      value: null,
    };
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return {
      ok: false,
      value: null,
    };
  }

  return {
    ok: true,
    value: parsed,
  };
}

function formatPrice(
  priceAmount: number | null,
  currency: string
) {
  if (
    priceAmount === null
  ) {
    return "Price on request";
  }

  if (
    currency === "KRW"
  ) {
    return `₩${Math.round(
      priceAmount
    ).toLocaleString(
      "ko-KR"
    )}`;
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",
        currency,
        maximumFractionDigits:
          2,
      }
    ).format(
      priceAmount
    );
  } catch {
    return `${currency} ${priceAmount.toLocaleString(
      "en-US"
    )}`;
  }
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
    id:
      row.id,
    title:
      row.title,
    artist:
      row.artist,
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
    price:
      formatPrice(
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
  SELECT
    a.id,
    a.title,
    a.artist_id,
    ar.name AS artist,
    a.location,
    a.year,
    a.material,
    a.dimensions,
    a.category,
    a.edition,
    a.price_amount::text AS price_amount,
    a.currency,
    a.status,
    a.image,
    a.description,
    COALESCE(
      json_agg(
        ea.exhibition_id
        ORDER BY ea.sort_order
      ) FILTER (
        WHERE ea.exhibition_id IS NOT NULL
      ),
      '[]'::json
    ) AS exhibition_ids
  FROM artworks AS a
  INNER JOIN artists AS ar
    ON ar.id = a.artist_id
  LEFT JOIN exhibition_artworks AS ea
    ON ea.artwork_id = a.id
`;

const artworkGroupBy = `
  GROUP BY
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

async function getArtworkById(
  client: PoolClient,
  artworkId: string
) {
  const result =
    await client.query<ArtworkRow>(
      `${artworkSelect}
       WHERE a.id = $1
       ${artworkGroupBy}
       LIMIT 1`,
      [
        artworkId,
      ]
    );

  return result.rows[0];
}

async function artistExists(
  client: PoolClient,
  artistId: string
) {
  const result =
    await client.query(
      `
        SELECT id
        FROM artists
        WHERE id = $1
        LIMIT 1
      `,
      [
        artistId,
      ]
    );

  return (
    result.rowCount === 1
  );
}

function validateArtworkPayload(
  body: ArtworkPayload,
  includeId: boolean
) {
  const id =
    includeId
      ? cleanRequiredText(
          body.id,
          120
        )
      : "";

  const title =
    cleanRequiredText(
      body.title,
      240
    );

  const artistId =
    cleanRequiredText(
      body.artistId,
      120
    );

  const location =
    cleanOptionalText(
      body.location,
      160
    );

  const year =
    cleanOptionalText(
      body.year,
      40
    );

  const material =
    cleanOptionalText(
      body.material,
      300
    );

  const dimensions =
    cleanOptionalText(
      body.dimensions,
      160
    );

  const category =
    cleanOptionalText(
      body.category,
      120
    );

  const edition =
    cleanOptionalText(
      body.edition,
      120
    );

  const price =
    parsePriceAmount(
      body.priceAmount
    );

  const currency =
    cleanCurrency(
      body.currency ?? "KRW"
    );

  const status =
    cleanStatus(
      body.status ?? "available"
    );

  const image =
    cleanRequiredText(
      body.image,
      1000
    );

  const description =
    cleanOptionalText(
      body.description,
      5000
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
        "Artwork ID must use lowercase letters, numbers and hyphens only.",
    };
  }

  if (
    !title ||
    !artistId
  ) {
    return {
      ok: false as const,
      error:
        "Title and artist are required.",
    };
  }

  if (!image) {
    return {
      ok: false as const,
      error:
        "Artwork image is required.",
    };
  }

  if (!price.ok) {
    return {
      ok: false as const,
      error:
        "Price must be zero or a positive number.",
    };
  }

  if (!currency) {
    return {
      ok: false as const,
      error:
        "Currency must be a 3-letter code such as KRW or USD.",
    };
  }

  if (!status) {
    return {
      ok: false as const,
      error:
        "Artwork status is invalid.",
    };
  }

  return {
    ok: true as const,
    value: {
      id,
      title,
      artistId,
      location,
      year,
      material,
      dimensions,
      category,
      edition,
      priceAmount:
        price.value,
      currency,
      status,
      image,
      description,
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

      const token =
        getBlobToken();

      const pathname =
        `soyo/works/${Date.now()}-${safeFileName(
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
            token,
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
        "SOYO artwork image upload error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "The artwork image could not be uploaded.",
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
      !isPublicBlobUrl(
        url
      )
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
        "SOYO artwork image cleanup error:",
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
          .query<ArtworkRow>(
            `${artworkSelect}
             ${artworkGroupBy}
             ORDER BY
               a.updated_at DESC,
               a.created_at DESC,
               a.id ASC`
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
        "SOYO admin artworks list error:",
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
    const client =
      await getDbPool()
        .connect();

    try {
      const row =
        await getArtworkById(
          client,
          request.params.id
        );

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
        "SOYO admin artwork detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the artwork.",
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
      validateArtworkPayload(
        request.body as ArtworkPayload,
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

    const artwork =
      parsed.value;

    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      if (
        !await artistExists(
          client,
          artwork.artistId
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(400)
          .json({
            ok: false,
            error:
              "Selected artist could not be found.",
          });
      }

      await client.query(
        `
          INSERT INTO artworks (
            id,
            title,
            artist_id,
            location,
            year,
            material,
            dimensions,
            category,
            edition,
            price_amount,
            currency,
            status,
            image,
            description
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14
          )
        `,
        [
          artwork.id,
          artwork.title,
          artwork.artistId,
          artwork.location,
          artwork.year,
          artwork.material,
          artwork.dimensions,
          artwork.category,
          artwork.edition,
          artwork.priceAmount,
          artwork.currency,
          artwork.status,
          artwork.image,
          artwork.description,
        ]
      );

      const created =
        await getArtworkById(
          client,
          artwork.id
        );

      await client.query(
        "COMMIT"
      );

      return response
        .status(201)
        .json({
          ok: true,
          artwork:
            created
              ? toArtwork(
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
              "That artwork ID is already in use.",
          });
      }

      console.error(
        "SOYO admin artwork create error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not create the artwork.",
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
      validateArtworkPayload(
        request.body as ArtworkPayload,
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

    const artwork =
      parsed.value;

    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      const existing =
        await client.query(
          `
            SELECT id
            FROM artworks
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
              "Artwork could not be found.",
          });
      }

      if (
        !await artistExists(
          client,
          artwork.artistId
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(400)
          .json({
            ok: false,
            error:
              "Selected artist could not be found.",
          });
      }

      await client.query(
        `
          UPDATE artworks
          SET
            title = $2,
            artist_id = $3,
            location = $4,
            year = $5,
            material = $6,
            dimensions = $7,
            category = $8,
            edition = $9,
            price_amount = $10,
            currency = $11,
            status = $12,
            image = $13,
            description = $14,
            updated_at = now()
          WHERE id = $1
        `,
        [
          request.params.id,
          artwork.title,
          artwork.artistId,
          artwork.location,
          artwork.year,
          artwork.material,
          artwork.dimensions,
          artwork.category,
          artwork.edition,
          artwork.priceAmount,
          artwork.currency,
          artwork.status,
          artwork.image,
          artwork.description,
        ]
      );

      const updated =
        await getArtworkById(
          client,
          request.params.id
        );

      await client.query(
        "COMMIT"
      );

      return response.json({
        ok: true,
        artwork:
          updated
            ? toArtwork(
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
        "SOYO admin artwork update error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not update the artwork.",
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
    try {
      const result =
        await getDbPool()
          .query<{
            id: string;
          }>(
            `
              DELETE FROM artworks
              WHERE id = $1
              RETURNING id
            `,
            [
              request.params.id,
            ]
          );

      if (
        result.rowCount !== 1
      ) {
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
        deletedId:
          result.rows[0].id,
      });
    } catch (error) {
      console.error(
        "SOYO admin artwork delete error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not delete the artwork.",
        });
    }
  }
);

export default router;

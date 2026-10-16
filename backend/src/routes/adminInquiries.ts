import {
  Router,
} from "express";

import {
  getDbPool,
} from "../db";

import {
  requireAdmin,
} from "../services/adminAuth";

type InquiryStatus =
  | "new"
  | "read"
  | "replied"
  | "closed";

type InquiryRow = {
  id: string;
  artwork_id: string | null;
  artwork_title: string | null;
  artist_name: string | null;
  price_snapshot: string | null;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  status: InquiryStatus;
  internal_note: string | null;
  privacy_consent: boolean;
  privacy_consented_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const router = Router();

router.use(
  requireAdmin
);

function toInquiry(
  row: InquiryRow
) {
  return {
    id: row.id,
    artworkId:
      row.artwork_id,
    artworkTitle:
      row.artwork_title || "Deleted artwork",
    artistName:
      row.artist_name || "",
    priceSnapshot:
      row.price_snapshot || "",
    name:
      row.name,
    email:
      row.email,
    phone:
      row.phone || "",
    country:
      row.country || "",
    message:
      row.message || "",
    status:
      row.status,
    internalNote:
      row.internal_note || "",
    privacyConsent:
      row.privacy_consent,
    privacyConsentedAt:
      row.privacy_consented_at,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

function isInquiryStatus(
  value: unknown
): value is InquiryStatus {
  return (
    value === "new" ||
    value === "read" ||
    value === "replied" ||
    value === "closed"
  );
}

function cleanInternalNote(
  value: unknown
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(0, 5000);
}

function validInquiryId(
  value: string
) {
  return /^\d+$/.test(value);
}

const selectInquiry = `
  SELECT
    id::text AS id,
    artwork_id,
    artwork_title,
    artist_name,
    price_snapshot,
    name,
    email,
    phone,
    country,
    message,
    status,
    internal_note,
    privacy_consent,
    privacy_consented_at,
    created_at,
    updated_at
  FROM inquiries
`;

router.get(
  "/",
  async (
    _request,
    response
  ) => {
    try {
      const result =
        await getDbPool()
          .query<InquiryRow>(
            `${selectInquiry}
             ORDER BY
               created_at DESC,
               id DESC`
          );

      return response.json({
        ok: true,
        inquiries:
          result.rows.map(
            toInquiry
          ),
      });
    } catch (error) {
      console.error(
        "SOYO admin inquiries list error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load inquiries.",
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
    const inquiryId =
      request.params.id;

    if (
      !validInquiryId(
        inquiryId
      )
    ) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            "Inquiry ID is invalid.",
        });
    }

    try {
      const result =
        await getDbPool()
          .query<InquiryRow>(
            `${selectInquiry}
             WHERE id = $1
             LIMIT 1`,
            [inquiryId]
          );

      const inquiry =
        result.rows[0];

      if (!inquiry) {
        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Inquiry could not be found.",
          });
      }

      return response.json({
        ok: true,
        inquiry:
          toInquiry(
            inquiry
          ),
      });
    } catch (error) {
      console.error(
        "SOYO admin inquiry detail error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not load the inquiry.",
        });
    }
  }
);

router.patch(
  "/:id",
  async (
    request,
    response
  ) => {
    const inquiryId =
      request.params.id;

    if (
      !validInquiryId(
        inquiryId
      )
    ) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            "Inquiry ID is invalid.",
        });
    }

    const status =
      request.body.status;

    if (
      !isInquiryStatus(
        status
      )
    ) {
      return response
        .status(400)
        .json({
          ok: false,
          error:
            "Inquiry status is invalid.",
        });
    }

    const internalNote =
      cleanInternalNote(
        request.body.internalNote
      );

    try {
      const result =
        await getDbPool()
          .query<InquiryRow>(
            `
              UPDATE inquiries
              SET
                status = $2,
                internal_note = $3,
                updated_at = now()
              WHERE id = $1
              RETURNING
                id::text AS id,
                artwork_id,
                artwork_title,
                artist_name,
                price_snapshot,
                name,
                email,
                phone,
                country,
                message,
                status,
                internal_note,
                privacy_consent,
                privacy_consented_at,
                created_at,
                updated_at
            `,
            [
              inquiryId,
              status,
              internalNote || null,
            ]
          );

      const inquiry =
        result.rows[0];

      if (!inquiry) {
        return response
          .status(404)
          .json({
            ok: false,
            error:
              "Inquiry could not be found.",
          });
      }

      return response.json({
        ok: true,
        inquiry:
          toInquiry(
            inquiry
          ),
      });
    } catch (error) {
      console.error(
        "SOYO admin inquiry update error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          error:
            "Could not update the inquiry.",
        });
    }
  }
);

export default router;

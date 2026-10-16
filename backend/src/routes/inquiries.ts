import {
  Request,
  Response,
  Router,
} from "express";

import {
  getDbPool,
} from "../db";

import {
  sendPurchaseInquiryEmail,
} from "../services/email";

const router =
  Router();

type ArtworkRow = {
  id: string;
  title: string;
  artist_name: string;
  price_amount: string | null;
  currency: string;
  status:
    | "available"
    | "reserved"
    | "sold";
};

type InquiryRow = {
  id: string;
  created_at:
    | Date
    | string;
};

function cleanText(
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

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function formatPrice(
  priceAmount:
    | string
    | null,
  currency: string
) {
  const amount =
    Number(
      priceAmount
    );

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "Price on request";
  }

  if (
    currency === "KRW"
  ) {
    return `₩${Math.round(
      amount
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
      amount
    );
  } catch {
    return `${currency} ${amount.toLocaleString(
      "en-US"
    )}`;
  }
}

router.post(
  "/",
  async (
    request: Request,
    response: Response
  ) => {
    const artworkId =
      cleanText(
        request.body.artworkId,
        100
      );

    const name =
      cleanText(
        request.body.name,
        80
      );

    const email =
      cleanText(
        request.body.email,
        120
      );

    const phone =
      cleanText(
        request.body.phone,
        50
      );

    const country =
      cleanText(
        request.body.country,
        60
      );

    const message =
      cleanText(
        request.body.message,
        1500
      );

    const privacyConsent =
      request.body
        .privacyConsent === true;

    if (
      !artworkId ||
      !name ||
      !email ||
      !privacyConsent
    ) {
      return response
        .status(400)
        .json({
          error:
            "Please complete all required fields.",
        });
    }

    if (
      !isValidEmail(
        email
      )
    ) {
      return response
        .status(400)
        .json({
          error:
            "Please enter a valid email address.",
        });
    }

    const client =
      await getDbPool()
        .connect();

    try {
      await client.query(
        "BEGIN"
      );

      const artworkResult =
        await client.query(
          `
            SELECT
              a.id,
              a.title,
              ar.name AS artist_name,
              a.price_amount::text AS price_amount,
              a.currency,
              a.status
            FROM artworks AS a
            INNER JOIN artists AS ar
              ON ar.id = a.artist_id
            WHERE a.id = $1
            LIMIT 1
            FOR SHARE
          `,
          [
            artworkId,
          ]
        );

      const artwork =
        artworkResult
          .rows[0] as
          | ArtworkRow
          | undefined;

      if (!artwork) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(404)
          .json({
            error:
              "Artwork could not be found.",
          });
      }

      if (
        artwork.status ===
        "sold"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return response
          .status(409)
          .json({
            error:
              "This artwork is no longer available for inquiry.",
          });
      }

      const price =
        formatPrice(
          artwork.price_amount,
          artwork.currency
        );

      const inquiryResult =
        await client.query(
          `
            INSERT INTO inquiries (
              artwork_id,
              artwork_title,
              artist_name,
              price_snapshot,
              name,
              email,
              phone,
              country,
              message,
              privacy_consent,
              privacy_consented_at
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
              CASE
                WHEN $10
                THEN now()
                ELSE NULL
              END
            )
            RETURNING
              id::text AS id,
              created_at
          `,
          [
            artwork.id,
            artwork.title,
            artwork.artist_name,
            price,
            name,
            email,
            phone || null,
            country || null,
            message || null,
            privacyConsent,
          ]
        );

      const inquiry =
        inquiryResult
          .rows[0] as
          | InquiryRow
          | undefined;

      if (!inquiry) {
        throw new Error(
          "The inquiry could not be saved."
        );
      }

      const submittedAt =
        new Date(
          inquiry.created_at
        ).toLocaleString(
          "ko-KR",
          {
            timeZone:
              "Asia/Seoul",
          }
        );

      const emailResult =
        await sendPurchaseInquiryEmail({
          artworkTitle:
            artwork.title,

          artworkId:
            artwork.id,

          artist:
            artwork.artist_name,

          price,

          name,
          email,
          phone,
          country,
          message,
          submittedAt,
        });

      await client.query(
        "COMMIT"
      );

      return response
        .status(200)
        .json({
          success: true,

          inquiryId:
            inquiry.id,

          emailId:
            emailResult?.id,
        });

    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (
        rollbackError
      ) {
        console.error(
          "SOYO inquiry rollback error:",
          rollbackError
        );
      }

      console.error(
        "SOYO inquiry error:",
        error
      );

      return response
        .status(500)
        .json({
          error:
            "Something went wrong while sending the inquiry.",
        });

    } finally {
      client.release();
    }
  }
);

export default router;

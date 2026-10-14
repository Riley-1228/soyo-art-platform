import {
  Request,
  Response,
  Router,
} from "express";

import {
  artworks,
} from "../data/artworks";

import {
  sendPurchaseInquiryEmail,
} from "../services/email";

const router =
  Router();

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

router.post(
  "/",
  async (
    request: Request,
    response: Response
  ) => {
    try {
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
        !isValidEmail(email)
      ) {
        return response
          .status(400)
          .json({
            error:
              "Please enter a valid email address.",
          });
      }

      const artwork =
        artworks.find(
          (item) =>
            item.id ===
            artworkId
        );

      if (!artwork) {
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
        return response
          .status(409)
          .json({
            error:
              "This artwork is no longer available for inquiry.",
          });
      }

      const submittedAt =
        new Date()
          .toLocaleString(
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
            artwork.artist,

          price:
            artwork.price,

          name,
          email,
          phone,
          country,
          message,
          submittedAt,
        });

      return response
        .status(200)
        .json({
          success: true,
          id:
            emailResult?.id,
        });

    } catch (error) {
      console.error(
        "SOYO inquiry error:",
        error
      );

      return response
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Something went wrong while sending the inquiry.",
        });
    }
  }
);

export default router;
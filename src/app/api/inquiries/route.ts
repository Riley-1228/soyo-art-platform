import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { artworks } from "@/data/siteData";

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getResendErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Unknown Resend error.";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const inquiryToEmail = process.env.SOYO_INQUIRY_TO_EMAIL;
    const inquiryFromEmail =
      process.env.SOYO_INQUIRY_FROM_EMAIL ||
      "SOYO <onboarding@resend.dev>";

    if (!apiKey || !inquiryToEmail) {
      console.error(
        "SOYO inquiry email environment variables are missing.",
        {
          hasApiKey: Boolean(apiKey),
          hasInquiryToEmail: Boolean(inquiryToEmail),
          hasInquiryFromEmail: Boolean(
            process.env.SOYO_INQUIRY_FROM_EMAIL
          ),
        }
      );

      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? "Missing RESEND_API_KEY or SOYO_INQUIRY_TO_EMAIL in .env.local."
              : "Inquiry email service is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const artworkId = cleanText(body.artworkId, 100);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 120);
    const phone = cleanText(body.phone, 50);
    const country = cleanText(body.country, 60);
    const message = cleanText(body.message, 1500);
    const privacyConsent = body.privacyConsent === true;

    if (!artworkId || !name || !email || !privacyConsent) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const artwork = artworks.find((item) => item.id === artworkId);

    if (!artwork) {
      return NextResponse.json(
        { error: "Artwork could not be found." },
        { status: 404 }
      );
    }

    if (artwork.status === "sold") {
      return NextResponse.json(
        { error: "This artwork is no longer available for inquiry." },
        { status: 409 }
      );
    }

    const submittedAt = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "-");
    const safeCountry = escapeHtml(country || "-");
    const safeMessage = escapeHtml(
      message || "No message provided."
    ).replace(/\n/g, "<br />");
    const safeArtworkTitle = escapeHtml(artwork.title);
    const safeArtist = escapeHtml(artwork.artist);
    const safePrice = escapeHtml(artwork.price);
    const safeArtworkId = escapeHtml(artwork.id);

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: inquiryFromEmail,
      to: [inquiryToEmail],
      replyTo: email,
      subject: `[SOYO Purchase Inquiry] ${artwork.title} - ${name}`,
      html: `
        <div style="max-width:680px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;color:#211a15;background:#fbf8f2;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;color:#8a7868;">
            SOYO &middot; ART &amp; OBJECT
          </p>

          <h1 style="margin:0 0 35px;font-family:Georgia,serif;font-size:34px;font-weight:400;">
            New Purchase Inquiry
          </h1>

          <table style="width:100%;border-collapse:collapse;margin-bottom:36px;">
            <tr>
              <td style="width:140px;padding:10px 0;color:#877b70;">Artwork</td>
              <td style="padding:10px 0;">${safeArtworkTitle}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#877b70;">Artwork ID</td>
              <td style="padding:10px 0;">${safeArtworkId}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#877b70;">Artist</td>
              <td style="padding:10px 0;">${safeArtist}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#877b70;">Price</td>
              <td style="padding:10px 0;">${safePrice}</td>
            </tr>
          </table>

          <hr style="border:0;border-top:1px solid #ddd3c7;margin:0 0 30px;" />

          <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
            <tr>
              <td style="width:140px;padding:9px 0;color:#877b70;">Name</td>
              <td style="padding:9px 0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:9px 0;color:#877b70;">Email</td>
              <td style="padding:9px 0;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding:9px 0;color:#877b70;">Phone / Kakao</td>
              <td style="padding:9px 0;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding:9px 0;color:#877b70;">Country</td>
              <td style="padding:9px 0;">${safeCountry}</td>
            </tr>
            <tr>
              <td style="padding:9px 0;color:#877b70;">Submitted</td>
              <td style="padding:9px 0;">${submittedAt}</td>
            </tr>
          </table>

          <div style="padding:22px;background:#f2ece3;">
            <p style="margin:0 0 10px;font-size:11px;color:#877b70;">MESSAGE</p>
            <p style="margin:0;line-height:1.7;">${safeMessage}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      const resendMessage = getResendErrorMessage(error);

      console.error("Resend error:", error);

      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? `Resend: ${resendMessage}`
              : "The inquiry could not be sent.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
    });
  } catch (error) {
    console.error("SOYO inquiry error:", error);

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Something went wrong while sending the inquiry.",
      },
      { status: 500 }
    );
  }
}

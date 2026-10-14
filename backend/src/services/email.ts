import { Resend } from "resend";

type SendPurchaseInquiryParams = {
  artworkTitle: string;
  artworkId: string;
  artist: string;
  price: string;

  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;

  submittedAt: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[character];
    }
  );
}

export async function sendPurchaseInquiryEmail({
  artworkTitle,
  artworkId,
  artist,
  price,
  name,
  email,
  phone,
  country,
  message,
  submittedAt,
}: SendPurchaseInquiryParams) {
  const apiKey =
    process.env.RESEND_API_KEY;

  const inquiryToEmail =
    process.env.SOYO_INQUIRY_TO_EMAIL;

  const inquiryFromEmail =
    process.env.SOYO_INQUIRY_FROM_EMAIL ||
    "SOYO <onboarding@resend.dev>";

  if (!apiKey || !inquiryToEmail) {
    throw new Error(
      "SOYO email environment variables are missing."
    );
  }

  const resend =
    new Resend(apiKey);

  const safeArtworkTitle =
    escapeHtml(artworkTitle);

  const safeArtworkId =
    escapeHtml(artworkId);

  const safeArtist =
    escapeHtml(artist);

  const safePrice =
    escapeHtml(price);

  const safeName =
    escapeHtml(name);

  const safeEmail =
    escapeHtml(email);

  const safePhone =
    escapeHtml(phone || "-");

  const safeCountry =
    escapeHtml(country || "-");

  const safeMessage =
    escapeHtml(
      message || "No message provided."
    ).replace(
      /\n/g,
      "<br />"
    );

  const {
    data,
    error,
  } = await resend.emails.send({
    from: inquiryFromEmail,

    to: [
      inquiryToEmail,
    ],

    replyTo: email,

    subject:
      `[SOYO Purchase Inquiry] ${artworkTitle} - ${name}`,

    html: `
      <div
        style="
          max-width:680px;
          margin:0 auto;
          padding:40px;
          font-family:Arial,sans-serif;
          color:#211a15;
          background:#fbf8f2;
        "
      >
        <p
          style="
            margin:0 0 12px;
            font-size:11px;
            letter-spacing:2px;
            color:#8a7868;
          "
        >
          SOYO · ART &amp; OBJECT
        </p>

        <h1
          style="
            margin:0 0 35px;
            font-family:Georgia,serif;
            font-size:34px;
            font-weight:400;
          "
        >
          New Purchase Inquiry
        </h1>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:32px;
          "
        >
          <tr>
            <td style="width:140px;padding:9px 0;color:#877b70;">
              Artwork
            </td>
            <td style="padding:9px 0;">
              ${safeArtworkTitle}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Artwork ID
            </td>
            <td style="padding:9px 0;">
              ${safeArtworkId}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Artist
            </td>
            <td style="padding:9px 0;">
              ${safeArtist}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Price
            </td>
            <td style="padding:9px 0;">
              ${safePrice}
            </td>
          </tr>
        </table>

        <hr
          style="
            border:0;
            border-top:1px solid #ddd3c7;
            margin:0 0 28px;
          "
        />

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:28px;
          "
        >
          <tr>
            <td style="width:140px;padding:9px 0;color:#877b70;">
              Name
            </td>
            <td style="padding:9px 0;">
              ${safeName}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Email
            </td>
            <td style="padding:9px 0;">
              ${safeEmail}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Phone / Kakao
            </td>
            <td style="padding:9px 0;">
              ${safePhone}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Country
            </td>
            <td style="padding:9px 0;">
              ${safeCountry}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0;color:#877b70;">
              Submitted
            </td>
            <td style="padding:9px 0;">
              ${escapeHtml(submittedAt)}
            </td>
          </tr>
        </table>

        <div
          style="
            padding:22px;
            background:#f2ece3;
          "
        >
          <p
            style="
              margin:0 0 10px;
              font-size:11px;
              color:#877b70;
            "
          >
            MESSAGE
          </p>

          <p
            style="
              margin:0;
              line-height:1.7;
            "
          >
            ${safeMessage}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error(
      "Resend error:",
      error
    );

    throw new Error(
      error.message ||
        "The inquiry email could not be sent."
    );
  }

  return data;
}
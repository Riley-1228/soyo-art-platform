import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "soyo_preview_access";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const submittedPassword = String(formData.get("password") ?? "");

  const expectedPassword = process.env.SOYO_PREVIEW_PASSWORD;
  const previewToken = process.env.SOYO_PREVIEW_TOKEN;

  if (!expectedPassword || !previewToken) {
    const configErrorUrl = new URL("/preview-login?error=config", request.url);
    return NextResponse.redirect(configErrorUrl, 303);
  }

  if (submittedPassword !== expectedPassword) {
    const invalidUrl = new URL("/preview-login?error=invalid", request.url);
    return NextResponse.redirect(invalidUrl, 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set({
    name: COOKIE_NAME,
    value: previewToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

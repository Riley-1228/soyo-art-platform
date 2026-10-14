import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "soyo_preview_access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the password page and the login endpoint.
  if (
    pathname === "/preview-login" ||
    pathname.startsWith("/api/preview-login")
  ) {
    return NextResponse.next();
  }

  // Keep local development convenient when no local preview secret exists.
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.SOYO_PREVIEW_TOKEN
  ) {
    return NextResponse.next();
  }

  const expectedToken = process.env.SOYO_PREVIEW_TOKEN;
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

  if (expectedToken && cookieToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/preview-login";
  loginUrl.search = "";

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://soyo-art-platform.vercel.app"
  ),

  title: {
    default: "SOYO | Curated Art & Object",
    template: "%s | SOYO",
  },

  description:
    "SOYO is a curated art platform discovering emerging creators and human-made works from Asia.",

  applicationName: "SOYO",

  openGraph: {
    title: "SOYO | Curated Art & Object",
    description:
      "Discover emerging creators and curated works from Asia.",
    url: "/",
    siteName: "SOYO",
    type: "website",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
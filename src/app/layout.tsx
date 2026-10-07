import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOYO | Curated Art & Object",
  description: "A curated discovery platform for emerging creators and human-made works.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

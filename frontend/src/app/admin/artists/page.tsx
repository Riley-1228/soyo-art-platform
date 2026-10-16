import type {
  Metadata,
} from "next";

import AdminArtistsManager from "./AdminArtistsManager";

export const metadata: Metadata = {
  title: "Artists Admin | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminArtistsPage() {
  return <AdminArtistsManager />;
}

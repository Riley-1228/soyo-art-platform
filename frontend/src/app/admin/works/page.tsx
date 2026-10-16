import type {
  Metadata,
} from "next";

import AdminWorksManager from "./AdminWorksManager";

export const metadata: Metadata = {
  title: "Works Admin | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminWorksPage() {
  return <AdminWorksManager />;
}

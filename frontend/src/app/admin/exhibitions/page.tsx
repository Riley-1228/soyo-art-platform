import type {
  Metadata,
} from "next";

import AdminExhibitionsManager from "./AdminExhibitionsManager";

export const metadata: Metadata = {
  title: "Exhibitions Admin | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminExhibitionsPage() {
  return <AdminExhibitionsManager />;
}

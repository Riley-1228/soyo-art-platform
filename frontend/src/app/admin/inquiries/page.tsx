import type {
  Metadata,
} from "next";

import AdminInquiriesManager from "./AdminInquiriesManager";

export const metadata: Metadata = {
  title: "Inquiries Admin | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminInquiriesPage() {
  return <AdminInquiriesManager />;
}

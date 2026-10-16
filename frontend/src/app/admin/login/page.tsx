import type {
  Metadata,
} from "next";

import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}

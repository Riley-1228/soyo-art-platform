"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

type AdminAuthResponse = {
  ok?: boolean;
  authenticated?: boolean;
  admin?: {
    email?: string;
  };
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = (await response
          .json()
          .catch(() => null)) as AdminAuthResponse | null;

        if (!response.ok || !result?.authenticated) {
          router.replace("/admin/login");
          return;
        }

        if (!active) {
          return;
        }

        setAdminEmail(
          result.admin?.email || "SOYO Admin"
        );
        setChecking(false);
      } catch {
        router.replace("/admin/login");
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch(
        `${API_BASE_URL}/api/admin/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  if (checking) {
    return (
      <main className="soyo-admin-dashboard-loading">
        Checking admin session…
      </main>
    );
  }

  const sections = [
    {
      number: "01",
      label: "Works",
      description:
        "Create and manage artwork records, images, prices and availability.",
      href: "/admin/works",
      badge: "Open",
    },
    {
      number: "02",
      label: "Artists",
      description:
        "Manage artist profiles, biographies and represented works.",
      href: "/admin/artists",
      badge: "Open",
    },
    {
      number: "03",
      label: "Exhibitions",
      description:
        "Curate rooms, upload exhibition images and order participating artists and works.",
      href: "/admin/exhibitions",
      badge: "Open",
    },
    {
      number: "04",
      label: "Inquiries",
      description:
        "Review collector inquiries and follow-up status.",
      href: "/admin/inquiries",
      badge: "Open",
    },
  ];

  return (
    <main className="soyo-admin-dashboard-page">
      <header className="soyo-admin-dashboard-header">
        <div className="soyo-admin-dashboard-brand">
          <span>SOYO</span>
          <small>逍遙 · ADMIN</small>
        </div>

        <div className="soyo-admin-dashboard-actions">
          <Link
            className="soyo-admin-dashboard-public-link"
            href="/"
            target="_blank"
          >
            View public site ↗
          </Link>

          <button
            type="button"
            className="soyo-admin-dashboard-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Signing out…"
              : "Sign out"}
          </button>
        </div>
      </header>

      <section className="soyo-admin-dashboard-hero">
        <p className="soyo-admin-dashboard-eyebrow">
          ADMINISTRATION
        </p>

        <div className="soyo-admin-dashboard-hero-grid">
          <h1>
            SOYO
            <br />
            Control Room
          </h1>

          <div className="soyo-admin-dashboard-session-card">
            <span>Signed in as</span>
            <strong>{adminEmail}</strong>
            <p>Your administrator session is active.</p>
          </div>
        </div>
      </section>

      <section className="soyo-admin-dashboard-content">
        <div className="soyo-admin-dashboard-section-heading">
          <div>
            <p>CONTENT MANAGEMENT</p>
            <h2>Manage SOYO</h2>
          </div>

          <span>
            Works, Artists, Exhibitions and collector Inquiries are connected to Neon.
          </span>
        </div>

        <div className="soyo-admin-dashboard-grid">
          {sections.map((section) => {
            const content = (
              <>
                <span className="soyo-admin-dashboard-card-number">
                  {section.number}
                </span>

                <div>
                  <h3>{section.label}</h3>
                  <p>{section.description}</p>
                </div>

                <span className="soyo-admin-dashboard-coming-soon">
                  {section.badge}
                </span>
              </>
            );

            if (section.href) {
              return (
                <Link
                  className="soyo-admin-dashboard-card soyo-admin-dashboard-card-link"
                  href={section.href}
                  key={section.label}
                >
                  {content}
                </Link>
              );
            }

            return (
              <article
                className="soyo-admin-dashboard-card"
                key={section.label}
              >
                {content}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

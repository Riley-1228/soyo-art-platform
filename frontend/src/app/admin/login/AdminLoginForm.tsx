"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type AdminAuthResponse = {
  ok?: boolean;
  authenticated?: boolean;
  admin?: {
    email?: string;
  };
  error?: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

export default function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

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

        if (response.ok && active) {
          router.replace("/admin");
          return;
        }
      } catch {
        // Keep the login form available if the backend is temporarily unreachable.
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const result = (await response
        .json()
        .catch(() => null)) as AdminAuthResponse | null;

      if (!response.ok || !result?.authenticated) {
        if (response.status === 401) {
          throw new Error(
            "Email or password is incorrect."
          );
        }

        throw new Error(
          result?.error ||
            "Admin login is temporarily unavailable."
        );
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Admin login is temporarily unavailable."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="soyo-admin-login-page">
        <div className="soyo-admin-session-loading">
          Checking admin session…
        </div>
      </main>
    );
  }

  return (
    <main className="soyo-admin-login-page">
      <section className="soyo-admin-login-shell">
        <div className="soyo-admin-login-brand-panel">
          <div>
            <p className="soyo-admin-login-eyebrow">
              CURATED ART PLATFORM
            </p>

            <div className="soyo-admin-login-brand">
              SOYO
              <span>逍遙</span>
            </div>
          </div>

          <div className="soyo-admin-login-brand-copy">
            <p>
              Private administration for artworks,
              artists, exhibitions and collector
              inquiries.
            </p>
          </div>
        </div>

        <div className="soyo-admin-login-form-panel">
          <div className="soyo-admin-login-form-inner">
            <p className="soyo-admin-login-kicker">
              SOYO ADMIN
            </p>

            <h1>Sign in</h1>

            <p className="soyo-admin-login-intro">
              Enter the administrator credentials
              configured for this SOYO environment.
            </p>

            <form
              className="soyo-admin-login-form"
              onSubmit={handleSubmit}
            >
              <div className="soyo-admin-login-field">
                <label htmlFor="admin-email">
                  Email
                </label>

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="username"
                  maxLength={160}
                  required
                  autoFocus
                />
              </div>

              <div className="soyo-admin-login-field">
                <label htmlFor="admin-password">
                  Password
                </label>

                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? (
                <p
                  className="soyo-admin-login-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                className="soyo-admin-login-submit"
                type="submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "Signing in…"
                    : "Sign in"}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className="soyo-admin-login-security-note">
              Restricted to SOYO administrators.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

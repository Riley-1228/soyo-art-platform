import type { Metadata } from "next";
import styles from "./PreviewLogin.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Private Preview | SOYO",
  robots: {
    index: false,
    follow: false,
  },
};

type PreviewLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PreviewLoginPage({
  searchParams,
}: PreviewLoginPageProps) {
  const { error } = await searchParams;

  const message =
    error === "invalid"
      ? "비밀번호가 올바르지 않습니다."
      : error === "config"
        ? "접속 설정을 확인해 주세요."
        : null;

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="preview-login-title">
        <div className={styles.brand}>
          <strong>SOYO</strong>
          <span>ART &amp; OBJECT</span>
        </div>

        <div className={styles.rule} />

        <p className={styles.kicker}>PRIVATE PREVIEW</p>
        <h1 id="preview-login-title">Enter the exhibition.</h1>
        <p className={styles.description}>
          This preview is password protected.
          <br />Enter the shared password to continue.
        </p>

        <form className={styles.form} action="/api/preview-login" method="post">
          <label htmlFor="preview-password">Password</label>
          <input
            id="preview-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />

          {message ? (
            <p className={styles.error} role="alert">
              {message}
            </p>
          ) : null}

          <button type="submit">
            Enter Preview <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className={styles.note}>Private viewing access · SOYO</p>
      </section>
    </main>
  );
}

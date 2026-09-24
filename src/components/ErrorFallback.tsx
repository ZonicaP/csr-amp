"use client";

import { useEffect } from "react";
import styles from "./error-fallback.module.css";

export default function ErrorFallback({
  error,
  onRetry,
}: {
  error: Error & { digest?: string };
  onRetry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const detail = process.env.NODE_ENV === "development" ? error.message : "";

  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <img className={styles.logo} src="/amp-logo-hires.png" alt="AMP" width={168} height={46} />
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.body} role="alert">
          This page didn’t load. Try again, or go back to sign in.
        </p>
        {error.digest ? <p className={styles.digest}>Reference {error.digest}</p> : null}
        {detail ? <p className={styles.dev}>{detail}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onRetry}>
            Try again
          </button>
          <a className={styles.secondary} href="/login">
            Back to sign in
          </a>
        </div>
      </div>
    </main>
  );
}

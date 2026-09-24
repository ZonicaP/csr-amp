import Image from "next/image";
import styles from "./splash-screen.module.css";

type SplashScreenProps = {
  title?: string;
  label?: string;
  showProgress?: boolean;
  exiting?: boolean;
};

export default function SplashScreen({
  title,
  label,
  showProgress = false,
  exiting = false,
}: SplashScreenProps) {
  return (
    <div
      className={exiting ? `${styles.screen} ${styles.exit}` : styles.screen}
      role="status"
      aria-live="polite"
    >
      <Image
        className={styles.logo}
        src="/amp-logo.png"
        alt="AMP"
        width={447}
        height={447}
        priority
      />
      {title ? <p className={styles.title}>{title}</p> : null}
      {label ? <p className={styles.label}>{label}</p> : null}
      {showProgress ? <span className={styles.bar} aria-hidden="true" /> : null}
    </div>
  );
}

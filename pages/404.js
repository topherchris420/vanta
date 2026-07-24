import Head from "next/head";
import Navbar from "../components/Navbar";
import homeStyles from "../styles/Home.module.css";
import styles from "../styles/NotFound.module.css";

export default function NotFound() {
  return (
    <div className={homeStyles.container} id="top">
      <Head>
        <title>Off Signal | Vers3Dynamics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />
      <main className={styles.notFound}>
        <span className={styles.ghostCode} aria-hidden="true">
          404
        </span>
        <p className={styles.kicker}>Off signal</p>
        <h1 className={styles.title}>Lost the signal.</h1>
        <p className={styles.text}>
          The page you&apos;re looking for drifted off frequency. Everything
          else is still resonating.
        </p>
        <div className={styles.actions}>
          <a href="/" className={`${styles.ctaButton} ${styles.primaryCta}`}>
            Back to the signal
          </a>
          <a
            href="/#work"
            className={`${styles.ctaButton} ${styles.secondaryCta}`}
          >
            See the work
          </a>
        </div>
      </main>
    </div>
  );
}

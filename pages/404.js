import Head from "next/head";
import Navbar from "../components/Navbar";
import homeStyles from "../styles/Home.module.css";
import styles from "../styles/NotFound.module.css";

export default function NotFound() {
  return (
    <div className={homeStyles.container} id="top">
      <Head>
        <title>Off signal — Christopher Woodyard</title>
        <meta name="robots" content="noindex" />
      </Head>
      <a href="#main-content" className={homeStyles.skipLink}>
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className={styles.notFound}>
        <p className={styles.kicker}>Off signal</p>
        <h1 className={styles.title}>404</h1>
        <p className={styles.text}>
          Nothing is broadcasting on this frequency. The page may have moved,
          or it never existed.
        </p>
        <a href="/" className={styles.recoveryLink}>
          Back to the signal
        </a>
      </main>
    </div>
  );
}

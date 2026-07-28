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
      <a href="#main-content" className={homeStyles.skipLink}>
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className={styles.notFound}>
        <p className={styles.kicker}>Off signal</p>
        <h1 className={styles.title}>404</h1>
        <p className={styles.text}>
          The requested page is outside this frequency. Return to the active
          signal.
        </p>
        <a href="/" className={styles.recoveryLink}>
          Back to the signal
        </a>
      </main>
    </div>
  );
}

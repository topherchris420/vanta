import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from 'next/dynamic';
import Image from 'next/image'; // Added Image import

// --- Dynamically import the VantaEffect component ---
// This prevents Vanta/Three.js from being included in the server bundle
// and ensures it only runs on the client-side.
const VantaEffectNoSSR = dynamic(
  () => import('../components/VantaEffect'), // Path to your new component
  {
    ssr: false // Disable server-side rendering for this component
  }
);

export default function Home() {
  // No Vanta state or ref needed here anymore

  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="startup_1.jpg" />
        <meta name="description" content="Personal website of Christopher, founder of Vers3Dynamics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Render the dynamically imported Vanta background */}
      <VantaEffectNoSSR className={styles.background} />

      {/* Your main content area */}
      <main className={styles.main}>
        <section className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.specialText}>𝚑𝚒, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://90s.myretrotvs.com/#7XBcT41ImSI" className={styles.link}>𝓒𝓱𝓻𝓲𝓼𝓽𝓸𝓹𝓱𝓮𝓻</a>.</span>
          </h1>
        </section>

        <section className={styles.biography}>
          <p className={styles.bio}>
            <span className={styles.specialText}>𝙰Ω 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚏𝚘𝚞𝚗𝚍𝚎𝚛 𝚘𝚏 </span>
            <a href="https://vers3dynamics.io/" className={styles.link}>versᗱdynamics</a>
            <span className={styles.specialText}> 𝚊𝚗𝚍 </span>
            <a href="https://woodyard.dappling.network/" className={styles.link}>𝓼𝓸𝓵𝓾𝓽𝓲𝓸𝓷𝓼 𝓪𝓻𝓬𝓱𝓲𝓽𝓮𝓬𝓽</a>
            <a href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:f445e5e9-3437-4b3f-b264-aa4c8ab3d59c" className={styles.link}>🍎</a>
          </p>
        </section>

        <section className={styles.projects}>
          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Book</h2>
            <p className={styles.projectDesc}>
              <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/" className={styles.link}>𝓛𝓲𝓯𝓮 𝓸𝓯 𝓪 𝓛𝓲𝓷𝓮</a>
              <span className={styles.specialText}> — A poetic adventure </span>
              <a href="https://drive.google.com/file/d/14aenR92-dfkjolJBhG3iTCI3Ka6-d6sT/view?usp=drivesdk" className={styles.link}>📐</a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Art</h2>
            <p className={styles.projectDesc}>
              <a href="https://oncyber.io/stanfordgsb" className={styles.link}>𝓥𝓲𝓮𝔀 𝓱𝓮𝓻𝓮</a>
              <span className={styles.specialText}> for digital fragments in spatial computing </span>
              <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/" className={styles.link}>🖼️</a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Music</h2>
            <p className={styles.projectDesc}>
              <a href="https://chriswoodyard.bandcamp.com/" className={styles.link}>𝓐𝓾𝓭𝓲𝓽𝓸𝓻𝔂 𝓖𝓮𝓸𝓶𝓮𝓽𝓻𝔂</a>
              <span className={styles.specialText}> — Experimental sound project </span>
              <a href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk" className={styles.link}>🎹</a>
            </p>
          </div>

          <div className={styles.gifContainer}>
            <iframe
              src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY"
              className={styles.giphyEmbed}
              title="Pixel Art Animation"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </section>

        <footer className={styles.footer}>
          <p className={styles.contact}>
            <span className={styles.specialText}>𝚌𝚘𝚗𝚝𝚊𝚌𝚝 ➡️ 𝙘𝙞𝙖𝙤_𝙘𝙝𝙧𝙞𝙨@𝙥𝙧𝙤𝙩𝙤𝙣.𝙢𝙚</span>
          </p>
          <p className={styles.copyright}>
            <span className={styles.specialText}>© {new Date().getFullYear()} Vers3Dynamics</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

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
        <link rel="icon" href="Logo.jpg" />
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
            <a href="https://vers3dynamics.com/" className={styles.link}>versᗱdynamics</a>
            <span className={styles.specialText}> 𝚊𝚗𝚍 </span>
            <a href="https://fractalrooting.vercel.app/" className={styles.link}>𝓼𝓸𝓵𝓾𝓽𝓲𝓸𝓷𝓼 𝓪𝓻𝓬𝓱𝓲𝓽𝓮𝓬𝓽</a>
            <a href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:f445e5e9-3437-4b3f-b264-aa4c8ab3d59c" className={styles.link}>🍎</a>
          </p>
        </section>

        <section className={styles.featureImageSection}>
          <div className={styles.featureImageContainer}>
            <Image
              src="/surreal-sun.png"
              alt="Vers3Dynamics_logo"
              width={600}
              height={800}
              className={styles.featureImage}
              priority
            />
            <div className={styles.imageOverlay}>
              <p className={styles.imageCaption}>
                <span className={styles.specialText}>Welcome</span>
              </p>
            </div>
          </div>
        </section>

        <section className={styles.projects}>
          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Books</h2>
            <p className={styles.projectDesc}>
              <a href="https://www.amazon.com/stores/Christopher-Woodyard/author/B084ZSG4V9?ref=ap_rdr&isDramIntegrated=true&shoppingPortalEnabled=true" className={styles.link}>𝓐𝓶𝓪𝔃𝓸𝓷</a>
              <span className={styles.specialText}> — Coloring, poetry and health </span>
              <a href="https://humantouch.fun/" className={styles.link}>📐</a>
            </p>
          </div>

        <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Apps</h2>
            <p className={styles.projectDesc}>
              <a href="https://huggingface.co/ciaochris" className={styles.link}>𝓐𝓘/𝓜𝓛 𝓟𝓻𝓸𝓳𝓮𝓬𝓽𝓼</a>
              <span className={styles.specialText}> — Sound-Driven AI Wellness tools </span>
              <a href="https://drive.google.com/file/d/1JSp67crqXcUJ0bCqrpgb-2PUne-TtaVQ/view?usp=drive_link" className={styles.link}>🦾</a>
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
            <h2 className={styles.projectTitle}>Frequency</h2>
            <p className={styles.projectDesc}>
              <a href="https://woodyard.dappling.network" className={styles.link}>𝓽𝓱𝓲𝓼 𝓲𝓼 𝓪</a>
              <span className={styles.specialText}> Consciousness Engine for Patterned Meaning</span>
              <a href="https://archive.org/details/ancient-egyptian-magic-bob-brier/page/299/mode/1up" className={styles.link}>👨🏾‍💻</a>
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
            <span className={styles.specialText}>𝚌𝚘𝚗𝚝𝚊𝚌𝚝 ➡️ christopher@versdynamics.com</span>
          </p>
          <p className={styles.copyright}>
            <span className={styles.specialText}>© {new Date().getFullYear()} Vers3Dynamics</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
import Image from "next/image";

const VantaEffectNoSSR = dynamic(() => import("../components/VantaEffect"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="Logo.jpg" />
        <meta
          name="description"
          content="Personal website of Christopher, founder of Vers3Dynamics"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <VantaEffectNoSSR className={styles.background} />

      <main className={styles.main}>
        <section className={styles.header}>
          <p className={styles.kicker}>Digital creator • Founder • Writer</p>
          <h1 className={styles.title}>
            hi, my name is{" "}
            <a href="https://90s.myretrotvs.com/#7XBcT41ImSI" className={styles.link}>
              Christopher
            </a>
            .
          </h1>
          <p className={styles.subtitle}>
            Building poetic technology, wellness tools, and immersive media through
            Vers3Dynamics.
          </p>
        </section>

        <section className={styles.biography}>
          <p className={styles.bio}>
            An avid writer and founder of{" "}
            <a href="https://vers3dynamics.com/" className={styles.link}>
              versᗱdynamics
            </a>
            , the Recursive Architecture of Intelligent Nexus (R.A.I.N. Lab), and{" "}
            <a href="https://dna-music-eta.vercel.app/" className={styles.link}>
              resonance architect
            </a>
            .
            <a
              href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:f445e5e9-3437-4b3f-b264-aa4c8ab3d59c"
              className={styles.link}
            >
              {" "}🍎
            </a>
          </p>
        </section>

        <section className={styles.featureImageSection}>
          <div className={styles.featureImageContainer}>
            <Image
              src="/surreal-sun.png"
              alt="Vers3Dynamics artwork"
              width={600}
              height={800}
              className={styles.featureImage}
              priority
            />
            <div className={styles.imageOverlay}>
              <p className={styles.imageCaption}>Welcome</p>
            </div>
          </div>
        </section>

        <section className={styles.projects}>
          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Books</h2>
            <p className={styles.projectDesc}>
              <a
                href="https://www.amazon.com/stores/Christopher-Woodyard/author/B084ZSG4V9?ref=ap_rdr&isDramIntegrated=true&shoppingPortalEnabled=true"
                className={styles.link}
              >
                Amazon
              </a>
              <span className={styles.specialText}> — Coloring, poetry, and health </span>
              <a href="https://humantouch.fun/" className={styles.link}>
                📐
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Apps</h2>
            <p className={styles.projectDesc}>
              <a href="https://huggingface.co/ciaochris" className={styles.link}>
                AI/ML Projects
              </a>
              <span className={styles.specialText}> — Sound-driven AI wellness tools </span>
              <a
                href="https://drive.google.com/file/d/1JSp67crqXcUJ0bCqrpgb-2PUne-TtaVQ/view?usp=drive_link"
                className={styles.link}
              >
                🦾
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Art</h2>
            <p className={styles.projectDesc}>
              <a href="https://oncyber.io/stanfordgsb" className={styles.link}>
                View here
              </a>
              <span className={styles.specialText}>
                {" "}for digital fragments in spatial computing{" "}
              </span>
              <a
                href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/"
                className={styles.link}
              >
                🖼️
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Frequency</h2>
            <p className={styles.projectDesc}>
              <a href="https://woodyard.dappling.network" className={styles.link}>
                this is a
              </a>
              <span className={styles.specialText}>
                {" "}consciousness engine for patterned meaning
              </span>
              <a
                href="https://archive.org/details/ancient-egyptian-magic-bob-brier/page/299/mode/1up"
                className={styles.link}
              >
                👨🏾‍💻
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Music</h2>
            <p className={styles.projectDesc}>
              <a href="https://chriswoodyard.bandcamp.com/" className={styles.link}>
                Auditory Geometry
              </a>
              <span className={styles.specialText}> — Experimental sound project </span>
              <a
                href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk"
                className={styles.link}
              >
                🎹
              </a>
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
          <p className={styles.contact}>contact ➡️ christopher@vers3dynamics.com</p>
          <p className={styles.copyright}>© {new Date().getFullYear()} Vers3Dynamics</p>
        </footer>
      </main>
    </div>
  );
}

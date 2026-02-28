import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
import Image from "next/image";
import ScrollToTop from "../components/ScrollToTop";

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

      <VantaEffectNoSSR className={styles.background} aria-hidden="true" />

      <main className={styles.main}>
        <section className={styles.header}>
          <p className={styles.kicker}>Wellness tech • Founder • Writer</p>
          <h1 className={styles.title}>
            hi, my name is{" "}
            <a
              href="https://90s.myretrotvs.com/#7XBcT41ImSI"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Christopher
            </a>
            .
          </h1>
          <p className={styles.subtitle}>
            Building poetic technology, wellness apps, and immersive sound through
            Vers3Dynamics.
          </p>
        </section>

        <section className={styles.biography}>
          <p className={styles.bio}>
            An avid writer and founder of{" "}
            <a
              href="https://vers3dynamics.com/"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              versᗱdynamics
            </a>
            , the Recursive Architecture of Intelligent Nexus (R.A.I.N. Lab), and{" "}
            <a
              href="https://dna-music-eta.vercel.app/"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              resonance architect
            </a>
            .
            <a
              href="https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:f445e5e9-3437-4b3f-b264-aa4c8ab3d59c"
              className={styles.link}
              aria-label="View Resume (PDF)"
              title="View Resume (PDF)"
              target="_blank"
              rel="noopener noreferrer"
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
                target="_blank"
                rel="noopener noreferrer"
              >
                Amazon
              </a>
              <span className={styles.specialText}> — Coloring, poetry, and health </span>
              <a
                href="https://humantouch.fun/"
                className={styles.link}
                aria-label="Visit Human Touch website"
                title="Visit Human Touch website"
                target="_blank"
                rel="noopener noreferrer"
              >
                📐
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Apps</h2>
            <p className={styles.projectDesc}>
              <a
                href="https://huggingface.co/ciaochris"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                AI/ML Projects
              </a>
              <span className={styles.specialText}> — Sound-driven AI wellness tools </span>
              <a
                href="https://drive.google.com/file/d/1JSp67crqXcUJ0bCqrpgb-2PUne-TtaVQ/view?usp=drive_link"
                className={styles.link}
                aria-label="View AI Wellness Tools documentation"
                title="View AI Wellness Tools documentation"
                target="_blank"
                rel="noopener noreferrer"
              >
                🦾
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Art</h2>
            <p className={styles.projectDesc}>
              <a
                href="https://oncyber.io/stanfordgsb"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                View here
              </a>
              <span className={styles.specialText}>
                {" "}for digital fragments in spatial computing{" "}
              </span>
              <a
                href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/"
                className={styles.link}
                aria-label="View Art Gallery on Mads Gallery"
                title="View Art Gallery on Mads Gallery"
                target="_blank"
                rel="noopener noreferrer"
              >
                🖼️
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Frequency</h2>
            <p className={styles.projectDesc}>
              <a
                href="https://woodyard.dappling.network"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                this is a
              </a>
              <span className={styles.specialText}>
                {" "}consciousness engine for patterned meaning
              </span>
              <a
                href="https://archive.org/details/ancient-egyptian-magic-bob-brier/page/299/mode/1up"
                className={styles.link}
                aria-label="Read Ancient Egyptian Magic on Archive.org"
                title="Read Ancient Egyptian Magic on Archive.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                👨🏾‍💻
              </a>
            </p>
          </div>

          <div className={styles.projectCard}>
            <h2 className={styles.projectTitle}>Music</h2>
            <p className={styles.projectDesc}>
              <a
                href="https://chriswoodyard.bandcamp.com/"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Auditory Geometry
              </a>
              <span className={styles.specialText}> — Experimental sound project </span>
              <a
                href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk"
                className={styles.link}
                aria-label="Listen to Experimental Sound Project"
                title="Listen to Experimental Sound Project"
                target="_blank"
                rel="noopener noreferrer"
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
<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250" fill="none">
<!-- SVG created with Arrow, by QuiverAI (https://quiver.ai) -->
  <rect width="250" height="250" fill="#C8E8FB"/>
  <path d="M 239.14,10.96 H 10.71 V 239.04 H 239.14 V 10.96 Z" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 10.71,10 H 239.14" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 239.14,239.96 H 10.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 10.71,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 25.91,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 42.96,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 59.58,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 76.2,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 92.49,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 108.78,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 124.64,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 141.26,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 157.88,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 189.69,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 205.86,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 222.48,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 239.1,244 V 239.96" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,10 H 239.1" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,239 H 239.1" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,221.5 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,205.21 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,189.35 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,172.73 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,157.77 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,141.02 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,124.82 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,108.53 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,93.57 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,76.07 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,59.78 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,43.5 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,27.21 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,10.59 H 6" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 244,76.07 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,93.57 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,108.53 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,124.82 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,141.02 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,157.77 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,172.73 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,189.35 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,205.21 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 244,239 H 243.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,239 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,221.5 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,205.21 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,189.35 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,172.73 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,157.77 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,141.02 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,124.82 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,108.53 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,93.57 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,76.07 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,59.78 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,43.5 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,27.21 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 6,10 H 5.71" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 11.62,10.96 V 10.67" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 26.58,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 43.78,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 60.13,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 76.49,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 92.84,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 109.19,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 124.64,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 140.99,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 157.34,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 173.69,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 205.86,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 222.21,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 238.56,10.96 V 5.1" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 189.38,222.51 V 239.01 H 238.66 V 222.51 H 189.38 Z" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 192.46,225.09 H 194.03 L 195.21,229.21 L 196.49,225.09 H 197.99 V 229.9 H 197.03 V 226.11 L 195.81,229.9 H 194.61 L 193.42,226.11 V 229.9 H 192.46 V 225.09 Z" fill="#011638"/>
  <path d="M 198.94,225.09 H 200.91 C 202.19,225.09 202.86,225.44 202.86,226.51 C 202.86,227.33 202.41,227.68 201.74,227.81 L 202.96,229.9 H 201.86 L 200.74,227.93 H 200 V 229.9 H 198.96 V 225.09 H 198.94 Z M 200.84,227.16 C 201.51,227.16 201.86,227.03 201.86,226.49 C 201.86,225.96 201.51,225.86 200.84,225.86 H 199.96 V 227.16 H 200.84 Z" fill="#011638"/>
  <path d="M 203.46,228.55 L 204.28,228.16 C 204.56,228.75 205.06,229.06 205.76,229.06 C 206.36,229.06 206.78,228.88 206.78,228.43 C 206.78,228.01 206.46,227.83 205.66,227.61 C 204.66,227.33 203.78,227.06 203.78,226.06 C 203.78,225.16 204.53,224.61 205.63,224.61 C 206.68,224.61 207.31,225.14 207.63,225.76 L 206.88,226.26 C 206.61,225.76 206.13,225.49 205.61,225.49 C 205.08,225.49 204.76,225.69 204.76,226.04 C 204.76,226.49 205.13,226.64 205.91,226.89 C 206.88,227.19 207.73,227.51 207.73,228.48 C 207.73,229.33 207.01,229.95 205.73,229.95 C 204.61,229.98 203.83,229.43 203.46,228.55 Z" fill="#011638"/>
  <path d="M 208.38,225.09 H 209.93 C 211.38,225.09 212.61,225.76 212.61,227.46 C 212.61,229.21 211.48,229.9 209.96,229.9 H 208.36 V 225.09 H 208.38 Z M 209.98,229.06 C 211.11,229.06 211.58,228.46 211.58,227.46 C 211.58,226.36 211.01,225.89 209.91,225.89 H 209.38 V 229.06 H 209.98 Z" fill="#011638"/>
  <path d="M 213.31,225.09 H 214.36 L 216.61,228.31 V 225.09 H 217.56 V 229.9 H 216.66 L 214.26,226.51 V 229.9 H 213.31 V 225.09 Z" fill="#011638"/>
  <path d="M 218.31,227.48 C 218.31,225.71 219.41,224.96 220.61,224.96 C 221.78,224.96 222.88,225.71 222.88,227.48 C 222.88,229.26 221.78,230.01 220.61,230.01 C 219.41,230.01 218.31,229.26 218.31,227.48 Z M 221.86,227.48 C 221.86,226.29 221.26,225.74 220.58,225.74 C 219.88,225.74 219.33,226.29 219.33,227.48 C 219.33,228.68 219.88,229.26 220.58,229.26 C 221.28,229.23 221.86,228.66 221.86,227.48 Z" fill="#011638"/>
  <path d="M 223.51,225.09 H 225.08 L 226.26,229.21 L 227.53,225.09 H 229.03 V 229.9 H 228.08 V 226.11 L 226.86,229.9 H 225.66 L 224.46,226.11 V 229.9 H 223.51 V 225.09 Z" fill="#011638"/>
  <path d="M 229.98,225.09 H 230.98 V 229.9 H 229.98 V 225.09 Z" fill="#011638"/>
  <path d="M 231.68,227.48 C 231.68,225.74 232.71,224.96 233.88,224.96 C 235.06,224.96 235.71,225.64 235.93,226.69 L 235.01,226.91 C 234.81,226.16 234.46,225.79 233.86,225.79 C 233.01,225.79 232.63,226.59 232.63,227.51 C 232.63,228.53 233.06,229.26 233.86,229.26 C 234.46,229.26 234.83,228.86 235.03,228.03 L 235.96,228.23 C 235.68,229.36 235.01,230.03 233.86,230.03 C 232.66,229.98 231.68,229.16 231.68,227.48 Z" fill="#011638"/>
  <path d="M 198.01,232.71 H 200 C 201.28,232.71 201.96,233.06 201.96,234.13 C 201.96,234.96 201.51,235.31 200.84,235.43 L 202.06,237.53 H 200.96 L 199.84,235.56 H 199.09 V 237.53 H 198.04 V 232.71 H 198.01 Z M 199.91,234.78 C 200.59,234.78 200.94,234.66 200.94,234.11 C 200.94,233.58 200.59,233.48 199.91,233.48 H 199.04 V 234.78 H 199.91 Z" fill="#011638"/>
  <path d="M 202.81,236.46 H 203.84 V 237.51 H 202.81 V 236.46 Z" fill="#011638"/>
  <path d="M 206.19,232.69 H 207.21 L 208.99,237.51 H 207.96 L 207.51,236.21 H 205.71 L 205.26,237.51 H 204.31 L 206.19,232.69 Z M 207.26,235.43 L 206.59,233.38 L 205.91,235.43 H 207.26 Z" fill="#011638"/>
  <path d="M 209.51,236.46 H 210.54 V 237.51 H 209.51 V 236.46 Z" fill="#011638"/>
  <path d="M 211.61,232.71 H 212.61 V 237.53 H 211.61 V 232.71 Z" fill="#011638"/>
  <path d="M 213.69,236.46 H 214.71 V 237.51 H 213.69 V 236.46 Z" fill="#011638"/>
  <path d="M 215.66,232.71 H 216.71 L 218.96,235.93 V 232.71 H 219.91 V 237.53 H 219.01 L 216.61,234.13 V 237.53 H 215.66 V 232.71 Z" fill="#011638"/>
  <path d="M 219.96,236.46 H 220.98 V 237.51 H 219.96 V 236.46 Z" fill="#011638"/>
  <path d="M 223.06,232.71 H 224.06 V 236.68 H 226.46 V 237.53 H 223.06 V 232.71 Z" fill="#011638"/>
  <path d="M 228.71,232.69 H 229.73 L 231.51,237.51 H 230.48 L 230.03,236.21 H 228.23 L 227.78,237.51 H 226.83 L 228.71,232.69 Z M 229.76,235.43 L 229.08,233.38 L 228.41,235.43 H 229.76 Z" fill="#011638"/>
  <path d="M 231.78,236.46 H 232.81 V 237.51 H 231.78 V 236.46 Z" fill="#011638"/>
  <path d="M 16.91,111.75 V 150.97" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 15.96,150.97 H 18.74" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 15.96,111.75 H 18.74" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,147.12 V 147.9" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,143.27 V 144.04" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,139.42 V 140.19" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,135.57 V 136.34" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,131.72 V 132.49" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,127.87 V 128.64" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,124.02 V 124.79" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,120.17 V 120.94" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,116.32 V 117.09" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 18.19,112.47 V 113.24" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 16.81,106.66 C 18.81,104.11 18.81,101.09 20.91,101.09 C 24.11,101.09 24.71,113.92 28.11,113.92 C 31.06,113.92 31.71,101.09 35.41,101.09 C 38.81,101.09 39.41,113.92 42.21,113.92 C 45.31,113.92 46.01,101.09 49.71,101.09 C 53.41,101.09 53.81,113.92 56.61,113.92 C 59.01,113.92 60.31,101.09 64.61,101.09" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 16.81,123.29 C 18.81,120.74 18.81,117.72 20.91,117.72 C 24.11,117.72 24.71,130.54 28.11,130.54 C 31.06,130.54 31.71,117.72 35.41,117.72 C 38.81,117.72 39.41,130.54 42.21,130.54 C 45.31,130.54 46.01,117.72 49.71,117.72 C 53.41,117.72 53.81,130.54 56.61,130.54 C 59.01,130.54 60.31,117.72 64.61,117.72" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 16.81,139.91 C 18.81,137.36 18.81,134.34 20.91,134.34 C 24.11,134.34 24.71,147.17 28.11,147.17 C 31.06,147.17 31.71,134.34 35.41,134.34 C 38.81,134.34 39.41,147.17 42.21,147.17 C 45.31,147.17 46.01,134.34 49.71,134.34 C 53.41,134.34 53.81,147.17 56.61,147.17 C 59.01,147.17 60.31,134.34 64.61,134.34" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 23.91,153.09 C 30.71,173.49 42.11,197.31 68.91,197.31 C 91.91,197.31 102.71,177.12 106.61,173.69" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 34.71,153.09 C 41.01,165.91 50.71,182.94 69.71,182.94 C 86.21,182.94 93.41,173.19 96.01,171.04" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 43.31,152.29 C 48.21,158.99 55.81,170.06 73.31,170.06 C 83.21,170.06 86.71,164.39 88.71,162.89" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 58.71,155.39 C 62.91,157.94 67.31,159.19 74.61,159.19" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 143.81,176.24 C 150.21,186.14 158.61,197.46 177.01,197.46 C 199.01,197.46 228.71,166.81 228.71,124.32 C 228.71,101.12 213.01,51.69 178.11,51.69 C 162.11,51.69 151.11,62.19 143.01,74.01" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 161.91,165.74 C 165.71,170.29 170.01,176.59 182.11,176.59 C 196.91,176.59 215.71,154.69 215.71,129.72 C 215.71,109.22 199.11,74.56 176.81,74.56 C 167.61,74.56 161.01,77.96 155.71,83.31" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 169.71,158.69 C 171.71,159.64 173.21,160.09 176.81,160.09 C 189.41,160.09 206.31,142.06 206.31,122.22 C 206.31,108.77 193.11,91.27 177.61,91.27 C 174.11,91.27 171.01,92.22 168.41,93.92" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 147.71,189.91 C 152.11,196.31 157.81,206.01 169.71,211.21" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 139.41,180.21 C 143.71,187.16 149.21,197.96 158.41,214.66" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 133.91,179.21 C 137.11,188.76 141.11,199.26 147.71,209.76" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 129.01,179.21 C 130.81,188.76 133.91,201.16 139.41,219.16" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 124.51,179.21 V 219.16" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 120.01,179.21 C 118.51,189.91 116.91,200.26 112.01,221.41" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 115.51,179.21 C 111.41,189.91 105.41,202.06 92.31,217.81" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 110.61,178.21 C 104.21,188.11 98.01,199.91 80.01,210.81" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 183.61,179.71 C 187.61,189.61 190.81,197.01 197.71,197.01" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 185.11,135.19 L 183.01,136.94 L 184.16,137.19 L 181.21,156.49 L 180.71,167.19 C 180.71,170.14 183.61,177.79 185.11,179.71" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 168.71,39.81 C 159.01,44.71 151.61,53.21 147.31,57.71" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 157.01,31.71 C 153.01,34.01 148.01,42.26 144.01,54.76" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 163.71,21.11 H 159.31 C 149.71,21.11 147.01,26.81 144.01,34.01 L 135.81,68.76" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 190.91,43.16 L 182.01,60.11" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 182.01,60.11 L 181.51,61.06 L 182.81,61.76 L 183.71,58.06" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 32.11,76.06 C 39.51,63.24 50.81,52.11 68.81,52.11 C 86.01,52.11 96.31,60.81 106.81,72.01" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 55.61,70.91 C 60.11,67.71 66.21,66.71 70.11,66.71" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 70.11,66.21 L 71.31,68.41 L 72.11,66.61 L 70.11,66.21 Z" fill="#011638"/>
  <path d="M 79.61,79.81 C 83.81,80.31 85.91,81.11 88.81,82.01" stroke="#011638" stroke-width="0.2" stroke-miterlimit="10"/>
  <path d="M 72.01,35.61 C 76.51,35.61 84.21,34.91 87.01,39.81 L 87.81,43.51" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 82.71,39.81 L 99.31,54.11" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 99.01,52.81 L 100.71,55.76 L 101.11,53.41 L 99.01,52.81 Z" fill="#011638"/>
  <path d="M 91.81,31.71 L 108.31,57.21" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 103.31,28.21 L 116.11,68.16" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 106.41,49.01 L 108.71,51.61 L 109.11,49.26 L 106.41,49.01 Z" fill="#011638"/>
  <path d="M 112.81,27.21 L 120.01,67.66" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 113.11,46.96 L 115.01,49.91 L 115.71,47.61 L 113.11,46.96 Z" fill="#011638"/>
  <path d="M 124.11,25.71 V 67.66" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.21,46.46 L 124.51,49.71 L 125.51,47.51 L 123.21,46.46 Z" fill="#011638"/>
  <path d="M 136.71,27.21 L 128.51,67.66" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 133.91,46.46 L 136.41,49.01 L 137.21,46.71 L 133.91,46.46 Z" fill="#011638"/>
  <path d="M 143.01,49.26 L 145.91,53.11 L 147.91,50.71 L 143.01,49.26 Z" fill="#011638"/>
  <path d="M 175.11,79.01 L 176.81,81.31 L 177.71,79.41 L 175.11,79.01 Z" fill="#011638"/>
  <path d="M 174.61,90.71 L 177.01,92.71 L 177.61,90.21 L 174.61,90.71 Z" fill="#011638"/>
  <path d="M 176.11,66.71 L 178.61,68.11 L 179.21,66.01 L 176.11,66.71 Z" fill="#011638"/>
  <path d="M 176.11,158.39 L 178.61,159.79 L 179.21,157.69 L 176.11,158.39 Z" fill="#011638"/>
  <path d="M 176.81,182.21 L 179.41,183.31 L 179.81,181.01 L 176.81,182.21 Z" fill="#011638"/>
  <path d="M 173.61,169.41 L 176.21,170.51 L 176.61,168.21 L 173.61,169.41 Z" fill="#011638"/>
  <path d="M 69.41,182.11 L 72.31,183.31 L 72.41,181.11 L 69.41,182.11 Z" fill="#011638"/>
  <path d="M 70.11,158.19 L 73.01,159.39 L 73.11,157.19 L 70.11,158.19 Z" fill="#011638"/>
  <path d="M 70.81,169.69 L 73.71,170.89 L 73.81,168.69 L 70.81,169.69 Z" fill="#011638"/>
  <path d="M 97.51,215.16 L 99.71,214.36 L 99.51,216.26 L 97.51,215.16 Z" fill="#011638"/>
  <path d="M 100.01,193.26 L 102.61,194.36 L 102.81,192.06 L 100.01,193.26 Z" fill="#011638"/>
  <path d="M 105.41,196.16 L 108.01,197.26 L 108.21,194.96 L 105.41,196.16 Z" fill="#011638"/>
  <path d="M 110.61,198.66 L 113.21,199.76 L 113.41,197.46 L 110.61,198.66 Z" fill="#011638"/>
  <path d="M 117.81,200.36 L 120.41,201.46 L 120.61,199.16 L 117.81,200.36 Z" fill="#011638"/>
  <path d="M 128.51,200.36 L 131.11,201.46 L 131.31,199.16 L 128.51,200.36 Z" fill="#011638"/>
  <path d="M 137.21,198.66 L 142.11,200.06 L 141.11,195.96 L 137.21,198.66 Z" fill="#011638"/>
  <path d="M 145.41,193.26 L 149.61,194.16 L 148.41,190.76 L 145.41,193.26 Z" fill="#011638"/>
  <path d="M 226.91,120.02 L 228.31,123.22 L 229.71,120.02 H 226.91 Z" fill="#011638"/>
  <path d="M 217.11,120.02 L 218.51,123.22 L 219.91,120.02 H 217.11 Z" fill="#011638"/>
  <path d="M 85.41,228.36 C 92.81,228.36 97.11,220.06 98.41,216.66" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 180.11,117.12 L 213.91,113.32 C 215.71,121.87 215.21,130.12 213.91,136.32 L 180.11,128.02 V 117.12 Z" fill="#011638" fill-opacity="0.4" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 124.61,180.71 C 153.09,180.71 179.51,153.01 179.51,124.97 C 179.51,96.92 154.71,68.11 123.71,68.11 C 93.81,68.11 70.01,94.77 70.01,125.72 C 70.01,153.27 94.21,180.71 124.61,180.71 Z" fill="#C8E8FB" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 123.71,179.71 C 150.81,179.71 176.71,153.19 176.71,124.82 C 176.71,98.12 153.21,71.01 123.71,71.01 C 95.21,71.01 72.21,96.47 72.21,125.42 C 72.21,152.02 95.21,179.71 123.71,179.71 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.71,177.71 C 149.11,177.71 173.81,152.64 173.81,125.72 C 173.81,100.32 151.71,73.91 123.71,73.91 C 96.71,73.91 75.11,98.12 75.11,125.62 C 75.11,151.42 97.01,177.71 123.71,177.71 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.71,173.86 C 146.71,173.86 168.91,150.89 168.91,125.72 C 168.91,102.27 148.91,78.76 123.71,78.76 C 98.91,78.76 79.51,100.62 79.51,125.42 C 79.51,149.62 99.01,173.86 123.71,173.86 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.21,169.41 C 143.71,169.41 163.51,148.79 163.51,126.22 C 163.51,105.22 145.71,84.61 123.21,84.61 C 101.21,84.61 83.91,104.22 83.91,126.22 C 83.91,147.92 101.51,169.41 123.21,169.41 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.21,164.96 C 141.01,164.96 157.61,146.84 157.61,127.12 C 157.61,108.82 142.41,91.01 123.21,91.01 C 104.41,91.01 89.81,107.82 89.81,126.62 C 89.81,145.17 104.91,164.96 123.21,164.96 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 123.71,158.16 C 137.71,158.16 150.71,143.79 150.71,128.02 C 150.71,113.62 137.91,99.21 123.21,99.21 C 108.91,99.21 97.21,112.47 97.21,127.12 C 97.21,141.72 109.31,158.16 123.71,158.16 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 124.51,151.36 C 134.11,151.36 143.01,141.31 143.01,129.02 C 143.01,117.82 133.71,107.42 123.71,107.42 C 113.61,107.42 108.21,116.92 108.21,125.32 C 108.21,135.12 115.51,151.36 124.51,151.36 Z" fill="#C8E8FB" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 124.51,138.54 C 132.41,138.54 138.41,130.79 138.41,123.92 C 138.41,116.22 131.71,110.32 124.71,110.32 C 116.81,110.32 111.11,117.42 111.11,125.32 C 111.11,132.67 117.41,138.54 124.51,138.54 Z" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 106.81,172.21 H 142.51 V 175.11 H 106.81 V 172.21 Z" fill="#C8E8FB" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 112.01,135.64 V 172.21" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 135.81,135.64 V 172.21" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 109.61,150.82 V 156.62 H 116.41 V 150.82 H 114.91 V 154.22 H 111.11 V 150.82 H 109.61 Z" fill="#011638"/>
  <path d="M 132.41,150.82 V 156.62 H 139.21 V 150.82 H 137.71 V 154.22 H 133.91 V 150.82 H 132.41 Z" fill="#011638"/>
  <path d="M 117.81,142.92 L 128.51,144.42 L 120.21,148.22 L 129.41,149.92 L 120.21,153.22 L 130.41,154.72 L 120.21,157.62 L 129.41,159.57 L 120.21,162.47 L 126.51,164.37" stroke="#011638" stroke-width="0.7" stroke-miterlimit="10"/>
  <path d="M 137.21,111.92 L 154.21,94.92" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 152.11,95.02 L 154.81,94.82 L 154.11,92.72 L 152.11,95.02 Z" fill="#011638"/>
  <path d="M 110.61,136.12 L 90.81,158.62" stroke="#011638" stroke-width="0.4" stroke-miterlimit="10"/>
  <path d="M 109.21,135.62 L 111.31,137.02 L 110.01,138.72 L 109.21,135.62 Z" fill="#011638"/>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="169.402" y="23.3301">N(t) = </tspan>
    <tspan x="186.54" y="23.3301" font-family="Arial" font-style="italic">N</tspan>
    <tspan x="189.94" y="23.3301" font-family="Arial" font-style="italic">(</tspan>
    <tspan x="192.096" y="23.3301">1 + </tspan>
    <tspan x="202.763" y="23.3301" font-family="Arial" font-style="italic">α</tspan>
    <tspan x="206.663" y="23.3301">·cos(</tspan>
    <tspan x="218.743" y="23.3301" font-family="Arial" font-style="italic">ω</tspan>
    <tspan x="223.543" y="23.3301" font-family="Arial" font-style="italic">t))</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="177.312" y="39.3301">E</tspan>
    <tspan x="181.062" y="39.3301" font-size="4.5" letter-spacing="0em">req</tspan>
    <tspan x="187.712" y="39.3301"> ~ me</tspan>
    <tspan x="200.312" y="39.3301" font-size="4.5" letter-spacing="0em">2</tspan>
    <tspan x="203.962" y="39.3301"> · </tspan>
    <tspan x="211.962" y="39.3301" font-family="Arial" font-style="italic">ξ</tspan>
    <tspan x="215.712" y="39.3301">(Δt/</tspan>
    <tspan x="227.212" y="39.3301" font-family="Arial" font-style="italic">τ</tspan>
    <tspan x="229.912" y="39.3301" font-family="Arial" font-style="italic" font-size="4.5" letter-spacing="0em">p</tspan>
    <tspan x="232.812" y="39.3301">)</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="196.5" y="199.33">Slip Window A</tspan>
    <tspan x="196.5" y="205.33"> (labils interval)</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="20.0039" y="231.33">ξ(ω) coupling ~ </tspan>
    <tspan x="59.0039" y="231.33" font-family="Arial" font-style="italic" font-size="6" letter-spacing="0em">ξ</tspan>
    <tspan x="61.2539" y="231.33" font-family="Arial" font-style="italic" font-size="4.5" letter-spacing="0em">0</tspan>
    <tspan x="65.8039" y="231.33"> ~ </tspan>
    <tspan x="70.8039" y="231.33" font-family="Arial" font-style="italic" font-size="6" letter-spacing="0em">10</tspan>
    <tspan x="78.3039" y="229.33" font-family="Arial" font-style="italic" font-size="4.5" letter-spacing="0em">−10</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="20.0039" y="203.33">Matter-Scalar </tspan>
    <tspan x="15.5039" y="209.33">Coupler / Node Ω</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="20.0039" y="83.8301">Harmonic Superposition</tspan>
    <tspan x="17.5039" y="89.8301">Unit ~ </tspan>
    <tspan x="37.5039" y="89.8301" font-family="Arial" font-style="italic" font-size="6" letter-spacing="0em">φ</tspan>
    <tspan x="39.7539" y="89.8301" font-family="Arial" font-style="italic" font-size="4.5" letter-spacing="0em">eff</tspan>
    <tspan x="45.0039" y="89.8301">maximizer</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="4" letter-spacing="0em">
    <tspan x="18.5039" y="98.3301">0</tspan>
    <tspan x="26.5039" y="98.3301">Ix=1</tspan>
    <tspan x="39.5039" y="98.3301">IIx</tspan>
    <tspan x="45.5039" y="98.3301">Iy</tspan>
    <tspan x="52.5039" y="98.3301">Iz</tspan>
  </text>
  <text fill="#011638" style="white-space: pre" font-family="Arial" font-size="6" letter-spacing="0em">
    <tspan x="20.0039" y="37.3301">ω</tspan>
    <tspan x="25.0039" y="39.3301" font-size="4" letter-spacing="0em">IPC</tspan>
    <tspan x="32.0039" y="37.3301">frequency field</tspan>
  </text>
  <path d="M 121.21,127.52 C 121.31,127.52 121.41,127.47 121.51,127.37 C 121.61,127.27 121.71,127.12 121.81,126.87 C 121.91,126.62 122.01,126.32 122.06,125.92 C 122.11,125.52 122.16,125.02 122.21,124.42 C 122.21,123.82 122.21,123.12 122.16,122.37 C 122.06,121.62 122.01,121.17 121.91,120.92 H 122.91 C 123.11,121.02 123.31,121.12 123.51,121.17 C 123.71,121.22 123.91,121.27 124.11,121.27 C 124.61,121.27 125.01,121.42 125.31,121.72 C 125.61,122.02 125.76,122.42 125.76,122.92 C 125.76,123.22 125.66,123.62 125.46,124.12 C 125.26,124.62 124.81,125.42 H 125.91 V 127.52 H 121.21 Z M 124.71,126.52 L 124.81,126.37 L 124.91,126.12 C 125.01,125.92 125.11,125.72 125.21,125.42 C 125.31,125.12 125.36,124.82 125.36,124.52 C 125.36,124.02 125.16,123.62 124.76,123.22 C 124.36,122.82 123.86,122.62 123.31,122.62 C 123.11,122.62 122.91,122.62 122.71,122.67 V 123.92 C 122.71,124.62 122.71,125.22 122.66,125.72 C 122.61,126.22 122.51,126.52" fill="#011638"/>

  <!-- Vers3Dynamics Branding Overlay -->
  <!-- Title bar background -->
  <rect x="0" y="218" width="250" height="32" fill="#011638" opacity="0.93"/>
  <rect x="0" y="218" width="250" height="1.2" fill="#3a7aff" opacity="0.9"/>
  <!-- Company name -->
  <text x="125" y="231"
    font-family="'Courier New', Courier, monospace"
    font-size="9.5" font-weight="bold"
    fill="#7ec8e3" text-anchor="middle" letter-spacing="2"
    filter="url(#v3dGlow)">VERS3DYNAMICS</text>
  <!-- Lab name -->
  <text x="125" y="244"
    font-family="'Courier New', Courier, monospace"
    font-size="6.8" fill="#4a88c0" text-anchor="middle" letter-spacing="1.5">R.A.I.N. LAB — WASHINGTON D.C.</text>
  <!-- Drawing number -->
  <text x="8" y="247"
    font-family="'Courier New', Courier, monospace"
    font-size="5.5" fill="#2a4a70">VD-DRR-003</text>
  <text x="242" y="247"
    font-family="'Courier New', Courier, monospace"
    font-size="5.5" fill="#2a4a70" text-anchor="end">REV A</text>
  <!-- Glow filter for text -->
  <defs>
    <filter id="v3dGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

</svg>
        <footer className={styles.footer}>
          <p className={styles.contact}>
            contact ➡️{" "}
            <a
              href="mailto:christopher@vers3dynamics.com"
              className={styles.link}
              aria-label="Email Christopher"
            >
              christopher@vers3dynamics.com
            </a>
          </p>
          <p className={styles.copyright}>© {new Date().getFullYear()} Vers3Dynamics</p>
        </footer>
      </main>

      <ScrollToTop />
    </div>
  );
}

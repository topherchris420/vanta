import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
import Image from "next/image";
import ScrollToTop from "../components/ScrollToTop";
import CustomCursor from "../components/CustomCursor";

const VantaEffectNoSSR = dynamic(() => import("../components/VantaEffect"), {
  ssr: false,
});

const projectSections = [
  {
    title: "Books",
    description:
      "Coloring books, poetry, and health-focused writing for reflection and daily rituals.",
    primaryLabel: "Browse Amazon Author Page",
    primaryHref:
      "https://www.amazon.com/stores/Christopher-Woodyard/author/B084ZSG4V9?ref=ap_rdr&isDramIntegrated=true&shoppingPortalEnabled=true",
    secondaryLabel: "Visit Human Touch",
    secondaryHref: "https://humantouch.fun/",
  },
  {
    title: "Apps",
    description:
      "Sound-driven AI wellness tools and prototypes focused on mindful interaction.",
    primaryLabel: "Explore AI/ML Projects",
    primaryHref: "https://huggingface.co/ciaochris",
    secondaryLabel: "Read Product Documentation",
    secondaryHref:
      "https://drive.google.com/file/d/1JSp67crqXcUJ0bCqrpgb-2PUne-TtaVQ/view?usp=drive_link",
  },
  {
    title: "Art",
    description:
      "Digital fragments and spatial-computing exhibitions that blend visual poetry with immersion.",
    primaryLabel: "View Oncyber Gallery",
    primaryHref: "https://oncyber.io/stanfordgsb",
    secondaryLabel: "See MADS Gallery Feature",
    secondaryHref:
      "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
  },
  {
    title: "Frequency",
    description:
      "A consciousness engine exploring patterned meaning, ritual, and symbolic systems.",
    primaryLabel: "Open Frequency Experience",
    primaryHref: "https://woodyard.dappling.network",
    secondaryLabel: "Read Inspiration Source",
    secondaryHref:
      "https://archive.org/details/ancient-egyptian-magic-bob-brier/page/299/mode/1up",
  },
  {
    title: "Music",
    description:
      "Experimental sound compositions under Auditory Geometry with cinematic sonic textures.",
    primaryLabel: "Listen on Bandcamp",
    primaryHref: "https://chriswoodyard.bandcamp.com/",
    secondaryLabel: "Play Featured Track",
    secondaryHref:
      "https://chriswoodyard.bandcamp.com/track/creators-innovators",
  },
];

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

        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mitpress.vercel.app/" />
        <meta property="og:title" content="Vers3Dynamics | Christopher" />
        <meta property="og:description" content="Personal website of Christopher, founder of Vers3Dynamics. Exploring sound-driven wellness apps and experimental art." />
        <meta property="og:image" content="/surreal-sun.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://mitpress.vercel.app/" />
        <meta name="twitter:title" content="Vers3Dynamics | Christopher" />
        <meta name="twitter:description" content="Personal website of Christopher, founder of Vers3Dynamics. Exploring sound-driven wellness apps and experimental art." />
        <meta name="twitter:image" content="/surreal-sun.png" />
      </Head>

      <CustomCursor />
      <VantaEffectNoSSR className={styles.background} aria-hidden="true" />

      <main className={styles.main}>
        <section className={styles.header}>
          <p className={styles.kicker}>Wellness tech • Founder • Writer</p>
          <h1 className={styles.title}>Hi, I&apos;m Christopher.</h1>
          <p className={styles.subtitle}>
            I build sound-driven wellness apps, and experimental art through
            Vers3Dynamics.
          </p>
          <div className={styles.heroActions}>
            <a
              href="https://arpa-h.vercel.app/"
              className={`${styles.ctaButton} ${styles.primaryCta}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Work
            </a>
            <a
              href="mailto:christopher@vers3dynamics.com"
              className={`${styles.ctaButton} ${styles.secondaryCta}`}
            >
              Work With Me
            </a>
          </div>
        </section>

        <section className={styles.biography}>
          <p className={styles.bio}>
            Founder of{" "}
            <a href="https://vers3dynamics.com/" className={styles.link} target="_blank" rel="noopener noreferrer">
              versᗱdynamics
            </a>
            , the Recursive Architecture of Intelligent Nexus (R.A.I.N. Lab), and{" "}
            <a href="https://rainlabteam.vercel.app/" className={styles.link} target="_blank" rel="noopener noreferrer">
              Resonance Architect
            </a>
            .
            <a
              href="https://github.com/topherchris420"
              className={styles.link}
              aria-label="View resume (PDF)"
              title="View resume (PDF)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {" "}View Resume
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
              loading="eager"
            />
            <div className={styles.imageOverlay}>
              <p className={styles.imageCaption}>Welcome</p>
            </div>
          </div>
        </section>

        <section className={styles.projects}>
          {projectSections.map((project) => (
            <div className={styles.projectCard} key={project.title}>
              <h2 className={styles.projectTitle}>{project.title}</h2>
              <p className={styles.projectIntro}>{project.description}</p>
              <div className={styles.projectLinks}>
                <a href={project.primaryHref} className={styles.link} target="_blank" rel="noopener noreferrer">
                  {project.primaryLabel}
                </a>
                <a href={project.secondaryHref} className={styles.linkSecondary} target="_blank" rel="noopener noreferrer">
                  {project.secondaryLabel}
                </a>
              </div>
            </div>
          ))}

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
            Contact ➡️{" "}
            <a href="mailto:christopher@vers3dynamics.com" className={styles.link} aria-label="Email Christopher">
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

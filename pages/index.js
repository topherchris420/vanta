import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
import Image from "next/image";
import ScrollToTop from "../components/ScrollToTop";
import CustomCursor from "../components/CustomCursor";
import Navbar from "../components/Navbar";
import ScrollProgress from "../components/ScrollProgress";
import Reveal from "../components/Reveal";
import Marquee from "../components/Marquee";
import SpotlightCard from "../components/SpotlightCard";

const VantaEffectNoSSR = dynamic(() => import("../components/VantaEffect"), {
  ssr: false,
});

const marqueeItems = [
  "Sound-driven wellness",
  "Experimental art",
  "AI / ML prototypes",
  "Poetry & writing",
  "Spatial computing",
  "Auditory geometry",
  "Consciousness engines",
];

const projectSections = [
  {
    number: "01",
    title: "Books",
    description:
      "Coloring books, poetry, and health-focused writing for reflection and daily rituals.",
    primaryLabel: "Browse poetry book",
    primaryHref: "https://a.co/d/078d1kaa",
    secondaryLabel: "Visit Human Touch",
    secondaryHref: "https://humantouch.fun/",
    accent: "251, 191, 36",
  },
  {
    number: "02",
    title: "Apps",
    description:
      "Sound-driven AI wellness tools and prototypes focused on mindful interaction.",
    primaryLabel: "Explore AI/ML Projects",
    primaryHref: "https://huggingface.co/ciaochris",
    secondaryLabel: "Read Product Documentation",
    secondaryHref: "https://github.com/topherchris420/james_library",
    accent: "103, 232, 249",
  },
  {
    number: "03",
    title: "Art",
    description:
      "Digital fragments and spatial-computing exhibitions that blend visual poetry with immersion.",
    primaryLabel: "View Oncyber Gallery",
    primaryHref: "https://oncyber.io/stanfordgsb",
    secondaryLabel: "See MADS Gallery Feature",
    secondaryHref:
      "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
    accent: "192, 132, 252",
  },
  {
    number: "04",
    title: "Frequency",
    description:
      "A consciousness engine exploring patterned meaning, ritual, and symbolic systems.",
    primaryLabel: "Open Frequency Experience",
    primaryHref: "https://woodyard.dappling.network",
    secondaryLabel: "Read Inspiration Source",
    secondaryHref:
      "https://archive.org/details/ancient-egyptian-magic-bob-brier/page/299/mode/1up",
    accent: "249, 168, 212",
  },
  {
    number: "05",
    title: "Music",
    description:
      "Experimental sound compositions under Auditory Geometry with cinematic sonic textures.",
    primaryLabel: "Listen on Bandcamp",
    primaryHref: "https://chriswoodyard.bandcamp.com/",
    secondaryLabel: "Play Featured Track",
    secondaryHref:
      "https://chriswoodyard.bandcamp.com/track/creators-innovators",
    accent: "134, 239, 172",
  },
];

const elsewhereLinks = [
  { label: "Bandcamp", href: "https://chriswoodyard.bandcamp.com/" },
  { label: "Hugging Face", href: "https://huggingface.co/ciaochris" },
  {
    label: "SSRN",
    href: "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
  },
  { label: "Latest build", href: "https://arpa-h.vercel.app/" },
];

export default function Home() {
  return (
    <div className={styles.container} id="top">
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="/Logo.jpg" />
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
      <ScrollProgress />
      <Navbar />
      <VantaEffectNoSSR className={styles.background} aria-hidden="true" />

      <main className={styles.main}>
        <section className={styles.hero} aria-label="Introduction">
          <p className={`${styles.statusPill} ${styles.heroIn}`} style={{ "--stagger": 0 }}>
            <span className={styles.statusDot} aria-hidden="true" />
            Open to collaborations
          </p>
          <p className={`${styles.kicker} ${styles.heroIn}`} style={{ "--stagger": 1 }}>
            Wellness tech • Founder • Writer
          </p>
          <h1 className={styles.title}>
            <span className={`${styles.titleLine} ${styles.heroIn}`} style={{ "--stagger": 2 }}>
              Hi, I&apos;m Christopher.
            </span>
            <span
              className={`${styles.titleLine} ${styles.titleGradient} ${styles.heroIn}`}
              style={{ "--stagger": 3 }}
            >
              I build experiences you can feel.
            </span>
          </h1>
          <p className={`${styles.subtitle} ${styles.heroIn}`} style={{ "--stagger": 4 }}>
            Sound-driven wellness apps, consciousness engines, and experimental
            art — made at Vers3Dynamics.
          </p>
          <div className={`${styles.heroActions} ${styles.heroIn}`} style={{ "--stagger": 5 }}>
            <a href="#work" className={`${styles.ctaButton} ${styles.primaryCta}`}>
              Explore the work
              <span
                className={`${styles.ctaArrow} ${styles.ctaArrowDown}`}
                aria-hidden="true"
              >
                ↓
              </span>
            </a>
            <a
              href="mailto:christopher@vers3dynamics.com"
              className={`${styles.ctaButton} ${styles.secondaryCta}`}
            >
              Work with me
              <span className={styles.ctaArrow} aria-hidden="true">↗</span>
            </a>
          </div>
          <a
            href="#about"
            className={`${styles.scrollCue} ${styles.heroIn}`}
            style={{ "--stagger": 7 }}
            aria-label="Scroll to the about section"
          >
            <span className={styles.scrollCueLine} aria-hidden="true" />
            Scroll
          </a>
        </section>

        <Marquee items={marqueeItems} />

        <Reveal as="section" id="about" className={styles.about} aria-label="About">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>01 · About</p>
            <h2 className={styles.sectionTitle}>
              A studio of one, tuned to many frequencies.
            </h2>
          </div>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutText}>
              <p className={styles.bio}>
                Founder of{" "}
                <a href="https://vers3dynamics.com/" className={styles.link} target="_blank" rel="noopener noreferrer">
                  versᗱdynamics
                </a>
                , the Recursive Architecture of Intelligent Nexus (R.A.I.N.
                Lab), and{" "}
                <a href="https://rainlabteam.vercel.app/" className={styles.link} target="_blank" rel="noopener noreferrer">
                  Resonance Architect
                </a>
                .
              </p>
              <p className={styles.bioSecondary}>
                I build sound-driven wellness apps and experimental art —
                projects that sit where software, sound, and ritual overlap.
              </p>
              <a
                href="https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976"
                className={`${styles.ctaButton} ${styles.secondaryCta}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View resume
                <span className={styles.ctaArrow} aria-hidden="true">↗</span>
              </a>
            </div>
            <div className={styles.aboutImageFrame}>
              <div className={styles.aboutImageInner}>
                <Image
                  src="/surreal-sun.png"
                  alt="Vers3Dynamics artwork"
                  width={600}
                  height={800}
                  className={styles.featureImage}
                  sizes="(max-width: 860px) 100vw, 440px"
                  priority
                />
                <div className={styles.imageOverlay}>
                  <p className={styles.imageCaption}>Welcome</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <section id="work" className={styles.projects} aria-label="Selected work">
          <Reveal className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>02 · Selected work</p>
            <h2 className={styles.sectionTitle}>Five mediums, one signal.</h2>
          </Reveal>

          <div className={styles.projectGrid}>
            {projectSections.map((project, index) => (
              <Reveal
                key={project.title}
                delay={(index % 2) * 110}
                className={styles.projectCell}
              >
                <SpotlightCard
                  className={styles.projectCard}
                  style={{ "--accent": project.accent }}
                >
                  <span className={styles.projectGhost} aria-hidden="true">
                    {project.number}
                  </span>
                  <span className={styles.projectChip}>{project.number}</span>
                  <h3 className={styles.projectTitle}>{project.title}</h3>
                  <p className={styles.projectIntro}>{project.description}</p>
                  <div className={styles.projectLinks}>
                    <a
                      href={project.primaryHref}
                      className={styles.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.primaryLabel}
                      <span className={styles.linkArrow} aria-hidden="true">↗</span>
                    </a>
                    <a
                      href={project.secondaryHref}
                      className={styles.projectLinkSecondary}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.secondaryLabel}
                    </a>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>

          <Reveal className={styles.gifContainer}>
            <span className={styles.gifLabel}>Off the grid · Pixel playground</span>
            <iframe
              src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY"
              className={styles.giphyEmbed}
              title="Pixel Art Animation"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </Reveal>
        </section>

        <Reveal as="footer" id="contact" className={styles.footer} aria-label="Contact">
          <p className={styles.sectionKicker}>03 · Contact</p>
          <h2 className={styles.footerTitle}>
            Let&apos;s make something{" "}
            <span className={styles.titleGradient}>resonant</span>.
          </h2>
          <p className={styles.footerText}>
            Collaborations, commissions, or curious questions — my inbox is
            open.
          </p>
          <a
            href="mailto:christopher@vers3dynamics.com"
            className={`${styles.ctaButton} ${styles.primaryCta} ${styles.footerCta}`}
          >
            christopher@vers3dynamics.com
            <span className={styles.ctaArrow} aria-hidden="true">↗</span>
          </a>
          <div className={styles.footerMeta}>
            <nav className={styles.footerLinks} aria-label="Elsewhere">
              {elsewhereLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Vers3Dynamics · Crafted with Next.js
              &amp; Three.js
            </p>
          </div>
        </Reveal>
      </main>

      <ScrollToTop />
    </div>
  );
}

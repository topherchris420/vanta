import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import CustomCursor from "../components/CustomCursor";
import FrequencyRail from "../components/FrequencyRail";
import Navbar from "../components/Navbar";
import ProjectChannel from "../components/ProjectChannel";
import Reveal from "../components/Reveal";
import ScrollProgress from "../components/ScrollProgress";
import ScrollToTop from "../components/ScrollToTop";
import SignalConsole from "../components/SignalConsole";
import useSignalAudio from "../hooks/useSignalAudio";
import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

const VantaEffectNoSSR = dynamic(() => import("../components/VantaEffect"), {
  ssr: false,
});

const DisplayPedestalNoSSR = dynamic(
  () => import("../components/DisplayPedestal"),
  { ssr: false }
);

const projectSections = [
  {
    id: "books",
    number: "01",
    title: "Books",
    note: "C4",
    color: "#8cf0c6",
    visual: "waveform",
    description:
      "Coloring books, poetry, and health-focused writing for reflection and daily rituals.",
    primaryLabel: "Read poetry book",
    primaryHref: "https://a.co/d/078d1kaa",
    secondaryLabel: "Intro to Quantum",
    secondaryHref: "https://woodyard.streamlit.app/",
    frequency: 261.63,
  },
  {
    id: "apps",
    number: "02",
    title: "Apps",
    note: "E4",
    color: "#8cf0c6",
    visual: "nodes",
    description:
      "Sound-driven AI wellness tools and prototypes focused on mindful interaction.",
    primaryLabel: "Explore AI/ML Projects",
    primaryHref:
      "https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics",
    secondaryLabel: "James Library",
    secondaryHref: "https://github.com/topherchris420/james_library",
    frequency: 329.63,
  },
  {
    id: "art",
    number: "03",
    title: "Art",
    note: "G4",
    color: "#8cf0c6",
    visual: "artwork",
    description:
      "Digital fragments and spatial-computing exhibitions that blend visual poetry with immersion.",
    primaryLabel: "View Oncyber Gallery",
    primaryHref: "https://oncyber.io/stanfordgsb",
    secondaryLabel: "See MADS Gallery Feature",
    secondaryHref:
      "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
    frequency: 392,
  },
  {
    id: "frequency",
    number: "04",
    title: "Frequency",
    note: "C5",
    color: "#8cf0c6",
    visual: "orbit",
    description:
      "A consciousness engine exploring patterned meaning, ritual, and symbolic systems.",
    primaryLabel: "Open Frequency Experience",
    primaryHref: "https://woodyard.dappling.network",
    secondaryLabel: "Read Inspiration Source",
    secondaryHref:
      "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7",
    frequency: 523.25,
  },
  {
    id: "music",
    number: "05",
    title: "Music",
    note: "G3",
    color: "#8cf0c6",
    visual: "spectrum",
    description:
      "Experimental sound compositions under Auditory Geometry with cinematic sonic textures.",
    primaryLabel: "Listen on Bandcamp",
    primaryHref: "https://chriswoodyard.bandcamp.com/",
    secondaryLabel: "Play Featured Track",
    secondaryHref:
      "https://chriswoodyard.bandcamp.com/track/creators-innovators",
    frequency: 196,
  },
];

const {
  createResonanceDetail,
  measureHeadlineEm,
  resolvePreviewChannel,
  selectActiveChannel,
  validateChannels,
} = signalExperience;

validateChannels(projectSections);

const collaborationHeadline = "Make something that resonates.";

const elsewhereLinks = [
  { label: "Music", href: "https://chriswoodyard.bandcamp.com/" },
  { label: "Open Source", href: "https://huggingface.co/ciaochris" },
  {
    label: "Papers",
    href:
      "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
  },
  { label: "Latest build", href: "https://arpa-h.vercel.app/" },
];

const siteUrl = "https://mitpress.vercel.app";
const siteDescription =
  "Christopher Woodyard builds sound-driven wellness, consciousness engines, immersive art, writing, and music through Vers3Dynamics.";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Christopher Woodyard",
  url: `${siteUrl}/`,
  email: "mailto:christopher@vers3dynamics.com",
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    name: "Vers3Dynamics",
    url: "https://vers3dynamics.com/",
  },
  sameAs: [
    "https://chriswoodyard.bandcamp.com/",
    "https://huggingface.co/ciaochris",
    "https://github.com/topherchris420",
    "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
  ],
};

export default function Home() {
  const [scrollChannelId, setScrollChannelId] = useState("hero");
  const [previewChannelId, setPreviewChannelId] = useState(null);
  const effectiveChannelId = resolvePreviewChannel({
    scrollChannel: scrollChannelId,
    previewChannel: previewChannelId,
  });
  const {
    soundEnabled,
    soundAvailable,
    enableSound,
    toggleSound,
    playFrequency,
    stopFrequency,
  } = useSignalAudio();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll("[data-signal-channel]")
    );
    if (!nodes.length || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target.dataset.signalChannel, {
            id: entry.target.dataset.signalChannel,
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            top: entry.boundingClientRect.top,
          });
        });
        setScrollChannelId((previous) =>
          selectActiveChannel(Array.from(visible.values()), previous)
        );
      },
      {
        rootMargin: "-34% 0px -44% 0px",
        threshold: [0.2, 0.35, 0.5, 0.65],
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const channel = projectSections.find(
      ({ id }) => id === effectiveChannelId
    );
    if (!channel) return undefined;

    window.dispatchEvent(
      new CustomEvent("vanta:resonance", {
        detail: createResonanceDetail(channel),
      })
    );
    playFrequency(channel.frequency);
    return stopFrequency;
  }, [effectiveChannelId, playFrequency, stopFrequency]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="/Logo.jpg" />
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Christopher Woodyard" />
        <link rel="canonical" href={`${siteUrl}/`} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Vers3Dynamics" />
        <meta property="og:url" content={`${siteUrl}/`} />
        <meta property="og:title" content="Vers3Dynamics | Christopher" />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:image" content={`${siteUrl}/surreal-sun.png`} />
        <meta
          property="og:image:alt"
          content="Surreal sun artwork by Vers3Dynamics"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${siteUrl}/`} />
        <meta name="twitter:title" content="Vers3Dynamics | Christopher" />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}/surreal-sun.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </Head>

      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <VantaEffectNoSSR className={styles.background} aria-hidden="true" />

      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section
          id="top"
          className={styles.signalHero}
          aria-labelledby="signal-title"
        >
          <div className={styles.heroCopy}>
            <p className={styles.instrumentLabel}>
              Christopher Woodyard / signal architect
            </p>
            <h1 id="signal-title" className={styles.signalTitle}>
              Five mediums.<span>One signal.</span>
            </h1>
            <p className={styles.signalSummary}>
              Sound-driven wellness, consciousness engines, immersive art,
              writing, and music built as one connected practice.
            </p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.signalPrimary}
                onClick={async () => {
                  await enableSound();
                  document.querySelector("#work")?.scrollIntoView();
                }}
              >
                Enter the instrument
              </button>
              <a href="#work" className={styles.signalTextLink}>
                Explore without sound
              </a>
            </div>
            <nav
              className={styles.identityLinks}
              aria-label="Christopher's work"
            >
              <a
                href="https://vers3dynamics.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vers3Dynamics
              </a>
              <a
                href="https://rainlabteam.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                R.A.I.N. Lab
              </a>
              <a
                href="https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976"
                target="_blank"
                rel="noopener noreferrer"
              >
                Papers
              </a>
            </nav>
          </div>
          <DisplayPedestalNoSSR
            className={styles.heroStage}
            onResonance={(detail) =>
              window.dispatchEvent(
                new CustomEvent("vanta:resonance", { detail })
              )
            }
          />
          <p className={styles.scrollCue} aria-hidden="true">
            Scroll to tune
          </p>
        </section>

        <FrequencyRail
          channels={projectSections}
          activeId={effectiveChannelId}
          onPreview={setPreviewChannelId}
          onPreviewEnd={() => setPreviewChannelId(null)}
        />
        <SignalConsole
          channels={projectSections}
          activeId={effectiveChannelId}
          soundEnabled={soundEnabled}
          soundAvailable={soundAvailable}
          onToggleSound={toggleSound}
        />

        <section
          id="work"
          className={styles.signalChannels}
          aria-label="Selected work"
        >
          {projectSections.map((project, index) => (
            <ProjectChannel
              key={project.id}
              project={project}
              index={index}
              active={effectiveChannelId === project.id}
              onPreview={setPreviewChannelId}
              onPreviewEnd={() => setPreviewChannelId(null)}
            />
          ))}
        </section>

        <Reveal
          as="footer"
          id="contact"
          className={styles.signalFooter}
          aria-label="Contact"
          style={{ "--title-em": measureHeadlineEm(collaborationHeadline) }}
        >
          <p className={styles.instrumentLabel}>
            Channel open / collaboration
          </p>
          <h2>{collaborationHeadline}</h2>
          <a
            href="mailto:christopher@vers3dynamics.com"
            className={styles.signalPrimary}
          >
            christopher@vers3dynamics.com
          </a>
          <nav className={styles.footerLinks} aria-label="Elsewhere">
            {elsewhereLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <p>
            {"\u00a9"} {new Date().getFullYear()} Vers3Dynamics / R.A.I.N. Lab
          </p>
        </Reveal>
      </main>

      <ScrollToTop />
    </div>
  );
}

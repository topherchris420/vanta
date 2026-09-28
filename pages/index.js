import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import CustomCursor from "../components/CustomCursor";
import ErrorBoundary from "../components/ErrorBoundary";
import FrequencyRail from "../components/FrequencyRail";
import Intervals from "../components/Intervals";
import Navbar from "../components/Navbar";
import ProjectChannel from "../components/ProjectChannel";
import Reveal from "../components/Reveal";
import ScrollProgress from "../components/ScrollProgress";
import ScrollToTop from "../components/ScrollToTop";
import SignalConsole from "../components/SignalConsole";
import useSignalAudio from "../hooks/useSignalAudio";
import signalExperience from "../lib/signalExperience";
import practiceModel from "../lib/practice";
import practice from "../data/practice";
import workbench from "../lib/research/workbench";
import curatedKnowledge from "../data/research/curatedKnowledge.json";
import styles from "../styles/Home.module.css";

const VantaEffectNoSSR = dynamic(() => import("../components/VantaEffect"), {
  ssr: false,
});

const DisplayPedestalNoSSR = dynamic(
  () => import("../components/DisplayPedestal"),
  { ssr: false }
);

// The canonical content model lives in data/practice.js. This page only
// arranges it; nothing about a channel or a work is restated here.
const { channels: projectSections, works, threads, epigraph, now, person } =
  practice;

const {
  createResonanceDetail,
  measureHeadlineEm,
  resolvePreviewChannel,
  selectActiveChannel,
  shouldReleaseHeldThread,
  validateChannels,
} = signalExperience;
const { threadChannels, threadChord, threadsForWork, validatePractice } =
  practiceModel;

validateChannels(projectSections);
validatePractice(practice);

const worksById = new Map(works.map((work) => [work.id, work]));
const channelsById = new Map(projectSections.map((channel) => [channel.id, channel]));
const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
const nowWork = worksById.get(now.work);
const disciplineCount = workbench.DISCIPLINES.length - 1;

const collaborationHeadline = "Make something that resonates.";

const elsewhereLinks = [
  { label: "GitHub", href: "https://github.com/topherchris420" },
  { label: "Hugging Face", href: "https://huggingface.co/ciaochris" },
  { label: "Bandcamp", href: "https://chriswoodyard.bandcamp.com/" },
  {
    label: "Papers",
    href: "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
  },
  { label: "Vers3Dynamics", href: "https://vers3dynamics.com/" },
];

const siteUrl = "https://mitpress.vercel.app";
const siteDescription =
  "Poems and speculative physics, open research instruments, simulated worlds, paintings, and songs as Indigo People. The practice of Christopher Woodyard.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: person.name,
      url: `${siteUrl}/`,
      email: `mailto:${person.email}`,
      description: person.summary,
      knowsAbout: [
        "Poetry",
        "Speculative physics",
        "Biosignal instrumentation",
        "Time-series analysis",
        "Multi-agent research systems",
        "Simulation",
        "Painting",
        "Music",
      ],
      affiliation: {
        "@type": "Organization",
        name: person.lab.name,
        url: person.lab.url,
        description: "An open-source laboratory for resonant intelligence.",
      },
      sameAs: person.sameAs,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#site`,
      name: "Vanta",
      url: `${siteUrl}/`,
      description: siteDescription,
      author: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function Home() {
  const [scrollChannelId, setScrollChannelId] = useState("hero");
  const [previewChannelId, setPreviewChannelId] = useState(null);
  const [previewThreadId, setPreviewThreadId] = useState(null);
  const [heldThreadId, setHeldThreadId] = useState(null);
  const [recordingPlaying, setRecordingPlaying] = useState(false);
  const effectiveChannelId = resolvePreviewChannel({
    scrollChannel: scrollChannelId,
    previewChannel: previewChannelId,
  });
  const activeThread = threadsById.get(previewThreadId ?? heldThreadId) ?? null;
  const chordIds = useMemo(
    () => (activeThread ? threadChannels(activeThread, works, projectSections) : []),
    [activeThread]
  );
  const {
    soundEnabled,
    soundAvailable,
    enableSound,
    toggleSound,
    playFrequency,
    playChord,
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
            coverage: entry.intersectionRect.height,
            top: entry.boundingClientRect.top,
          });
        });
        setScrollChannelId((previous) =>
          selectActiveChannel(Array.from(visible.values()), previous)
        );
      },
      {
        rootMargin: "-34% 0px -44% 0px",
        // Channels are often taller than the band, so their ratio stays small;
        // a zero threshold still reports every entry and exit.
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5],
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // A held chord belongs to the place it was tuned. Scrolling into a channel
  // releases it, and Escape always does. Arriving in a rest zone does not: the
  // observer can report that arrival after the visitor has already held a chord.
  useEffect(() => {
    if (shouldReleaseHeldThread(scrollChannelId, channelsById)) {
      setHeldThreadId(null);
    }
  }, [scrollChannelId]);

  useEffect(() => {
    if (!heldThreadId) return undefined;
    const release = (event) => {
      if (event.key === "Escape") setHeldThreadId(null);
    };
    window.addEventListener("keydown", release);
    return () => window.removeEventListener("keydown", release);
  }, [heldThreadId]);

  useEffect(() => {
    // A recording is the one sound on the page that is not a tone; while it
    // plays, the instrument stays quiet.
    if (recordingPlaying) {
      stopFrequency();
      return undefined;
    }

    if (activeThread) {
      const chord = threadChord(activeThread, works, projectSections);
      window.dispatchEvent(
        new CustomEvent("vanta:resonance", {
          detail: {
            channelId: "thread-" + activeThread.id,
            color: "#e4b65c",
            frequency: chord[0],
            intensity: 1,
          },
        })
      );
      playChord(chord);
      return stopFrequency;
    }

    const channel = channelsById.get(effectiveChannelId);
    if (!channel) return undefined;

    window.dispatchEvent(
      new CustomEvent("vanta:resonance", {
        detail: createResonanceDetail(channel),
      })
    );
    playFrequency(channel.frequency);
    return stopFrequency;
  }, [
    activeThread,
    effectiveChannelId,
    recordingPlaying,
    playChord,
    playFrequency,
    stopFrequency,
  ]);

  const endChannelPreview = useCallback(() => setPreviewChannelId(null), []);
  const endThreadPreview = useCallback(() => setPreviewThreadId(null), []);
  const toggleHeldThread = useCallback(
    (id) => setHeldThreadId((current) => (current === id ? null : id)),
    []
  );
  const threadsForWorkId = useCallback((id) => threadsForWork(id, threads), []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Christopher Woodyard — Vanta</title>
        <link rel="icon" href="/Logo.jpg" />
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content={person.name} />
        <link rel="canonical" href={`${siteUrl}/`} />

        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="Vanta" />
        <meta property="og:url" content={`${siteUrl}/`} />
        <meta property="og:title" content="Christopher Woodyard — Five notes. One chord." />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:image" content={`${siteUrl}/og-vanta.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Five notes. One chord. Christopher Woodyard's Vanta, with the Event Horizon Archive."
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${siteUrl}/`} />
        <meta name="twitter:title" content="Christopher Woodyard — Five notes. One chord." />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}/og-vanta.jpg`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <ErrorBoundary className={styles.background}>
        <VantaEffectNoSSR className={styles.background} />
      </ErrorBoundary>

      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section
          id="top"
          className={styles.signalHero}
          aria-labelledby="signal-title"
          data-signal-channel="hero"
        >
          <div className={styles.heroCopy}>
            <p className={styles.instrumentLabel}>
              Christopher Woodyard / captain of my soul
            </p>
            <h1 id="signal-title" className={styles.signalTitle}>
              Five notes.<span>One chord.</span>
            </h1>
            <p className={styles.signalSummary}>
              Poems and speculative physics. Open research instruments that
              keep their evidence. Simulated worlds where people and AI agents
              play by the same rules. Paintings, and songs as Indigo People.
            </p>
            <div className={styles.heroActions}>
              <a href="#work" className={styles.signalPrimary}>
                Explore without sound <span aria-hidden="true">↓</span>
              </a>
              <button
                type="button"
                className={styles.signalTextLink}
                aria-describedby="sound-entry-hint"
                onClick={() => {
                  enableSound();
                  document.querySelector("#work")?.scrollIntoView();
                }}
              >
                Enter the instrument
              </button>
            </div>
            <p id="sound-entry-hint" className={styles.entryHint}>
              Enter the instrument adds sound. You can turn it off at any time.
            </p>
            <p className={styles.nowSignal}>
              <span className={styles.nowLabel}>Now</span>
              <a href={`#work-${nowWork.id}`}>{now.text}</a>
            </p>
            <nav
              className={styles.identityLinks}
              aria-label="Where the work lives"
            >
              <a
                href={person.lab.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vers3Dynamics<span className={styles.identityNote}>, the open lab</span>
              </a>
              <a
                href="https://rainlabteam.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                R.A.I.N. Lab
              </a>
              <a
                href="https://github.com/topherchris420"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
            </nav>
          </div>
          <ErrorBoundary className={styles.heroStage}>
            <DisplayPedestalNoSSR
              className={styles.heroStage}
              workCount={works.length}
              recordCount={curatedKnowledge.documents.length}
              onResonance={(detail) =>
                window.dispatchEvent(
                  new CustomEvent("vanta:resonance", { detail })
                )
              }
            />
          </ErrorBoundary>
          <p className={styles.scrollCue} aria-hidden="true">
            Scroll to tune
          </p>
        </section>

        <FrequencyRail
          channels={projectSections}
          activeId={effectiveChannelId}
          chordIds={chordIds}
          onPreview={setPreviewChannelId}
          onPreviewEnd={endChannelPreview}
        />
        <SignalConsole
          channels={projectSections}
          activeId={effectiveChannelId}
          soundEnabled={soundEnabled}
          soundAvailable={soundAvailable}
          thread={activeThread}
          chordSize={chordIds.length}
          onToggleSound={toggleSound}
        />

        <section
          id="work"
          className={styles.signalChannels}
          aria-label="Selected work"
        >
          <div className={styles.workIndex}>
            <div className={styles.workIndexIntro}>
              <p className={styles.instrumentLabel}>Selected work / 01—05</p>
              <h2>Find your frequency.</h2>
              <p>
                Five instruments, one practice. Pick one, or keep scrolling and
                listen for where they repeat each other.
              </p>
            </div>
            <nav className={styles.workIndexLinks} aria-label="Choose an instrument">
              {projectSections.map((project) => (
                <a key={project.id} href={`#signal-${project.id}`}>
                  <span className={styles.workIndexNumber}>{project.number}</span>
                  <span className={styles.workIndexName}>{project.title}</span>
                  <span className={styles.workIndexPreview}>
                    {project.works.map((id) => worksById.get(id).title).join(" · ")}
                  </span>
                  <span className={styles.workIndexArrow} aria-hidden="true">↘</span>
                </a>
              ))}
            </nav>
          </div>
          {projectSections.map((project, index) => (
            <ProjectChannel
              key={project.id}
              project={project}
              index={index}
              active={!activeThread && effectiveChannelId === project.id}
              works={project.works.map((id) => worksById.get(id))}
              channelsById={channelsById}
              threadsForWork={threadsForWorkId}
              onPreview={setPreviewChannelId}
              onPreviewEnd={endChannelPreview}
              onPlaybackChange={setRecordingPlaying}
            />
          ))}
        </section>

        <Intervals
          threads={threads}
          works={works}
          channels={projectSections}
          epigraph={epigraph}
          heldThreadId={heldThreadId}
          threadChannels={(thread) => threadChannels(thread, works, projectSections)}
          onPreview={setPreviewThreadId}
          onPreviewEnd={endThreadPreview}
          onToggleHold={toggleHeldThread}
        />

        <section
          className={styles.researchGateway}
          aria-labelledby="research-gateway-title"
          data-signal-channel="rest"
        >
          <div className={styles.gatewayIntro}>
            <p className={styles.instrumentLabel}>Underneath / Research atlas</p>
            <h2 id="research-gateway-title">An idea is only<br />the beginning.</h2>
            <p>The papers and sources the work keeps returning to, his own
              preprints beside other people&rsquo;s. Every stated link says why
              it is there.</p>
            <a href="/research" className={styles.signalPrimary}>Enter the research atlas <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.gatewayIndex}>
            <div className={styles.gatewayStats}><span><strong>{curatedKnowledge.documents.length}</strong> indexed records</span><span><strong>{String(disciplineCount).padStart(2, "0")}</strong> disciplines</span></div>
            <nav aria-label="Research starting points">
              <a href="/research?q=Dynamic+Location+Theory"><span>01 / Location</span><strong>A theory, and the clocks that bound it</strong><span aria-hidden="true">↗</span></a>
              <a href="/research?q=Dynamic+Resonance+Rooting"><span>02 / Rhythm &amp; lag</span><strong>From paper to failed benchmark</strong><span aria-hidden="true">↗</span></a>
              <a href="/research?q=Oversight"><span>03 / Oversight</span><strong>Who checks the record</strong><span aria-hidden="true">↗</span></a>
            </nav>
            <p>A local catalog for discovery, not verification. Follow the original source before citing.</p>
          </div>
        </section>

        <Reveal
          as="footer"
          id="contact"
          className={styles.signalFooter}
          aria-label="Contact"
          data-signal-channel="rest"
          style={{ "--title-em": measureHeadlineEm(collaborationHeadline) }}
        >
          <p className={styles.instrumentLabel}>
            Channel open / collaboration
          </p>
          <h2>{collaborationHeadline}</h2>
          <a
            href={`mailto:${person.email}`}
            className={styles.signalPrimary}
          >
            {person.email}
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
            {"©"} {new Date().getFullYear()} Christopher Woodyard. Built at
            Vers3Dynamics, the open lab.
          </p>
        </Reveal>
      </main>

      <ScrollToTop />
    </div>
  );
}

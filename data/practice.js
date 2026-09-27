// The canonical content model for Vanta's home page.
//
// Five channels are the five notes. Each carries a few anchor works; every
// work leads with the question it asks, states what actually happened to it
// (status), and links to the thing itself (evidence). Threads are the
// intervals: questions that recur across channels. A thread's chord is simply
// the set of channels its works live in, so it cannot drift from the works.
//
// Rules for editing:
// - Every claim needs a receipt in `evidence`. No receipt, no claim.
// - Status says what happened, never how good it is.
// - A work lives in one channel. `alsoIn` names other channels only when the
//   connection is literal and checkable (the same recording, the same paper).
// - `now` is chosen by hand. Recency is not importance.

const GH = "https://github.com/topherchris420";

const channels = [
  {
    id: "writing",
    number: "01",
    title: "Writing",
    note: "C4",
    frequency: 261.63,
    color: "#8cf0c6",
    visual: "waveform",
    lede: "Verse first. Then papers that say how they could be wrong.",
    works: ["life-of-a-line", "location-papers"],
    artifact: {
      kind: "quote",
      text: "Location is a property of the object.",
      source: "Dynamic Location Theory, the claim the preprints test",
      href: "https://topherchris420.github.io/research/",
    },
  },
  {
    id: "instruments",
    number: "02",
    title: "Instruments",
    note: "E4",
    frequency: 329.63,
    color: "#8cf0c6",
    visual: "nodes",
    lede: "Tools that measure something and keep the receipts, including the ones that say no.",
    works: ["circle", "drr", "rain"],
    artifact: {
      kind: "figure",
      src: "/work/circle-polygraph.webp",
      width: 1200,
      height: 785,
      alt: "CIRCLE polygraph: stacked traces for PPG pulse, heart rate, breathing, SpO2, skin conductance, motion, a controller arousal index and the twin's latent arousal across a six-minute protocol of rest, breath hold, stressor and paced-breathing recovery.",
      caption:
        "CIRCLE twin session. Six minutes: rest, breath hold, stressor, paced-breathing recovery. Every channel is recovered from raw sensor codes and drawn over hidden ground truth. Simulated; no person has been connected.",
      href: `${GH}/circle/blob/main/diagrams/physiology-polygraph.png`,
    },
  },
  {
    id: "worlds",
    number: "03",
    title: "Worlds",
    note: "G4",
    frequency: 392,
    color: "#8cf0c6",
    visual: "orbit",
    lede: "Simulated places where a person and an AI agent share the same controls, the same physics, and the same record.",
    works: ["pine-gap", "lop-nur", "mannahatta"],
    artifact: {
      kind: "figure",
      src: "/work/pine-gap-agent-run.webp",
      width: 960,
      height: 540,
      alt: "Pine Gap: After Hours. A 4x4 drives toward a radome. Panels show the agent's observe, choose, act and outcome steps, the coffee at 100% in the cup holder, and the car radio playing Antigravity by Indigo People.",
      caption:
        "Pine Gap: After Hours. The labelled scripted baseline on the coffee run: observe, choose, act, outcome. Coffee at 100%. On the radio: Antigravity, Indigo People.",
      href: `${GH}/satellite-vision-scape#watch-an-agent-finish-the-whole-mission`,
    },
  },
  {
    id: "art",
    number: "04",
    title: "Art",
    note: "C5",
    frequency: 523.25,
    color: "#8cf0c6",
    visual: "artwork",
    lede: "Paint, rooms, and sound you can look at.",
    works: ["exhibitions", "cymatics", "signal-lab"],
    artifact: {
      kind: "diptych",
      panels: [
        {
          src: "/work/green-machine-cover.webp",
          width: 512,
          height: 512,
          alt: "An abstract painting in teal, red and acid green: a veined, leaf-like form moving through layered colour.",
          caption: "Painting; the cover of Green Machine.",
        },
        {
          src: "/work/cymatics-circular-bloom.webp",
          width: 720,
          height: 720,
          alt: "Copper-coloured particles settled into a circular standing-wave pattern of rings and radial nodes.",
          caption: "Circular bloom, 432 Hz. A still from the Cymatics Space.",
        },
      ],
    },
  },
  {
    id: "music",
    number: "05",
    title: "Music",
    note: "G3",
    frequency: 196,
    color: "#8cf0c6",
    visual: "spectrum",
    lede: "Indigo People. Written by Christopher Woodyard.",
    works: ["green-machine"],
    artifact: {
      kind: "recording",
      src: "/work/green-machine-excerpt.mp3",
      title: "Green Machine",
      credit: "Indigo People, from Green Machine",
      duration: 14,
      // RMS envelope of the excerpt, 96 windows, normalised to its loudest.
      peaks: [
        0.09, 0.227, 0.302, 0.264, 0.387, 0.519, 0.529, 0.392, 0.497, 0.486,
        0.426, 0.453, 0.688, 0.6, 0.597, 0.673, 0.55, 0.644, 0.664, 0.592, 0.61,
        0.399, 0.27, 0.509, 0.549, 0.43, 0.498, 0.682, 0.625, 0.637, 0.986,
        0.876, 0.945, 0.89, 0.754, 0.871, 0.815, 0.757, 0.82, 0.731, 0.725,
        0.783, 0.647, 0.672, 0.733, 0.442, 0.14, 0.112, 0.083, 0.075, 0.488,
        0.466, 0.491, 0.461, 0.457, 0.652, 0.533, 0.404, 0.261, 0.43, 0.5,
        0.534, 0.442, 0.507, 0.476, 0.453, 0.488, 0.638, 0.468, 0.496, 0.558,
        0.459, 0.472, 0.582, 0.516, 0.457, 0.25, 0.214, 0.516, 0.531, 0.348,
        0.524, 0.723, 0.6, 0.685, 1.0, 0.823, 0.738, 0.636, 0.46, 0.436, 0.342,
        0.239, 0.19, 0.103, 0.043,
      ],
    },
  },
];

const works = [
  {
    id: "life-of-a-line",
    channel: "writing",
    title: "Life of a Line",
    year: "2021",
    body: "Thirty pages of introspective verse, in paperback.",
    status: ["Published"],
    evidence: [{ label: "The book", href: "https://a.co/d/078d1kaa" }],
  },
  {
    id: "location-papers",
    channel: "writing",
    title: "Location Is a Dynamic Variable",
    year: "2026",
    question:
      "What if location belonged to the object, not to the space around it?",
    body: "A run of preprints on Dynamic Location Theory. Speculative physics that names its own tests: a follow-up uses 2024–25 atomic-clock comparisons to put an upper bound on the coupling constant the theory depends on.",
    status: ["Preprint", "Speculative"],
    evidence: [
      { label: "Preprint", href: "https://doi.org/10.5281/zenodo.18263032" },
      { label: "The clock bound", href: "https://doi.org/10.5281/zenodo.18285322" },
      { label: "Paper site", href: "https://topherchris420.github.io/research/" },
    ],
    atlas: "Dynamic Location Theory",
  },
  {
    id: "circle",
    channel: "instruments",
    title: "CIRCLE",
    year: "Rev B",
    question:
      "Can a feedback system keep enough evidence to show why it acted?",
    body: "Open biosignal hardware: skin conductance, raw optical pulse, and motion on one clock, with measurement, inference, and intervention recorded as different things.",
    detail:
      "Automated verification passes. Fabrication and human connection stay blocked until the review gates close.",
    status: ["Open source", "Prototype"],
    evidence: [
      { label: "Repository", href: `${GH}/circle` },
      { label: "Review gates", href: `${GH}/circle/blob/main/docs/review-gates.md` },
    ],
    atlas: "CIRCLE",
  },
  {
    id: "drr",
    channel: "instruments",
    title: "Dynamic Resonance Rooting",
    year: "2025–26",
    question:
      "What if a research framework published the test it failed?",
    body: "A Python framework for rhythm and lag in multivariate time series. Its outputs are diagnostics, and the README says a lead–lag edge is not causation.",
    detail: "qbo_structural_change_benchmark.json → claim_status: not_supported",
    detailKind: "trace",
    status: ["Open source", "Paper"],
    evidence: [
      { label: "Repository", href: `${GH}/dynamic-resonance-rooting` },
      {
        label: "The failed benchmark",
        href: `${GH}/dynamic-resonance-rooting/blob/main/docs/external-evidence.md`,
      },
      { label: "OSF", href: "https://doi.org/10.17605/osf.io/32ag9" },
    ],
    atlas: "Dynamic Resonance Rooting",
  },
  {
    id: "rain",
    channel: "instruments",
    title: "R.A.I.N. Lab",
    year: "2026",
    question: "What if an answer could not authorize itself?",
    body: "A local-first research room. Four constrained perspectives argue a question, quotes are checked against the source papers, and the disagreement stays in the transcript.",
    detail: "Its reading corpus includes the location and DRR papers.",
    status: ["Live", "Open source"],
    evidence: [
      { label: "Try it", href: "https://rainlabteam.vercel.app/" },
      { label: "Repository", href: `${GH}/james_library` },
    ],
    alsoIn: ["writing"],
    atlas: "R.A.I.N.",
  },
  {
    id: "pine-gap",
    channel: "worlds",
    title: "Pine Gap",
    year: "2026",
    question:
      "What happens when an AI agent has to obey the same physics as a person?",
    body: "A browser-native reconstruction of the Pine Gap antennas. People, an agent, a scripted baseline, and replays share one input path and one 120 Hz physics loop, and every session exports as a trace.",
    detail:
      "The agent layer cannot move the player, touch the coffee, or mark a task done. Tests enforce it.",
    status: ["Live", "Open source", "Simulation"],
    evidence: [
      { label: "Play", href: "https://geotwn.vercel.app/" },
      { label: "Watch an agent drive", href: "https://geotwn.vercel.app/?controller=mock" },
      { label: "Repository", href: `${GH}/satellite-vision-scape` },
    ],
    alsoIn: ["music"],
  },
  {
    id: "lop-nur",
    channel: "worlds",
    title: "Lop Nur Twin",
    year: "2026",
    question:
      "When a model wins 148 to 0, is that a finding about the model?",
    body: "A desert airfield rebuilt only from cited public sources, and a game standing on the same geometry. A model in the player's seat went 148–0 without moving a metre. A few dozen lines of script went 153–0.",
    detail: "The finding was about the map.",
    status: ["Live", "Open source", "Simulation"],
    evidence: [
      { label: "Open the twin", href: "https://lop-nur-twin.vercel.app/" },
      { label: "Repository", href: `${GH}/lop-nur-twin` },
    ],
    atlas: "Lop Nur",
  },
  {
    id: "mannahatta",
    channel: "worlds",
    title: "Mannahatta",
    year: "2026",
    question:
      "Can one city block be read as what was, what is, and what could be?",
    body: "Satellite land cover, a routed storm, and a counterfactual redesign under the same rain. Each frame is labelled with what it does not establish.",
    status: ["Live", "Open source", "Experiment"],
    evidence: [
      { label: "Open", href: "https://phaseroot.vercel.app/" },
      { label: "Repository", href: `${GH}/cognisync-terrain-weaver` },
    ],
  },
  {
    id: "exhibitions",
    channel: "art",
    title: "Rooms",
    body: "A walkable gallery on Oncyber, and an artist feature with M.A.D.S. Art Gallery in Italy.",
    status: ["Exhibited"],
    evidence: [
      { label: "Oncyber room", href: "https://oncyber.io/stanfordgsb" },
      {
        label: "M.A.D.S. feature",
        href: "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
      },
    ],
  },
  {
    id: "cymatics",
    channel: "art",
    title: "Cymatics",
    question: "What does a word look like as a standing wave?",
    body: "Type a word, hum a tone, or play a file. Twenty thousand particles settle into its pattern.",
    status: ["Live"],
    evidence: [
      {
        label: "Play with it",
        href: "https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics",
      },
    ],
  },
  {
    id: "signal-lab",
    channel: "art",
    title: "Signal Lab",
    body: "A waveform console you play by scrolling.",
    status: ["Live"],
    evidence: [{ label: "Scroll it", href: "https://woodyard.dappling.network" }],
  },
  {
    id: "green-machine",
    channel: "music",
    title: "Green Machine",
    body: "Five tracks as Indigo People. The same album is the station on the car radio in Pine Gap, and the cover is a painting.",
    status: ["Recorded"],
    evidence: [
      { label: "Bandcamp", href: "https://chriswoodyard.bandcamp.com/" },
      {
        label: "Creators & Innovators",
        href: "https://chriswoodyard.bandcamp.com/track/creators-innovators",
      },
    ],
    alsoIn: ["worlds", "art"],
  },
];

// Intervals: questions the practice keeps returning to. Only list a work here
// when the work itself states the concern in its own documentation.
const threads = [
  {
    id: "provenance",
    name: "Provenance",
    question: "Can you check where it came from?",
    works: ["location-papers", "circle", "drr", "rain", "pine-gap", "lop-nur"],
  },
  {
    id: "agency",
    name: "Agency",
    question: "What belongs to the machine, and what stays with the person?",
    works: ["rain", "circle", "pine-gap", "lop-nur"],
    coda: "Two notes. The third is held by a person.",
  },
  {
    id: "translation",
    name: "Translation",
    question: "What survives the move from one signal to another?",
    works: ["cymatics", "circle", "mannahatta", "green-machine"],
  },
  {
    id: "resonance",
    name: "Resonance",
    question: "What repeats, and what does the repetition mean?",
    works: ["location-papers", "drr", "cymatics", "green-machine"],
  },
];

// The one sentence the practice would put above all of it, in Christopher's
// own words, with its source.
const epigraph = {
  text: "A detected pattern cannot, by itself, establish its meaning for a person or permission to intervene.",
  source: "Resonant Intelligence, 2026",
  href: `${GH}/james_library/blob/main/papers/Resonant%20Intelligence.md`,
};

// Chosen by hand. Update when attention moves, not when a commit lands.
const now = {
  work: "circle",
  text: "CIRCLE Rev B, waiting on its review gates before anything touches skin.",
  asOf: "2026-09",
};

const person = {
  name: "Christopher Woodyard",
  url: "https://mitpress.vercel.app/",
  email: "christopher@vers3dynamics.com",
  summary:
    "Christopher Woodyard writes poems and speculative physics, builds open research instruments and simulated worlds, paints, and records as Indigo People. Vers3Dynamics is the open lab where most of it is built.",
  lab: { name: "Vers3Dynamics", url: "https://vers3dynamics.com/" },
  sameAs: [
    "https://github.com/topherchris420",
    "https://huggingface.co/ciaochris",
    "https://chriswoodyard.bandcamp.com/",
    "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
    "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
  ],
};

module.exports = { channels, works, threads, epigraph, now, person };

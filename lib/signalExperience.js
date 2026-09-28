const SOUND_PREF_KEY = "vanta-signal-muted";

const parseMutedPreference = (value) => value === "1";

const clampUnitInterval = (value) =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;

// Document scroll depth as 0..1 so the top meter and the rail trace can both
// read one published value instead of measuring the page twice.
const computeScrollProgress = ({ scrollTop, scrollHeight, viewportHeight }) => {
  const scrollable = scrollHeight - viewportHeight;

  if (!Number.isFinite(scrollable) || scrollable <= 0) {
    return 0;
  }

  return clampUnitInterval(scrollTop / scrollable);
};

// The channel that fills most of the reading band wins. `coverage` is the
// height of the band a channel occupies; a tall channel and a short one are
// compared by what the visitor is actually looking at, not by what fraction of
// each is on screen. Entries without it fall back to intersection ratio.
const selectActiveChannel = (entries, fallbackId) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort(
      (left, right) =>
        (right.coverage ?? right.intersectionRatio) -
          (left.coverage ?? left.intersectionRatio) ||
        Math.abs(left.top) - Math.abs(right.top)
    );

  return visible[0]?.id ?? fallbackId;
};

// Only tuning into a real channel lets go of a held thread; the hero and rest
// zones leave it sounding. `channels` is a Map or array of channels (or ids).
const shouldReleaseHeldThread = (scrollChannelId, channels) => {
  const ids = channels instanceof Map
    ? new Set(channels.keys())
    : new Set((channels ?? []).map((channel) => channel.id ?? channel));
  return ids.has(scrollChannelId);
};

const resolvePreviewChannel = ({ scrollChannel, previewChannel }) =>
  previewChannel ?? scrollChannel;

const didFocusLeaveChannel = (container, relatedTarget) =>
  !container || !relatedTarget || !container.contains(relatedTarget);

const {
  isMobileDevice,
  prefersReducedMotion,
  supportsWebGL,
  shouldUseWebGL,
  getSafePixelRatio,
} = require("./runtimeCapabilities");

const resolveRenderMode = ({
  webglAvailable,
  reducedMotion,
  isMobile,
  visible,
}) => {
  if (webglAvailable === false || isMobile || reducedMotion) return "css-fallback";
  if (visible === false) return "paused";
  return "continuous";
};

const resolveWebGLPixelRatio = (devicePixelRatio, isMobile) =>
  getSafePixelRatio(devicePixelRatio, isMobile);

const resolvePedestalMode = ({
  webglAvailable,
  reducedMotion,
  isMobile,
  inViewport,
  visible,
}) => {
  if (webglAvailable === false || isMobile || reducedMotion) return "css-fallback";
  if (visible === false || inViewport === false) return "paused";
  return "continuous";
};

const resolveCursorEnabled = ({ finePointer, reducedMotion, visible }) =>
  Boolean(finePointer && !reducedMotion && visible);

// How much geometry the hero's Event Horizon Archive is allowed to build.
// Reduced-motion and mobile visitors only ever see a single static frame, so
// they get the cheap tier: the same composition, built from less of everything.
const ARCHIVE_DETAIL = {
  full: {
    stars: 1500,
    latticeRings: 26,
    latticeSpokes: 96,
    latticeSegments: 128,
    platterSegments: 256,
    platterTracks: 26,
    streamFilaments: 26,
    streamLength: 110,
  },
  reduced: {
    stars: 420,
    latticeRings: 15,
    latticeSpokes: 40,
    latticeSegments: 64,
    platterSegments: 128,
    platterTracks: 16,
    streamFilaments: 12,
    streamLength: 40,
  },
};

const resolveArchiveDetail = ({ isMobile, reducedMotion }) =>
  ARCHIVE_DETAIL[isMobile || reducedMotion ? "reduced" : "full"];

const validateChannels = (channels) => {
  if (!Array.isArray(channels) || channels.length !== 5) {
    throw new Error("Signal experience requires exactly five channels.");
  }

  const ids = new Set();

  channels.forEach((channel, index) => {
    if (!channel.id || ids.has(channel.id)) {
      throw new Error("Each signal requires a unique channel id.");
    }

    ids.add(channel.id);

    if (channel.number !== String(index + 1).padStart(2, "0")) {
      throw new Error("Signal channel numbers must run from 01 through 05.");
    }

    if (!Number.isFinite(channel.frequency) || channel.frequency <= 0) {
      throw new Error("Every signal requires a positive frequency.");
    }

    // Evidence now lives on the works each channel carries; lib/practice.js
    // checks every receipt. A channel only has to be tunable.
    if (!channel.title) {
      throw new Error("Every signal requires a title.");
    }
  });

  return true;
};

const createResonanceDetail = (channel) => ({
  channelId: channel.id,
  color: channel.color,
  frequency: channel.frequency,
  intensity: 1,
});

// `chordIds` lists the channels a tuned thread spans. They light together on
// the rail, which is how an interval is shown without a diagram.
const createFrequencyRailItems = (channels, activeId, chordIds = []) => {
  validateChannels(channels);
  const chord = new Set(chordIds);

  return [
    {
      // The hero is a tunable stop like any other: selecting it returns the
      // instrument to rest, which stops sound and reports Standby.
      id: "hero",
      previewId: "hero",
      href: "#top",
      number: "00",
      label: "Signal",
      active: activeId === "hero",
      current: activeId === "hero" ? "location" : undefined,
    },
    ...channels.map((channel) => ({
      id: channel.id,
      previewId: channel.id,
      href: "#signal-" + channel.id,
      number: channel.number,
      label: channel.title,
      active: activeId === channel.id,
      chord: chord.has(channel.id),
      current: activeId === channel.id ? "location" : undefined,
    })),
  ];
};

// Arrow, Home, and End keys tune between rail stops; every other key is left to
// the browser so the rail never swallows normal page interaction.
const resolveRailKeyIndex = ({ key, index, count }) => {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1) {
    return null;
  }

  if (index < 0 || index >= count) {
    return null;
  }

  switch (key) {
    case "ArrowDown":
    case "ArrowRight":
      return (index + 1) % count;
    case "ArrowUp":
    case "ArrowLeft":
      return (index + count - 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
};

// Upper bound on how many ems of width one character of the display face
// occupies at its tracked letter-spacing.
const HEADLINE_EM_PER_CHARACTER = 1.16;

// Display headlines only break between words, so the longest single word decides
// the largest size that still fits. CSS divides the available width by this to
// shrink a headline such as "Frequency" instead of letting it overflow.
const measureHeadlineEm = (text) => {
  const longestWord = String(text ?? "")
    .split(/\s+/)
    .reduce((longest, word) => Math.max(longest, word.length), 0);

  return Number(
    (Math.max(longestWord, 1) * HEADLINE_EM_PER_CHARACTER).toFixed(2)
  );
};

const createProjectChannelView = (project, index, active) => ({
  sectionId: "signal-" + project.id,
  headingId: "signal-title-" + project.id,
  direction: index % 2 ? "reverse" : "forward",
  active,
  statusLabel: active ? "SIGNAL ACTIVE" : "STANDBY",
  titleEm: measureHeadlineEm(project.title),
  frequencyLabel: project.frequency.toFixed(2) + " Hz",
});

// How a note or a chord is voiced: lowest note first, rolled by a few
// milliseconds, each voice sharing the level so a chord is never louder than a
// single note is allowed to be. The audio hook only schedules what this says.
const CHORD_ROLL_SECONDS = 0.045;
const SINGLE_NOTE_LEVEL = 0.09;
const CHORD_LEVEL = 0.12;
const RELEASE_SECONDS = 0.12;

const createChordVoicing = (frequencies) => {
  const notes = (Array.isArray(frequencies) ? frequencies : [frequencies])
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  const chord = notes.length > 1;

  return {
    level: chord ? CHORD_LEVEL : SINGLE_NOTE_LEVEL,
    attack: chord ? 0.18 : 0.08,
    release: RELEASE_SECONDS,
    voices: notes.map((frequency, index) => ({
      frequency,
      gain: 1 / notes.length,
      delay: index * CHORD_ROLL_SECONDS,
    })),
  };
};

const SOUND_LABELS = {
  unavailable: "Sound unavailable",
  on: "Sound on",
  off: "Sound off",
};

// One readout for the fixed console: which channel currently conducts the page,
// and what the single sound control is allowed to say about itself.
const createSignalConsoleView = ({
  channels,
  activeId,
  soundEnabled,
  soundAvailable,
  thread = null,
  chordSize = 0,
}) => {
  const channel = thread ? null : (channels ?? []).find(({ id }) => id === activeId);
  const soundState = !soundAvailable
    ? "unavailable"
    : soundEnabled
      ? "on"
      : "off";

  if (thread) {
    return {
      tuned: true,
      channelNumber: "∿",
      channelLabel: thread.name,
      frequencyLabel: chordSize + (chordSize === 1 ? " note" : " notes"),
      soundState,
      soundLabel: SOUND_LABELS[soundState],
    };
  }

  return {
    tuned: Boolean(channel),
    channelNumber: channel ? channel.number : "00",
    channelLabel: channel ? channel.title : "Signal",
    frequencyLabel: channel ? channel.frequency.toFixed(2) + " Hz" : "Standby",
    soundState,
    soundLabel: SOUND_LABELS[soundState],
  };
};

module.exports = {
  ARCHIVE_DETAIL,
  RELEASE_SECONDS,
  SOUND_PREF_KEY,
  computeScrollProgress,
  createChordVoicing,
  createFrequencyRailItems,
  createProjectChannelView,
  createResonanceDetail,
  createSignalConsoleView,
  didFocusLeaveChannel,
  measureHeadlineEm,
  parseMutedPreference,
  resolveArchiveDetail,
  resolveCursorEnabled,
  resolvePedestalMode,
  resolvePreviewChannel,
  resolveRailKeyIndex,
  resolveRenderMode,
  resolveWebGLPixelRatio,
  selectActiveChannel,
  shouldReleaseHeldThread,
  validateChannels,
};

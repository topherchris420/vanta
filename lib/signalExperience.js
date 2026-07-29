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

const selectActiveChannel = (entries, fallbackId) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort(
      (left, right) =>
        right.intersectionRatio - left.intersectionRatio ||
        Math.abs(left.top) - Math.abs(right.top)
    );

  return visible[0]?.id ?? fallbackId;
};

const resolvePreviewChannel = ({ scrollChannel, previewChannel }) =>
  previewChannel ?? scrollChannel;

const didFocusLeaveChannel = (container, relatedTarget) =>
  !container || !relatedTarget || !container.contains(relatedTarget);

const resolveRenderMode = ({
  webglAvailable,
  reducedMotion,
  isMobile,
  visible,
}) => {
  if (!webglAvailable) return "css-fallback";
  if (!visible) return "paused";
  if (reducedMotion || isMobile) return "static";
  return "continuous";
};

const resolveWebGLPixelRatio = (devicePixelRatio, isMobile) => {
  const normalized =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;

  return Math.min(normalized, isMobile ? 1.5 : 2);
};

const resolvePedestalMode = ({
  webglAvailable,
  reducedMotion,
  inViewport,
  visible,
}) => {
  if (!webglAvailable) return "css-fallback";
  if (!visible || !inViewport) return "paused";
  if (reducedMotion) return "static";
  return "continuous";
};

const resolveCursorEnabled = ({ finePointer, reducedMotion, visible }) =>
  Boolean(finePointer && !reducedMotion && visible);

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

    [channel.primaryHref, channel.secondaryHref].forEach((href) => {
      if (!URL.canParse(href)) {
        throw new Error("Every signal requires two valid evidence URLs.");
      }
    });
  });

  return true;
};

const createResonanceDetail = (channel) => ({
  channelId: channel.id,
  color: channel.color,
  frequency: channel.frequency,
  intensity: 1,
});

const createFrequencyRailItems = (channels, activeId) => {
  validateChannels(channels);

  return [
    {
      id: "hero",
      previewId: null,
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
  evidenceLinks: [
    { href: project.primaryHref, label: project.primaryLabel },
    { href: project.secondaryHref, label: project.secondaryLabel },
  ],
});

// One readout for the fixed console: which channel currently conducts the page,
// and what the single sound control is allowed to say about itself.
const createSignalConsoleView = ({
  channels,
  activeId,
  soundEnabled,
  soundAvailable,
}) => {
  const channel = (channels ?? []).find(({ id }) => id === activeId);
  const soundState = !soundAvailable
    ? "unavailable"
    : soundEnabled
      ? "on"
      : "off";

  return {
    tuned: Boolean(channel),
    channelNumber: channel ? channel.number : "00",
    channelLabel: channel ? channel.title : "Signal",
    frequencyLabel: channel ? channel.frequency.toFixed(2) + " Hz" : "Standby",
    soundState,
    soundLabel: {
      unavailable: "Sound unavailable",
      on: "Sound on",
      off: "Sound off",
    }[soundState],
  };
};

module.exports = {
  SOUND_PREF_KEY,
  computeScrollProgress,
  createFrequencyRailItems,
  createProjectChannelView,
  createResonanceDetail,
  createSignalConsoleView,
  didFocusLeaveChannel,
  measureHeadlineEm,
  parseMutedPreference,
  resolveCursorEnabled,
  resolvePedestalMode,
  resolvePreviewChannel,
  resolveRailKeyIndex,
  resolveRenderMode,
  resolveWebGLPixelRatio,
  selectActiveChannel,
  validateChannels,
};

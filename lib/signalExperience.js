const SOUND_PREF_KEY = "vanta-signal-muted";

const parseMutedPreference = (value) => value === "1";

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
      current: activeId === "hero" ? "location" : undefined,
    },
    ...channels.map((channel) => ({
      id: channel.id,
      previewId: channel.id,
      href: "#signal-" + channel.id,
      number: channel.number,
      label: channel.title,
      current: activeId === channel.id ? "location" : undefined,
    })),
  ];
};

const createProjectChannelView = (project, index, active) => ({
  sectionId: "signal-" + project.id,
  headingId: "signal-title-" + project.id,
  direction: index % 2 ? "reverse" : "forward",
  active,
  frequencyLabel: project.frequency.toFixed(2) + " Hz",
  evidenceLinks: [
    { href: project.primaryHref, label: project.primaryLabel },
    { href: project.secondaryHref, label: project.secondaryLabel },
  ],
});

module.exports = {
  SOUND_PREF_KEY,
  createFrequencyRailItems,
  createProjectChannelView,
  createResonanceDetail,
  parseMutedPreference,
  resolvePreviewChannel,
  resolveRenderMode,
  selectActiveChannel,
  validateChannels,
};

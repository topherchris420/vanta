// How much the studio is allowed to cost. Three tiers, one governor that only
// ever steps down on its own, and the policy that decides when the renderer
// runs at all. Pure, so the runtime contract is checked in node.

const { getSafePixelRatio } = require("../runtimeCapabilities");

const TIER_ORDER = ["low", "medium", "high"];

const TIERS = {
  high: {
    id: "high",
    label: "High",
    pixelRatio: 2,
    shadowMapSize: 2048,
    softShadows: true,
    accentLights: true,
    environment: true,
    plateParticles: 9000,
    dust: 420,
    archiveDetail: "full",
    textureSize: 1024,
    anisotropy: 8,
    frameInterval: 0,
  },
  medium: {
    id: "medium",
    label: "Balanced",
    pixelRatio: 1.5,
    shadowMapSize: 1024,
    softShadows: true,
    accentLights: true,
    environment: true,
    plateParticles: 5000,
    dust: 200,
    archiveDetail: "full",
    textureSize: 512,
    anisotropy: 4,
    frameInterval: 0,
  },
  low: {
    id: "low",
    label: "Light",
    pixelRatio: 1,
    shadowMapSize: 0,
    softShadows: false,
    accentLights: false,
    environment: false,
    plateParticles: 2200,
    dust: 0,
    archiveDetail: "reduced",
    textureSize: 512,
    anisotropy: 1,
    // Thirty frames a second is enough to walk by, and half the battery.
    frameInterval: 1 / 30,
  },
};

// Where a device starts. Phones and small-memory machines start light; the
// visitor can always choose otherwise, and the governor can still step down.
const initialTier = ({
  isMobile = false,
  reducedMotion = false,
  deviceMemory,
  hardwareConcurrency,
} = {}) => {
  if (isMobile) return "low";
  if (reducedMotion) return "medium";
  if (Number.isFinite(deviceMemory) && deviceMemory <= 4) return "medium";
  if (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4) return "medium";
  return "high";
};

const lowerTier = (tier) => {
  const index = TIER_ORDER.indexOf(tier);
  return index > 0 ? TIER_ORDER[index - 1] : null;
};

const resolveStudioPixelRatio = (devicePixelRatio, tier, isMobile = false) =>
  Math.min(
    getSafePixelRatio(devicePixelRatio, isMobile),
    (TIERS[tier] ?? TIERS.low).pixelRatio
  );

// Watches frame times and asks for a cheaper tier when the studio cannot hold
// its frame rate. It never asks for a richer one: a machine that struggled a
// minute ago is not owed a second attempt mid-walk.
const createFrameGovernor = ({
  windowSize = 90,
  slowFrameMs = 30,
  warmupFrames = 45,
} = {}) => {
  let samples = [];
  let seen = 0;
  return {
    sample(frameMs) {
      if (!Number.isFinite(frameMs) || frameMs <= 0) return null;
      seen += 1;
      if (seen <= warmupFrames) return null;
      // One long frame (a tab switch, a shader compile) is not a trend.
      samples.push(Math.min(frameMs, 120));
      if (samples.length < windowSize) return null;
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      samples = [];
      return average > slowFrameMs ? "down" : null;
    },
    reset() {
      samples = [];
      seen = 0;
    },
  };
};

// When the renderer runs.
//   fallback    no WebGL: the text index is the studio
//   paused      nothing to show: hidden tab, or an opaque interface covers it
//   on-demand   reduced motion: a frame only when something changed
//   continuous  the room is alive
const resolveStudioMode = ({
  webglAvailable,
  visible = true,
  covered = false,
  reducedMotion = false,
}) => {
  if (webglAvailable === false) return "fallback";
  if (visible === false || covered) return "paused";
  if (reducedMotion) return "on-demand";
  return "continuous";
};

module.exports = {
  TIERS,
  TIER_ORDER,
  createFrameGovernor,
  initialTier,
  lowerTier,
  resolveStudioMode,
  resolveStudioPixelRatio,
};

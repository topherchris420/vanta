const assert = require("node:assert/strict");
const test = require("node:test");
const quality = require("../lib/studio/quality");

test("tiers get cheaper in every dimension that costs frames", () => {
  const { high, medium, low } = quality.TIERS;
  ["pixelRatio", "shadowMapSize", "plateParticles", "dust", "anisotropy"].forEach((key) => {
    assert.ok(high[key] >= medium[key], `${key}: high >= medium`);
    assert.ok(medium[key] >= low[key], `${key}: medium >= low`);
  });
  assert.equal(low.shadowMapSize, 0, "the light tier casts no shadows");
  assert.equal(low.archiveDetail, "reduced");
  assert.ok(low.frameInterval > 0, "the light tier caps its frame rate");
  assert.equal(high.frameInterval, 0);
});

test("devices start where they can hold a frame rate", () => {
  assert.equal(quality.initialTier({}), "high");
  assert.equal(quality.initialTier({ isMobile: true }), "low");
  assert.equal(quality.initialTier({ reducedMotion: true }), "medium");
  assert.equal(quality.initialTier({ deviceMemory: 4 }), "medium");
  assert.equal(quality.initialTier({ hardwareConcurrency: 2 }), "medium");
  assert.equal(quality.initialTier({ isMobile: true, deviceMemory: 16 }), "low");
});

test("pixel ratio never exceeds the site-wide caps or the tier", () => {
  assert.equal(quality.resolveStudioPixelRatio(3, "high", false), 2);
  assert.equal(quality.resolveStudioPixelRatio(3, "high", true), 1.5);
  assert.equal(quality.resolveStudioPixelRatio(3, "medium", false), 1.5);
  assert.equal(quality.resolveStudioPixelRatio(3, "low", true), 1);
  assert.equal(quality.resolveStudioPixelRatio(undefined, "high", false), 1);
  assert.equal(quality.resolveStudioPixelRatio(2, "unknown", false), 1);
});

test("the governor steps down on a sustained slow run and never on a blip", () => {
  const governor = quality.createFrameGovernor({ windowSize: 30, warmupFrames: 5 });
  for (let frame = 0; frame < 5; frame += 1) assert.equal(governor.sample(200), null, "warm-up is ignored");

  let verdict = null;
  for (let frame = 0; frame < 30; frame += 1) verdict = governor.sample(frame === 3 ? 400 : 16);
  assert.equal(verdict, null, "one long frame in a smooth run changes nothing");

  for (let frame = 0; frame < 30; frame += 1) verdict = governor.sample(42);
  assert.equal(verdict, "down");

  assert.equal(governor.sample(Number.NaN), null);
  assert.equal(quality.lowerTier("high"), "medium");
  assert.equal(quality.lowerTier("medium"), "low");
  assert.equal(quality.lowerTier("low"), null, "there is nothing below light");
});

test("the renderer runs only when there is something to see", () => {
  const mode = (overrides) =>
    quality.resolveStudioMode({ webglAvailable: true, ...overrides });
  assert.equal(mode({}), "continuous");
  assert.equal(mode({ visible: false }), "paused");
  assert.equal(mode({ covered: true }), "paused", "an opaque desktop pauses the room behind it");
  assert.equal(mode({ reducedMotion: true }), "on-demand");
  assert.equal(mode({ reducedMotion: true, visible: false }), "paused");
  assert.equal(mode({ webglAvailable: false }), "fallback");
  assert.equal(mode({ webglAvailable: false, visible: false }), "fallback");
});

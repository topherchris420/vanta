const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const makeChannel = (id, number, frequency) => ({
  id,
  number,
  color: "#8cf0c6",
  frequency,
  primaryHref: "https://example.com/" + id,
  secondaryHref: "https://example.com/" + id + "/secondary",
});
const channels = [
  makeChannel("books", "01", 261.63),
  makeChannel("apps", "02", 329.63),
  makeChannel("art", "03", 392),
  makeChannel("frequency", "04", 523.25),
  makeChannel("music", "05", 196),
];

test("mute preference defaults to silent", () => {
  assert.equal(signal.SOUND_PREF_KEY, "vanta-signal-muted");
  assert.equal(signal.parseMutedPreference("1"), true);
  assert.equal(signal.parseMutedPreference("0"), false);
  assert.equal(signal.parseMutedPreference(null), false);
});

test("active channel uses strongest visibility then nearest reading line", () => {
  assert.equal(
    signal.selectActiveChannel([
      { id: "books", isIntersecting: true, intersectionRatio: 0.32, top: 90 },
      { id: "apps", isIntersecting: true, intersectionRatio: 0.61, top: 260 },
    ], "books"),
    "apps"
  );
  assert.equal(
    signal.selectActiveChannel([
      { id: "books", isIntersecting: true, intersectionRatio: 0.5, top: -210 },
      { id: "apps", isIntersecting: true, intersectionRatio: 0.5, top: 48 },
    ], "books"),
    "apps"
  );
  assert.equal(signal.selectActiveChannel([], "books"), "books");
});

test("preview state overrides and restores scroll state", () => {
  assert.equal(signal.resolvePreviewChannel({
    scrollChannel: "books",
    previewChannel: "art",
  }), "art");
  assert.equal(signal.resolvePreviewChannel({
    scrollChannel: "books",
    previewChannel: null,
  }), "books");
});

test("render policy covers every runtime mode", () => {
  const mode = (overrides) => signal.resolveRenderMode({
    webglAvailable: true,
    reducedMotion: false,
    isMobile: false,
    visible: true,
    ...overrides,
  });
  assert.equal(mode({ webglAvailable: false }), "css-fallback");
  assert.equal(mode({ visible: false }), "paused");
  assert.equal(mode({ reducedMotion: true }), "static");
  assert.equal(mode({ isMobile: true }), "static");
  assert.equal(mode({}), "continuous");
});

test("channel validation rejects incomplete or duplicate data", () => {
  assert.equal(signal.validateChannels(channels), true);
  assert.throws(() => signal.validateChannels(channels.slice(0, 4)), /five/);
  assert.throws(
    () => signal.validateChannels([...channels.slice(0, 4), channels[0]]),
    /unique/
  );
});

test("resonance detail exposes the stable event contract", () => {
  assert.deepEqual(signal.createResonanceDetail(channels[4]), {
    channelId: "music",
    color: "#8cf0c6",
    frequency: 196,
    intensity: 1,
  });
});

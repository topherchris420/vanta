const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const makeChannel = (id, number, frequency) => ({
  id,
  number,
  title: id[0].toUpperCase() + id.slice(1),
  color: "#8cf0c6",
  frequency,
});
const channels = [
  makeChannel("writing", "01", 261.63),
  makeChannel("instruments", "02", 329.63),
  makeChannel("worlds", "03", 392),
  makeChannel("art", "04", 523.25),
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

test("tall channels are compared by how much of the reading band they fill", () => {
  // A long channel shows a tiny fraction of itself in the band; a short rest
  // zone shows most of itself. The one covering more of the band wins.
  assert.equal(
    signal.selectActiveChannel([
      { id: "instruments", isIntersecting: true, intersectionRatio: 0.04, coverage: 170, top: -900 },
      { id: "rest", isIntersecting: true, intersectionRatio: 0.3, coverage: 28, top: 410 },
    ], "writing"),
    "instruments"
  );
  assert.equal(
    signal.selectActiveChannel([
      { id: "instruments", isIntersecting: false, intersectionRatio: 0, coverage: 0, top: -1800 },
      { id: "worlds", isIntersecting: true, intersectionRatio: 0.02, coverage: 198, top: 120 },
    ], "instruments"),
    "worlds"
  );
});

test("a chord is rolled from the lowest note and never louder than its budget", () => {
  const single = signal.createChordVoicing([392]);
  assert.equal(single.voices.length, 1);
  assert.equal(single.voices[0].gain, 1);
  assert.equal(single.voices[0].delay, 0);
  assert.ok(single.level <= 0.09);

  const chord = signal.createChordVoicing([523.25, 261.63, 392, Number.NaN, -4]);
  assert.deepEqual(chord.voices.map((voice) => voice.frequency), [261.63, 392, 523.25]);
  const total = chord.voices.reduce((sum, voice) => sum + voice.gain, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, "voices share one level");
  assert.ok(chord.voices.every((voice, index) => index === 0 || voice.delay > chord.voices[index - 1].delay));
  assert.ok(chord.level <= 0.12);
  assert.equal(chord.release, signal.RELEASE_SECONDS);

  assert.equal(signal.createChordVoicing([]).voices.length, 0);
  assert.equal(signal.createChordVoicing(null).voices.length, 0);
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
  assert.equal(mode({ reducedMotion: true }), "css-fallback");
  assert.equal(mode({ isMobile: true }), "css-fallback");
  assert.equal(mode({}), "continuous");
});

test("channel validation rejects incomplete or duplicate data", () => {
  assert.equal(signal.validateChannels(channels), true);
  assert.throws(() => signal.validateChannels(channels.slice(0, 4)), /five/);
  assert.throws(
    () => signal.validateChannels([...channels.slice(0, 4), channels[0]]),
    /unique/
  );
  assert.throws(
    () =>
      signal.validateChannels([
        ...channels.slice(0, 4),
        { ...channels[4], title: "" },
      ]),
    /title/
  );
  assert.throws(
    () =>
      signal.validateChannels([
        ...channels.slice(0, 4),
        { ...channels[4], frequency: 0 },
      ]),
    /frequency/
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

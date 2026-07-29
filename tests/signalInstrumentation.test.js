const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const channels = [
  { id: "books", number: "01", title: "Books", frequency: 261.63 },
  { id: "apps", number: "02", title: "Apps", frequency: 329.63 },
  { id: "art", number: "03", title: "Art", frequency: 392 },
  { id: "frequency", number: "04", title: "Frequency", frequency: 523.25 },
  { id: "music", number: "05", title: "Music", frequency: 196 },
];

test("scroll progress reports a clamped unit interval", () => {
  const progress = (overrides) =>
    signal.computeScrollProgress({
      scrollTop: 0,
      scrollHeight: 3000,
      viewportHeight: 1000,
      ...overrides,
    });

  assert.equal(progress({}), 0);
  assert.equal(progress({ scrollTop: 1000 }), 0.5);
  assert.equal(progress({ scrollTop: 2000 }), 1);
  assert.equal(progress({ scrollTop: 5000 }), 1);
  assert.equal(progress({ scrollTop: -400 }), 0);
});

test("scroll progress stays zero when the document cannot scroll", () => {
  const progress = (overrides) =>
    signal.computeScrollProgress({
      scrollTop: 120,
      scrollHeight: 800,
      viewportHeight: 800,
      ...overrides,
    });

  assert.equal(progress({}), 0);
  assert.equal(progress({ scrollHeight: 600 }), 0);
  assert.equal(progress({ scrollHeight: Number.NaN }), 0);
  assert.equal(progress({ viewportHeight: undefined }), 0);
  assert.equal(progress({ scrollTop: Number.NaN, scrollHeight: 1600 }), 0);
});

test("console readout reports the tuned channel and falls back to the hero", () => {
  const heroView = signal.createSignalConsoleView({
    channels,
    activeId: "hero",
    soundEnabled: false,
    soundAvailable: true,
  });

  assert.equal(heroView.tuned, false);
  assert.equal(heroView.channelNumber, "00");
  assert.equal(heroView.channelLabel, "Signal");
  assert.equal(heroView.frequencyLabel, "Standby");

  const musicView = signal.createSignalConsoleView({
    channels,
    activeId: "music",
    soundEnabled: false,
    soundAvailable: true,
  });

  assert.equal(musicView.tuned, true);
  assert.equal(musicView.channelNumber, "05");
  assert.equal(musicView.channelLabel, "Music");
  assert.equal(musicView.frequencyLabel, "196.00 Hz");
});

test("console sound label reflects exactly the three contracted states", () => {
  const label = (soundEnabled, soundAvailable) =>
    signal.createSignalConsoleView({
      channels,
      activeId: "art",
      soundEnabled,
      soundAvailable,
    });

  assert.equal(label(false, true).soundLabel, "Sound off");
  assert.equal(label(false, true).soundState, "off");
  assert.equal(label(true, true).soundLabel, "Sound on");
  assert.equal(label(true, true).soundState, "on");
  assert.equal(label(false, false).soundLabel, "Sound unavailable");
  assert.equal(label(false, false).soundState, "unavailable");
  // An enabled flag never survives an unavailable audio context.
  assert.equal(label(true, false).soundLabel, "Sound unavailable");
});

test("rail key navigation wraps across stops and ignores unrelated keys", () => {
  const next = (key, index) =>
    signal.resolveRailKeyIndex({ key, index, count: 6 });

  assert.equal(next("ArrowDown", 0), 1);
  assert.equal(next("ArrowRight", 0), 1);
  assert.equal(next("ArrowDown", 5), 0);
  assert.equal(next("ArrowUp", 3), 2);
  assert.equal(next("ArrowLeft", 0), 5);
  assert.equal(next("Home", 4), 0);
  assert.equal(next("End", 1), 5);
  assert.equal(next("Enter", 2), null);
  assert.equal(next("Tab", 2), null);
  assert.equal(next(" ", 2), null);
});

test("rail key navigation refuses indexes outside the rail", () => {
  assert.equal(signal.resolveRailKeyIndex({ key: "ArrowDown", index: -1, count: 6 }), null);
  assert.equal(signal.resolveRailKeyIndex({ key: "ArrowDown", index: 6, count: 6 }), null);
  assert.equal(signal.resolveRailKeyIndex({ key: "ArrowDown", index: 0, count: 0 }), null);
  assert.equal(signal.resolveRailKeyIndex({ key: "ArrowDown", index: 1.5, count: 6 }), null);
});

test("headline width is measured from the longest unbreakable word", () => {
  // Single-word channel titles.
  assert.equal(signal.measureHeadlineEm("Art"), 3.48);
  assert.equal(signal.measureHeadlineEm("Books"), 5.8);
  assert.equal(signal.measureHeadlineEm("Frequency"), 10.44);

  // A multi-word headline is bounded by its longest word, not its full length.
  assert.equal(
    signal.measureHeadlineEm("Make something that resonates."),
    signal.measureHeadlineEm("resonates.")
  );
  assert.equal(signal.measureHeadlineEm("Make something that resonates."), 11.6);

  // Never zero, so the CSS division can never blow up.
  assert.equal(signal.measureHeadlineEm(""), 1.16);
  assert.equal(signal.measureHeadlineEm("   "), 1.16);
  assert.equal(signal.measureHeadlineEm(undefined), 1.16);
});

test("rail items and channel views expose active state for the tuned stop", () => {
  const items = signal.createFrequencyRailItems(
    channels.map((channel) => ({
      ...channel,
      primaryHref: "https://example.com/primary",
      secondaryHref: "https://example.com/secondary",
    })),
    "art"
  );

  assert.deepEqual(
    items.map(({ id, active }) => ({ id, active })),
    [
      { id: "hero", active: false },
      { id: "books", active: false },
      { id: "apps", active: false },
      { id: "art", active: true },
      { id: "frequency", active: false },
      { id: "music", active: false },
    ]
  );

  // Every stop tunes to itself, including the hero. Without this, arrowing or
  // pressing Home onto stop 00 would move focus while leaving the console,
  // aria-current, and any playing frequency on the scrolled-to project.
  items.forEach((item) => assert.equal(item.previewId, item.id));

  // Selecting the hero resolves to a real state rather than falling back to
  // whatever the scroll position last chose.
  assert.equal(
    signal.resolvePreviewChannel({ scrollChannel: "music", previewChannel: "hero" }),
    "hero"
  );

  const project = {
    ...channels[0],
    primaryLabel: "Read poetry book",
    primaryHref: "https://a.co/d/078d1kaa",
    secondaryLabel: "Intro to Quantum",
    secondaryHref: "https://woodyard.streamlit.app/",
  };

  assert.equal(signal.createProjectChannelView(project, 0, true).statusLabel, "SIGNAL ACTIVE");
  assert.equal(signal.createProjectChannelView(project, 0, false).statusLabel, "STANDBY");
  assert.equal(signal.createProjectChannelView(project, 0, false).titleEm, 5.8);
  assert.equal(
    signal.createProjectChannelView({ ...project, title: "Frequency" }, 3, false).titleEm,
    10.44
  );
});

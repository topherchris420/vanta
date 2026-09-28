const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const { channels } = require("../data/practice");

test("frequency rail items expose hero-first anchor order and current state", () => {
  const heroItems = signal.createFrequencyRailItems(channels, "hero");

  assert.deepEqual(
    heroItems.map(({ href, number, label, current }) => ({
      href,
      number,
      label,
      current,
    })),
    [
      { href: "#top", number: "00", label: "Signal", current: "location" },
      { href: "#signal-writing", number: "01", label: "Writing", current: undefined },
      { href: "#signal-instruments", number: "02", label: "Instruments", current: undefined },
      { href: "#signal-worlds", number: "03", label: "Worlds", current: undefined },
      { href: "#signal-art", number: "04", label: "Art", current: undefined },
      { href: "#signal-music", number: "05", label: "Music", current: undefined },
    ]
  );

  const musicItems = signal.createFrequencyRailItems(channels, "music");
  assert.equal(musicItems[0].current, undefined);
  assert.equal(musicItems[5].current, "location");

  // Rest zones (intervals, atlas gateway, footer) leave every stop untuned.
  const restItems = signal.createFrequencyRailItems(channels, "rest");
  assert.ok(restItems.every((item) => item.current === undefined));
});

test("a tuned thread lights its chord on the rail without moving the location", () => {
  const items = signal.createFrequencyRailItems(channels, "rest", ["instruments", "worlds"]);
  assert.deepEqual(
    items.filter((item) => item.chord).map((item) => item.id),
    ["instruments", "worlds"]
  );
  assert.ok(items.every((item) => item.current === undefined));
  assert.equal(items[0].chord, undefined, "the hero stop is never part of a chord");
});

test("project channel view returns semantic ids, ordering, and active state", () => {
  const firstView = signal.createProjectChannelView(channels[0], 0, false);
  assert.equal(firstView.sectionId, "signal-writing");
  assert.equal(firstView.headingId, "signal-title-writing");
  assert.equal(firstView.direction, "forward");
  assert.equal(firstView.active, false);
  assert.equal(firstView.statusLabel, "STANDBY");
  assert.equal(firstView.frequencyLabel, "261.63 Hz");

  const reverseView = signal.createProjectChannelView(channels[3], 3, true);
  assert.equal(reverseView.sectionId, "signal-art");
  assert.equal(reverseView.direction, "reverse");
  assert.equal(reverseView.statusLabel, "SIGNAL ACTIVE");
  assert.equal(reverseView.frequencyLabel, "523.25 Hz");
});

test("channel preview ends only when focus leaves the channel", () => {
  const inside = {};
  const outside = {};
  const container = { contains: (target) => target === inside };

  assert.equal(signal.didFocusLeaveChannel(container, inside), false);
  assert.equal(signal.didFocusLeaveChannel(container, outside), true);
  assert.equal(signal.didFocusLeaveChannel(container, null), true);
});

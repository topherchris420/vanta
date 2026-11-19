const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DECK, grooveAt } = require("../lib/studio/turntable");

const stylusRadius = (yaw) => Math.hypot(
  DECK.pivot[0] + DECK.armLength * Math.sin(yaw) - DECK.spindle[0],
  DECK.pivot[1] + DECK.armLength * Math.cos(yaw) - DECK.spindle[1]
);

test("the parked stylus clears the LP and cues into its playable grooves", () => {
  assert.ok(stylusRadius(DECK.restYaw) > DECK.radius);
  assert.ok(Math.abs(stylusRadius(grooveAt(0).yaw) - DECK.leadIn) < 1e-9);
  for (const time of [0, 0.5, 14, 60, 3600]) {
    const expected = Math.max(DECK.runOut, DECK.leadIn - time / 1.8 * DECK.pitchPerTurn);
    assert.ok(Math.abs(stylusRadius(grooveAt(time).yaw) - expected) < 1e-9);
  }
});

test("the platter makes one clockwise turn per 1.8 seconds of media time", () => {
  assert.ok(Math.abs(grooveAt(0.45).rotation + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(grooveAt(0.45).rotation - grooveAt(2.25).rotation) < 1e-9);
  assert.deepEqual(grooveAt(NaN), grooveAt(0));
});

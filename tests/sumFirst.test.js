const assert = require("node:assert/strict");
const { test } = require("node:test");
const { chartLayout, compareSums, MAX_TERMS, SCALES } = require("../lib/sumFirst");

test("example finishes the finite sum and expands only the phase for comparison", () => {
  const { sumFirst, expandFirst } = compareSums(16, MAX_TERMS);
  assert.equal(sumFirst[4].toFixed(6), "2.057494");
  assert.equal(expandFirst[4].toFixed(6), "2.083333");
  assert.equal(sumFirst[1024].toFixed(6), "3.079703");
  assert.equal(expandFirst[1024].toFixed(6), "7.509176");
  assert.ok(Math.abs(sumFirst[MAX_TERMS] - sumFirst[1024]) < 0.008);
  assert.ok(expandFirst[MAX_TERMS] > expandFirst[1024] + 2);
});

test("first-order discrepancy obeys the sine Taylor bound", () => {
  for (const s of SCALES) {
    const { sumFirst, expandFirst } = compareSums(s, MAX_TERMS);
    for (const n of [1, 4, 32, 256, 1024, MAX_TERMS]) {
      const difference = expandFirst[n] - sumFirst[n];
      assert.ok(difference >= 0);
      assert.ok(difference <= (n * (n + 1)) / (3 * s * s));
    }
  }
});

test("complex series agrees with Li₂(−i), independently splitting even and odd terms", () => {
  const catalan = 0.915965594177219;
  const { scaledReal, scaledImaginary } = compareSums(4 / Math.PI, MAX_TERMS);
  const error = Math.hypot(scaledReal + Math.PI ** 2 / 48, scaledImaginary + catalan);
  assert.ok(error < 3e-9);
  assert.ok(error <= 1 / MAX_TERMS);
});

test("cutoff and scale are bounded before allocating arrays", () => {
  for (const [scale, n] of [[NaN, 1], [0, 1], [-2, 1], [1, 0], [1, 1.5], [1, MAX_TERMS + 1]]) {
    assert.throws(() => compareSums(scale, n), RangeError);
  }
});

test("chart uses responsive pixel coordinates and leaves room for the longest tick on phones", () => {
  for (const width of [248, 328, 690]) {
    const { x, y, left, right, bottom, top, ticks } = chartLayout(width);
    assert.equal(x(1), left);
    assert.equal(x(MAX_TERMS), right);
    assert.equal(y(0), bottom);
    assert.equal(y(11), top);
    for (let i = 1; i < ticks.length; i++) assert.ok(x(ticks[i]) - x(ticks[i - 1]) >= 44);
    assert.equal(ticks.at(-1), MAX_TERMS);
  }
});

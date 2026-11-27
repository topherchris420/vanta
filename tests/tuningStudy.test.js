const test = require("node:test");
const assert = require("node:assert/strict");
const study = require("../data/research/tuningStudy.json");
const { excerpt } = require("../scripts/buildTuningStudy");
const { score, makeWav } = require("../lib/research/tuningAudio");

test("paired excerpts stop at the first lock or a fixed common limit", () => {
  assert.equal(study.seed, 1);
  const rows = study.conditions.map(({ id, turns, overshoots, lockMs, runTotals }) => {
    assert.ok(turns.every(([a, b]) => a >= 0 && b > a && b <= (lockMs ?? study.windowMs)));
    return [id, turns.length, overshoots.length, lockMs, runTotals.inputs, runTotals.locks];
  });
  assert.deepEqual(rows, [
    ["graded", 5, 0, 5550, 20, 4],
    ["long", 13, 6, null, 307, 0],
    ["tap", 26, 0, 15317, 104, 4],
  ]);
  assert.throws(() => excerpt({ schema: "svs-agent-trace/v1", provider: "openai" }), /intact, scripted/);
});

test("audio distinguishes direction, overshoots and locks without reshaping event times", () => {
  const [graded, long, tap] = study.conditions;
  const a = score(graded), b = score(long), c = score(tap);
  assert.equal(a.filter(n => n.kind === "lock").length, 3);
  assert.equal(a.find(n => n.kind === "lock").t, graded.lockMs / 2000);
  assert.equal(b.filter(n => n.kind === "lock").length, 0);
  assert.deepEqual(b.filter(n => n.kind === "overshoot").map(n => n.t), long.overshoots.map(t => t / 2000));
  assert.ok(new Set(b.filter(n => n.kind === "turn").map(n => n.hz)).size === 2);
  assert.equal(new Set(c.filter(n => n.kind === "turn").map(n => n.hz)).size, 1);
  assert.equal(a[0].seconds, graded.turns[0][1] / 2000);
});

test("every WAV is deterministic, equally long and well below clipping", () => {
  const bytes = [];
  for (const run of study.conditions) {
    const wav = Buffer.from(makeWav(run, study.windowMs));
    assert.deepEqual(wav, Buffer.from(makeWav(run, study.windowMs)));
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.readUInt32LE(4), wav.length - 8);
    assert.equal(wav.readUInt32LE(24), 22050);
    assert.equal(wav.readUInt32LE(40), wav.length - 44);
    let peak = 0;
    for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    assert.ok(peak > 1000 && peak < 10000);
    bytes.push(wav.length);
  }
  assert.equal(new Set(bytes).size, 1);
});

const assert = require("node:assert/strict");
const test = require("node:test");
const { channels } = require("../data/practice");
const instruments = require("../lib/studio/instruments");
const signal = require("../lib/signalExperience");

test("the synthesizer is tuned to the same notes the rooms are", () => {
  const { keys, whiteCount } = instruments.createKeyboard(channels);
  assert.equal(keys.length, 25, "two octaves, C3 to C5");
  assert.equal(whiteCount, 15);
  assert.equal(keys[0].name, "C3");
  assert.equal(keys[keys.length - 1].name, "C5");

  channels.forEach((channel) => {
    const key = keys.find((entry) => entry.channel === channel.id);
    assert.ok(key, `${channel.note} is a key on the instrument`);
    assert.equal(key.name, channel.note);
    assert.ok(
      Math.abs(key.frequency - channel.frequency) < 0.01,
      `${channel.note} sounds the channel's own frequency`
    );
    assert.equal(key.black, false);
    assert.ok(key.binding, `${channel.note} can be played from the computer keyboard`);
  });
  assert.equal(keys.filter((key) => key.channel).length, channels.length);
  assert.equal(new Set(keys.map((key) => key.binding)).size, keys.length, "bindings are unique");
});

test("waveforms are unit-bounded and periodic", () => {
  instruments.WAVEFORMS.forEach((shape) => {
    for (let step = 0; step < 200; step += 1) {
      const phase = step / 50 - 1;
      const value = instruments.waveform(shape, phase);
      assert.ok(value >= -1 && value <= 1, `${shape} stays in range`);
      assert.ok(Math.abs(value - instruments.waveform(shape, phase + 3)) < 1e-9, `${shape} repeats`);
    }
  });
  assert.ok(Math.abs(instruments.waveform("sine", 0.25) - 1) < 1e-12);
  assert.equal(instruments.waveform("square", 0.1), 1);
  assert.equal(instruments.waveform("square", 0.6), -1);
  assert.equal(instruments.waveform("triangle", 0.25), 1);
});

test("turning the frequency up puts more cycles on the scope", () => {
  const crossings = (frequency) => {
    const trace = instruments.scopeTrace({ frequency, count: 512 });
    let count = 0;
    for (let index = 1; index < 512; index += 1) {
      if (trace[(index - 1) * 2 + 1] < 0 && trace[index * 2 + 1] >= 0) count += 1;
    }
    return count;
  };
  assert.ok(crossings(880) > crossings(440));
  assert.ok(crossings(440) > crossings(196));
  // 440 Hz across a 12 ms window is 5.28 cycles.
  assert.equal(crossings(440), 5);
  const quiet = instruments.scopeTrace({ frequency: 440, amplitude: 0.25 });
  assert.ok(Math.max(...Array.from(quiet).filter((_, index) => index % 2)) <= 0.25);
});

test("a Lissajous figure closes only on a whole-number ratio", () => {
  const closes = (ratio) => {
    const trace = instruments.lissajousTrace({ ratio, count: 1025, turns: 2 });
    const last = trace.length - 2;
    return Math.hypot(trace[0] - trace[last], trace[1] - trace[last + 1]) < 1e-6;
  };
  assert.equal(closes(1.5), true, "3:2, the fifth between G and C");
  assert.equal(closes(1.2), false, "6:5 needs five turns to close");
  assert.equal(closes(Math.SQRT2), false);
});

test("the plate model has real nodal lines and its modes are ordered by pitch", () => {
  const { chladni, CHLADNI_MODES, CHLADNI_RANGE } = instruments;
  // The diagonal is a nodal line of every mode of this family.
  for (let step = -10; step <= 10; step += 1) {
    assert.ok(Math.abs(chladni(2, 5, step / 10, step / 10)) < 1e-12);
  }
  assert.ok(Math.abs(chladni(1, 2, 0.9, -0.2)) > 0.1, "and it moves elsewhere");
  CHLADNI_MODES.forEach((mode, index) => {
    assert.ok(mode.m < mode.n, "m = n is the plate at rest");
    if (index) assert.ok(mode.frequency >= CHLADNI_MODES[index - 1].frequency);
  });
  assert.equal(CHLADNI_RANGE[0], CHLADNI_MODES[0].frequency);

  const hit = instruments.chladniModeAt(CHLADNI_MODES[4].frequency);
  assert.equal(hit.m, CHLADNI_MODES[4].m);
  assert.ok(hit.resonance > 0.999);
  const between = instruments.chladniModeAt(
    (CHLADNI_MODES[4].frequency + CHLADNI_MODES[5].frequency) / 2 + 40
  );
  assert.ok(between.resonance < hit.resonance, "off resonance the plate moves less");
});

test("grains settle onto the nodal lines when the plate is driven", () => {
  const random = instruments.seededRandom(11);
  const grains = instruments.scatterGrains(600, random);
  const mode = { m: 2, n: 3, resonance: 1 };
  const meanAmplitude = () => {
    let sum = 0;
    for (let index = 0; index < grains.length; index += 2) {
      sum += Math.abs(instruments.chladni(2, 3, grains[index], grains[index + 1]));
    }
    return sum / (grains.length / 2);
  };
  const before = meanAmplitude();
  for (let step = 0; step < 400; step += 1) instruments.stepGrains(grains, mode, { random });
  const after = meanAmplitude();
  assert.ok(after < before * 0.45, `grains gather where the plate is still (${before} -> ${after})`);
  grains.forEach((value) => assert.ok(value >= -1 && value <= 1, "no grain leaves the plate"));

  const still = Float32Array.from(grains);
  assert.equal(instruments.stepGrains(grains, { m: 2, n: 3, resonance: 0 }), 0);
  assert.deepEqual(grains, still, "an undriven plate moves nothing");
});

test("synth settings are clamped and a fistful of keys is no louder than a chord", () => {
  const wild = instruments.normalizeSynth({ shape: "noise", attack: -4, release: 99, brightness: Number.NaN });
  assert.deepEqual(wild, {
    shape: instruments.SYNTH_DEFAULTS.shape,
    attack: instruments.SYNTH_LIMITS.attack[0],
    release: instruments.SYNTH_LIMITS.release[1],
    brightness: instruments.SYNTH_DEFAULTS.brightness,
  });
  assert.ok(instruments.brightnessToCutoff(1) > instruments.brightnessToCutoff(0));
  assert.ok(instruments.brightnessToCutoff(5) <= 12000);

  const site = signal.createChordVoicing([196, 261.63, 329.63]);
  for (let voices = 1; voices <= 10; voices += 1) {
    const total = instruments.voiceLevel(voices) * voices;
    assert.ok(total <= site.level + 1e-9, `${voices} voices stay under the site's chord level`);
  }
});

test("the room's level follows held notes up quickly and down slowly", () => {
  let level = 0;
  for (let frame = 0; frame < 12; frame += 1) level = instruments.followLevel(level, 3, 1 / 60);
  assert.ok(level > 0.7, "attack");
  const peak = level;
  for (let frame = 0; frame < 12; frame += 1) level = instruments.followLevel(level, 0, 1 / 60);
  assert.ok(level < peak && level > 0.2, "release is slower than attack");
  for (let frame = 0; frame < 600; frame += 1) level = instruments.followLevel(level, 0, 1 / 60);
  assert.ok(level < 0.001);
});

test("a recording's stored envelope drives the room without any audio graph", () => {
  const { artifact } = channels.find((channel) => channel.id === "music");
  assert.equal(instruments.envelopeAt(artifact.peaks, 0, artifact.duration), artifact.peaks[0]);
  assert.equal(
    instruments.envelopeAt(artifact.peaks, artifact.duration, artifact.duration),
    artifact.peaks[artifact.peaks.length - 1]
  );
  const mid = instruments.envelopeAt(artifact.peaks, 7, artifact.duration);
  assert.ok(mid > 0 && mid <= 1);
  assert.equal(instruments.envelopeAt(artifact.peaks, 99, artifact.duration), artifact.peaks.at(-1));
  assert.equal(instruments.envelopeAt([], 1, 14), 0);
  assert.equal(instruments.envelopeAt(artifact.peaks, 1, 0), 0);
});

test("Resolve: five mistuned strings, solved only by actually tuning them", () => {
  const game = instruments.createTuningGame(channels, 42);
  assert.equal(game.strings.length, 5);
  assert.deepEqual(
    game.strings.map((string) => string.note),
    ["G3", "C4", "E4", "G4", "C5"],
    "strings run from the lowest note up, like the coda"
  );
  game.strings.forEach((string) => {
    assert.ok(Math.abs(string.cents) >= 15 && Math.abs(string.cents) <= instruments.MAX_DETUNE_CENTS);
    assert.equal(instruments.isStringInTune(string), false, "no string starts in tune");
    assert.ok(instruments.beatRate(string.target, string.cents) > 0);
  });
  assert.equal(game.resolved, false);
  assert.deepEqual(instruments.createTuningGame(channels, 42), game, "a seed replays the same game");
  assert.notDeepEqual(
    instruments.createTuningGame(channels, 43).strings.map((string) => string.cents),
    game.strings.map((string) => string.cents)
  );

  let play = game;
  game.strings.slice(0, 4).forEach((string) => {
    play = instruments.tuneString(play, string.id, -string.cents);
  });
  assert.equal(play.resolved, false, "four in tune is not a chord");
  const last = game.strings[4];
  play = instruments.tuneString(play, last.id, -last.cents + 2);
  assert.equal(play.resolved, true, "within three cents counts");
  assert.equal(play.moves, 5);
  instruments.tuningFrequencies(play).forEach((frequency, index) => {
    assert.ok(Math.abs(instruments.centsBetween(frequency, play.strings[index].target)) <= 3);
  });
  assert.equal(instruments.tuneString(play, last.id, 40), play, "a resolved chord stays resolved");
  assert.equal(instruments.beatRate(261.63, 0), 0, "a string in tune does not beat");
});

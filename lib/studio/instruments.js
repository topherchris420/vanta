// The mathematics behind the studio's instruments. Everything a visitor sees
// on a scope, a plate, or a meter is computed here from the state of the
// controls, never from the audio output, so the instruments read the same with
// sound off as with it on.
//
// These are artistic simulations: exact for the idealised model each one
// names, and not measurements of anything.

const TAU = Math.PI * 2;
const A4 = 440;

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

// Equal temperament from A4 = 440 Hz. MIDI 60 is C4.
const midiToFrequency = (midi) => A4 * Math.pow(2, (midi - 69) / 12);
const midiToName = (midi) => NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);

const centsBetween = (frequency, reference) => 1200 * Math.log2(frequency / reference);
const detune = (frequency, cents) => frequency * Math.pow(2, cents / 1200);

/* ------------------------------------------------------------- waveforms */

const WAVEFORMS = ["sine", "triangle", "sawtooth", "square"];

// One sample of a unit waveform at a phase measured in cycles.
const waveform = (shape, phase) => {
  const t = phase - Math.floor(phase);
  switch (shape) {
    case "triangle":
      return t < 0.25 ? t * 4 : t < 0.75 ? 2 - t * 4 : t * 4 - 4;
    case "sawtooth":
      return t < 0.5 ? t * 2 : t * 2 - 2;
    case "square":
      return t < 0.5 ? 1 : -1;
    default:
      return Math.sin(t * TAU);
  }
};

// What the scope draws in time mode: `count` samples across a fixed window,
// so a higher frequency packs more cycles onto the screen.
const SCOPE_WINDOW_SECONDS = 0.012;

const scopeTrace = ({ frequency, shape = "sine", amplitude = 1, phase = 0, count = 256 }) => {
  const points = new Float32Array(count * 2);
  for (let index = 0; index < count; index += 1) {
    const u = index / (count - 1);
    points[index * 2] = u * 2 - 1;
    points[index * 2 + 1] =
      amplitude * waveform(shape, frequency * SCOPE_WINDOW_SECONDS * u + phase);
  }
  return points;
};

// X–Y mode: one oscillator on each axis. A ratio of small whole numbers draws
// a closed figure; anything else never closes.
const lissajousTrace = ({ ratio = 1.5, phase = 0, amplitude = 1, count = 512, turns = 2 }) => {
  const points = new Float32Array(count * 2);
  for (let index = 0; index < count; index += 1) {
    const t = (index / (count - 1)) * turns;
    points[index * 2] = amplitude * Math.sin(TAU * t + phase * TAU);
    points[index * 2 + 1] = amplitude * Math.sin(TAU * t * ratio);
  }
  return points;
};

// Several notes summed, for the rack scope in the recording studio.
const chordTrace = ({ frequencies, shape = "sine", time = 0, count = 192, window = 0.02 }) => {
  const points = new Float32Array(count * 2);
  const voices = frequencies.length;
  for (let index = 0; index < count; index += 1) {
    const u = index / (count - 1);
    let value = 0;
    for (let voice = 0; voice < voices; voice += 1) {
      value += waveform(shape, frequencies[voice] * (window * u + time));
    }
    points[index * 2] = u * 2 - 1;
    points[index * 2 + 1] = voices ? value / Math.max(voices, 1.6) : 0;
  }
  return points;
};

/* ---------------------------------------------------------- Chladni plate */

// Modes of an idealised free square plate, the textbook superposition
//   cos(nπx)cos(mπy) − cos(mπx)cos(nπy)
// on x, y in [-1, 1]. Sand gathers where this is zero.
const chladni = (m, n, x, y) => {
  const u = (x + 1) / 2;
  const v = (y + 1) / 2;
  return (
    Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v) -
    Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v)
  );
};

// Distinct modes with m < n (m = n is identically zero), ordered by the
// model's frequency, which goes as m² + n².
const CHLADNI_BASE_HZ = 48;

const CHLADNI_MODES = (() => {
  const modes = [];
  for (let m = 1; m <= 7; m += 1) {
    for (let n = m + 1; n <= 8; n += 1) {
      modes.push({ m, n, frequency: CHLADNI_BASE_HZ * (m * m + n * n) });
    }
  }
  return modes.sort((a, b) => a.frequency - b.frequency || a.m - b.m);
})();

const CHLADNI_RANGE = [
  CHLADNI_MODES[0].frequency,
  CHLADNI_MODES[CHLADNI_MODES.length - 1].frequency,
];

// The mode a driving frequency excites, and how squarely it is hit. Off
// resonance the plate barely moves and the sand stays where it lies.
const chladniModeAt = (frequency) => {
  let best = CHLADNI_MODES[0];
  for (const mode of CHLADNI_MODES) {
    if (Math.abs(mode.frequency - frequency) < Math.abs(best.frequency - frequency)) {
      best = mode;
    }
  }
  const distance = Math.abs(best.frequency - frequency);
  const width = Math.max(18, best.frequency * 0.035);
  return { ...best, resonance: Math.exp(-Math.pow(distance / width, 2)) };
};

// Move grains one step: each is shaken in proportion to the plate's motion
// under it and drifts down the gradient of that motion, so they collect on
// the nodal lines. `positions` is [x, y, x, y, …] in [-1, 1], edited in place.
const stepGrains = (positions, mode, { energy = 1, random = Math.random } = {}) => {
  const { m, n } = mode;
  const drive = energy * (mode.resonance ?? 1);
  if (drive < 0.02) return 0;
  const epsilon = 0.012;
  let moved = 0;
  for (let index = 0; index < positions.length; index += 2) {
    const x = positions[index];
    const y = positions[index + 1];
    const value = chladni(m, n, x, y);
    const magnitude = Math.abs(value);
    const gx = (Math.abs(chladni(m, n, x + epsilon, y)) - Math.abs(chladni(m, n, x - epsilon, y))) / (2 * epsilon);
    const gy = (Math.abs(chladni(m, n, x, y + epsilon)) - Math.abs(chladni(m, n, x, y - epsilon))) / (2 * epsilon);
    const jitter = magnitude * 0.03 * drive;
    let nx = x - gx * 0.0026 * drive + (random() - 0.5) * jitter;
    let ny = y - gy * 0.0026 * drive + (random() - 0.5) * jitter;
    // Grains that reach the edge are bounced back onto the plate.
    if (nx < -1) nx = -2 - nx;
    if (nx > 1) nx = 2 - nx;
    if (ny < -1) ny = -2 - ny;
    if (ny > 1) ny = 2 - ny;
    moved += Math.abs(nx - x) + Math.abs(ny - y);
    positions[index] = nx;
    positions[index + 1] = ny;
  }
  return moved / (positions.length / 2);
};

const scatterGrains = (count, random = Math.random) => {
  const positions = new Float32Array(count * 2);
  for (let index = 0; index < positions.length; index += 1) {
    positions[index] = random() * 2 - 1;
  }
  return positions;
};

/* ---------------------------------------------------------------- keyboard */

const KEYBOARD_LOW = 48; // C3
const KEYBOARD_HIGH = 72; // C5
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);

// Two rows of a QWERTY keyboard, laid out like piano keys, C3 to C5.
const KEY_BINDINGS = {
  z: 48, s: 49, x: 50, d: 51, c: 52, v: 53, g: 54, b: 55, h: 56, n: 57, j: 58, m: 59,
  q: 60, 2: 61, w: 62, 3: 63, e: 64, r: 65, 5: 66, t: 67, 6: 68, y: 69, 7: 70, u: 71, i: 72,
};

// The keys of the studio synthesizer. A key that is one of the five channel
// notes carries its channel, so the instrument shows where the chord lives.
const createKeyboard = (channels = []) => {
  const byNote = new Map(channels.map((channel) => [channel.note, channel]));
  const bindingFor = new Map(Object.entries(KEY_BINDINGS).map(([key, midi]) => [midi, key]));
  const keys = [];
  let white = 0;
  for (let midi = KEYBOARD_LOW; midi <= KEYBOARD_HIGH; midi += 1) {
    const black = BLACK_PITCHES.has(midi % 12);
    const name = midiToName(midi);
    const plain = name.replace("♯", "#").replace("♭", "b");
    const channel = byNote.get(plain) ?? null;
    keys.push({
      midi,
      name,
      black,
      // White keys sit on whole slots; a black key sits on the line before
      // the white key that follows it.
      slot: black ? white - 0.5 : white,
      frequency: Number(midiToFrequency(midi).toFixed(2)),
      binding: bindingFor.get(midi) ?? null,
      channel: channel ? channel.id : null,
      channelTitle: channel ? channel.title : null,
    });
    if (!black) white += 1;
  }
  return { keys, whiteCount: white };
};

const SYNTH_DEFAULTS = {
  shape: "triangle",
  attack: 0.02,
  release: 0.5,
  brightness: 0.6,
};

const SYNTH_LIMITS = {
  attack: [0.005, 0.6],
  release: [0.08, 2.4],
  brightness: [0.05, 1],
};

// Brightness 0..1 to a low-pass cutoff in hertz, exponentially, because that
// is how a filter knob is heard.
const brightnessToCutoff = (brightness) =>
  240 * Math.pow(2, Math.min(Math.max(brightness, 0), 1) * 5.6);

const normalizeSynth = (params = {}) => {
  const clampTo = (value, [min, max], fallback) =>
    Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;
  return {
    shape: WAVEFORMS.includes(params.shape) ? params.shape : SYNTH_DEFAULTS.shape,
    attack: clampTo(params.attack, SYNTH_LIMITS.attack, SYNTH_DEFAULTS.attack),
    release: clampTo(params.release, SYNTH_LIMITS.release, SYNTH_DEFAULTS.release),
    brightness: clampTo(params.brightness, SYNTH_LIMITS.brightness, SYNTH_DEFAULTS.brightness),
  };
};

// How loud each voice may be so that a fistful of keys is never louder than a
// chord is allowed to be elsewhere on the site.
const voiceLevel = (voices, { single = 0.09, chord = 0.12 } = {}) =>
  voices <= 1 ? single : chord / voices;

// The level the room reacts to: follows the number of held notes up at the
// attack rate and down at the release rate.
const followLevel = (level, heldNotes, delta, { attack = 0.02, release = 0.5 } = {}) => {
  const target = heldNotes > 0 ? Math.min(1, 0.55 + heldNotes * 0.15) : 0;
  const rate = target > level ? 1 / Math.max(attack, 0.01) : 1 / Math.max(release, 0.05);
  return level + (target - level) * (1 - Math.exp(-rate * delta * 2.2));
};

// Level of a recording at a moment, read from its stored RMS envelope.
const envelopeAt = (peaks, time, duration) => {
  if (!Array.isArray(peaks) || !peaks.length || !(duration > 0)) return 0;
  const position = Math.min(Math.max(time / duration, 0), 1) * (peaks.length - 1);
  const index = Math.floor(position);
  const next = Math.min(index + 1, peaks.length - 1);
  const mix = position - index;
  return peaks[index] * (1 - mix) + peaks[next] * mix;
};

/* ------------------------------------------------------------ tuning game */

// "Resolve": the five strings of the chord arrive out of tune. Each string's
// strobe drifts at the rate it beats against its true note, and stands still
// when it is right, so the game can be played by eye or by ear.

const IN_TUNE_CENTS = 3;
const MAX_DETUNE_CENTS = 60;

// A small deterministic generator, so a game can be replayed from its seed.
const seededRandom = (seed) => {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const createTuningGame = (channels, seed = 1) => {
  const random = seededRandom(seed);
  const strings = [...channels]
    .sort((a, b) => a.frequency - b.frequency)
    .map((channel) => {
      // At least fifteen cents out, either way, and never more than sixty.
      const size = 15 + Math.floor(random() * (MAX_DETUNE_CENTS - 15));
      const sign = random() < 0.5 ? -1 : 1;
      return {
        id: channel.id,
        title: channel.title,
        note: channel.note,
        target: channel.frequency,
        cents: sign * size,
      };
    });
  return { seed, strings, moves: 0, resolved: false };
};

const beatRate = (target, cents) => Math.abs(detune(target, cents) - target);

const isStringInTune = (string) => Math.abs(string.cents) <= IN_TUNE_CENTS;

const tuneString = (game, id, deltaCents) => {
  if (game.resolved) return game;
  const strings = game.strings.map((string) =>
    string.id === id
      ? {
          ...string,
          cents: Math.min(
            Math.max(string.cents + deltaCents, -MAX_DETUNE_CENTS - 20),
            MAX_DETUNE_CENTS + 20
          ),
        }
      : string
  );
  return {
    ...game,
    strings,
    moves: game.moves + 1,
    resolved: strings.every(isStringInTune),
  };
};

const tuningFrequencies = (game) =>
  game.strings.map((string) => detune(string.target, string.cents));

module.exports = {
  CHLADNI_MODES,
  CHLADNI_RANGE,
  IN_TUNE_CENTS,
  KEY_BINDINGS,
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  MAX_DETUNE_CENTS,
  SCOPE_WINDOW_SECONDS,
  SYNTH_DEFAULTS,
  SYNTH_LIMITS,
  WAVEFORMS,
  beatRate,
  brightnessToCutoff,
  centsBetween,
  chladni,
  chladniModeAt,
  chordTrace,
  createKeyboard,
  createTuningGame,
  detune,
  envelopeAt,
  followLevel,
  isStringInTune,
  lissajousTrace,
  midiToFrequency,
  midiToName,
  normalizeSynth,
  scatterGrains,
  scopeTrace,
  seededRandom,
  stepGrains,
  tuneString,
  tuningFrequencies,
  voiceLevel,
  waveform,
};

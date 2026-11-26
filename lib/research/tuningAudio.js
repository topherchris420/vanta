const tapeSpeed = 2;
const sampleRate = 22050;
const turnPitch = { up: 523.25, down: 349.23 };
const at = (ms) => ms / (1000 * tapeSpeed);

// Encode intent and outcome, not absolute simulated frequency. The same mapping
// and time scale apply to every condition; no normalization or added percussion.
function score(condition) {
  const turns = condition.turns.map(([start, end, direction]) => ({
    t: at(start), seconds: at(end - start), hz: turnPitch[direction], volume: 0.16, kind: "turn",
  }));
  const slips = condition.overshoots.map((ms) => ({
    t: at(ms), seconds: 0.09, hz: 1174.66, volume: 0.09, kind: "overshoot",
  }));
  const lock = condition.lockMs === null ? [] : [1, 1.25, 1.5].map((ratio) => ({
    t: at(condition.lockMs), seconds: 0.5, hz: 392 * ratio, volume: 0.055, kind: "lock",
  }));
  return [...turns, ...slips, ...lock];
}

function makeWav(condition, windowMs) {
  const length = Math.ceil((at(windowMs) + 0.55) * sampleRate);
  const signal = new Float32Array(length);
  for (const note of score(condition)) {
    const start = Math.round(note.t * sampleRate);
    const frames = Math.floor(note.seconds * sampleRate);
    for (let j = 0; j < frames && start + j < length; j++) {
      const time = j / sampleRate;
      const envelope = Math.min(1, time / 0.012, (note.seconds - time) / 0.036);
      signal[start + j] += note.volume * envelope * Math.sin(2 * Math.PI * note.hz * time);
    }
  }
  const wav = new ArrayBuffer(44 + 2 * length);
  const view = new DataView(wav);
  const four = (at, text) => [...text].forEach((s, i) => view.setUint8(at + i, s.charCodeAt(0)));
  const u32 = (at, n) => view.setUint32(at, n, true);
  const u16 = (at, n) => view.setUint16(at, n, true);
  four(0, "RIFF"); u32(4, wav.byteLength - 8); four(8, "WAVE"); four(12, "fmt ");
  u32(16, 16); u16(20, 1); u16(22, 1); u32(24, sampleRate);
  u32(28, sampleRate * 2); u16(32, 2); u16(34, 16); four(36, "data"); u32(40, 2 * length);
  for (let i = 0; i < length; i++) view.setInt16(44 + 2 * i, Math.round(Math.max(-1, Math.min(1, signal[i])) * 32767), true);
  return wav;
}

module.exports = { makeWav, score, tapeSpeed };

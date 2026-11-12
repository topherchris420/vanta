// The lit screens in the studio: the workstation monitor, the bench
// oscilloscope, the rack scope, and the synthesizer's little display. Each is a
// canvas redrawn only when what it shows has changed, or at a modest rate while
// something on it is moving, and only while the visitor is near enough to see.
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import instruments from "../instruments";
import { createCanvas } from "./textures";

const { chordTrace, lissajousTrace, scopeTrace } = instruments;

const MINT = "#89f2c2";
const AMBER = "#e7b85e";
const PAPER = "#f2fbf7";
const INK = "#050806";

export const createScreen = (width, height) => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, context, texture, width, height, lastDraw: -Infinity };
};

const graticule = (context, x, y, width, height, divisions = [10, 8]) => {
  context.strokeStyle = "rgba(137,242,194,0.12)";
  context.lineWidth = 1;
  for (let column = 0; column <= divisions[0]; column += 1) {
    const px = x + (width * column) / divisions[0];
    context.beginPath();
    context.moveTo(px, y);
    context.lineTo(px, y + height);
    context.stroke();
  }
  for (let row = 0; row <= divisions[1]; row += 1) {
    const py = y + (height * row) / divisions[1];
    context.beginPath();
    context.moveTo(x, py);
    context.lineTo(x + width, py);
    context.stroke();
  }
  context.strokeStyle = "rgba(137,242,194,0.28)";
  context.beginPath();
  context.moveTo(x + width / 2, y);
  context.lineTo(x + width / 2, y + height);
  context.moveTo(x, y + height / 2);
  context.lineTo(x + width, y + height / 2);
  context.stroke();
};

// A phosphor trace: a wide faint stroke under a thin bright one.
const trace = (context, points, x, y, width, height, color = MINT) => {
  const count = points.length / 2;
  const draw = () => {
    context.beginPath();
    for (let index = 0; index < count; index += 1) {
      const px = x + ((points[index * 2] + 1) / 2) * width;
      const py = y + ((1 - points[index * 2 + 1]) / 2) * height;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  };
  context.lineJoin = "round";
  context.strokeStyle = color;
  context.globalAlpha = 0.18;
  context.lineWidth = 7;
  draw();
  context.globalAlpha = 1;
  context.lineWidth = 2;
  draw();
};

// The bench scope: whatever the signal generator is set to, drawn from the
// controls (see lib/studio/instruments.js), never from the audio output.
export const drawScope = (screen, state, fonts) => {
  const { context, width, height } = screen;
  context.fillStyle = "#020504";
  context.fillRect(0, 0, width, height);
  const pad = 14;
  const plotHeight = height - 46;
  graticule(context, pad, pad, width - pad * 2, plotHeight - pad);
  const points =
    state.mode === "xy"
      ? lissajousTrace({ ratio: state.ratio, phase: state.phase, amplitude: state.amplitude * 0.9, count: 600, turns: 4 })
      : scopeTrace({ frequency: state.frequency, shape: state.shape, amplitude: state.amplitude * 0.9, count: 320 });
  if (state.mode === "xy") {
    // Square the figure in the plot.
    const side = plotHeight - pad;
    trace(context, points, (width - side) / 2, pad, side, side);
  } else {
    trace(context, points, pad, pad, width - pad * 2, plotHeight - pad);
  }
  context.fillStyle = MINT;
  context.font = `600 18px ${fonts.mono}`;
  context.textBaseline = "alphabetic";
  const label =
    state.mode === "xy"
      ? `X–Y  ${state.ratioLabel ?? state.ratio.toFixed(3)}`
      : `${state.frequency.toFixed(2)} Hz  ${state.shape.toUpperCase()}`;
  context.fillText(label, pad, height - 14);
  context.fillStyle = state.output ? AMBER : "rgba(242,251,247,0.4)";
  context.textAlign = "right";
  context.fillText(state.output ? "OUT" : "SIM", width - pad, height - 14);
  context.textAlign = "left";
  screen.texture.needsUpdate = true;
};

// The rack scope in the Recording Studio: the sum of the notes being played.
export const drawRackScope = (screen, state, fonts, time) => {
  const { context, width, height } = screen;
  context.fillStyle = "#020504";
  context.fillRect(0, 0, width, height);
  graticule(context, 6, 6, width - 12, height - 30, [8, 4]);
  const frequencies = state.frequencies ?? [];
  if (frequencies.length) {
    const points = chordTrace({
      frequencies,
      shape: state.shape ?? "sine",
      time: time * 0.0006,
      count: 220,
      window: 0.02,
    });
    for (let index = 1; index < points.length; index += 2) points[index] *= 0.85 * Math.max(state.level, 0.15);
    trace(context, points, 6, 6, width - 12, height - 30);
  } else if (state.recordLevel > 0.01) {
    // A recording has no notes to sum; the rack shows its stored envelope.
    const bars = 48;
    context.fillStyle = MINT;
    for (let index = 0; index < bars; index += 1) {
      const value = state.recordLevel * (0.55 + 0.45 * Math.sin(index * 1.7 + time * 0.004));
      const barHeight = Math.max(2, value * (height - 36));
      context.globalAlpha = 0.85;
      context.fillRect(8 + index * ((width - 16) / bars), height - 26 - barHeight, (width - 16) / bars - 2, barHeight);
    }
    context.globalAlpha = 1;
  } else {
    context.strokeStyle = "rgba(137,242,194,0.6)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(6, (height - 24) / 2);
    context.lineTo(width - 6, (height - 24) / 2);
    context.stroke();
  }
  context.fillStyle = "rgba(242,251,247,0.62)";
  context.font = `600 14px ${fonts.mono}`;
  context.fillText(state.patched ? "PATCHED → PLATE" : "SYNTH OUT", 8, height - 8);
  screen.texture.needsUpdate = true;
};

// The synthesizer's display: waveform, envelope, filter, and held notes.
export const drawSynthDisplay = (screen, state, fonts) => {
  const { context, width, height } = screen;
  context.fillStyle = "#030605";
  context.fillRect(0, 0, width, height);
  context.fillStyle = MINT;
  context.font = `600 20px ${fonts.mono}`;
  context.fillText(state.shape.toUpperCase(), 12, 28);
  context.fillStyle = "rgba(242,251,247,0.7)";
  context.font = `500 15px ${fonts.mono}`;
  const bar = (label, value, y) => {
    context.fillStyle = "rgba(242,251,247,0.6)";
    context.fillText(label, 12, y);
    context.fillStyle = "rgba(137,242,194,0.18)";
    context.fillRect(70, y - 11, width - 84, 10);
    context.fillStyle = MINT;
    context.fillRect(70, y - 11, (width - 84) * value, 10);
  };
  bar("ATK", state.attackUnit, 54);
  bar("REL", state.releaseUnit, 74);
  bar("TONE", state.brightness, 94);
  context.fillStyle = AMBER;
  context.font = `600 18px ${fonts.mono}`;
  context.fillText(state.held.length ? state.held.join(" ") : "—", 12, height - 12);
  screen.texture.needsUpdate = true;
};

// The workstation monitor before anyone sits down: a slow interference of the
// five channel notes, drawn at a scale the eye can follow, and the dock.
export const drawMonitor = (screen, { frequencies, time, fonts, label }) => {
  const { context, width, height } = screen;
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#08110e");
  gradient.addColorStop(1, INK);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(242,251,247,0.55)";
  context.font = `600 15px ${fonts.mono}`;
  context.fillText("VANTA / STUDIO", 22, 30);
  context.textAlign = "right";
  context.fillText(label, width - 22, 30);
  context.textAlign = "left";
  context.fillStyle = "rgba(242,251,247,0.12)";
  context.fillRect(22, 42, width - 44, 1);

  // Five notes as one wave: each frequency slowed by the same factor, so the
  // ratios between them, and therefore the shape, are the real chord's.
  const mid = height * 0.48;
  const amplitude = height * 0.2;
  const slow = 1 / 160;
  const draw = (alpha, lineWidth, color) => {
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    for (let x = 0; x <= width - 44; x += 2) {
      const t = x / (width - 44);
      let value = 0;
      frequencies.forEach((frequency, index) => {
        value += Math.sin((t * 6 + time * 0.00004 * (index + 1)) * frequency * slow * Math.PI * 2);
      });
      const y = mid - (value / frequencies.length) * amplitude * 1.6;
      if (x === 0) context.moveTo(22 + x, y);
      else context.lineTo(22 + x, y);
    }
    context.stroke();
  };
  draw(0.14, 9, MINT);
  draw(1, 2, MINT);
  context.globalAlpha = 1;

  context.fillStyle = "rgba(242,251,247,0.62)";
  context.font = `500 16px ${fonts.body}`;
  context.fillText("G3 · C4 · E4 · G4 · C5", 22, height * 0.78);

  // The dock.
  const icons = 7;
  const size = 26;
  const gap = 14;
  const total = icons * size + (icons - 1) * gap;
  const startX = (width - total) / 2;
  context.fillStyle = "rgba(242,251,247,0.07)";
  context.fillRect(startX - 14, height - 52, total + 28, 40);
  for (let index = 0; index < icons; index += 1) {
    context.fillStyle = index === 0 ? MINT : index === 3 ? AMBER : "rgba(242,251,247,0.32)";
    context.globalAlpha = index === 0 || index === 3 ? 0.9 : 1;
    context.fillRect(startX + index * (size + gap), height - 45, size, size);
  }
  context.globalAlpha = 1;
  screen.texture.needsUpdate = true;
};

export { AMBER, INK, MINT, PAPER };

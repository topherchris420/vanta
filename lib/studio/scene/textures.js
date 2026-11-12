// Surfaces for the studio, drawn rather than downloaded. Every texture here is
// a small canvas painted once at start-up: timber, plaster, felt, the sky
// outside the windows, and the paper labels on the instruments. Nothing is
// fetched except Christopher's own images, which the scene loads separately.
import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

// A small deterministic generator, so the grain is the same on every visit.
const createRandom = (seed) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const finish = (canvas, { repeat = true, color = true, anisotropy = 1 } = {}) => {
  const texture = new CanvasTexture(canvas);
  if (repeat) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
  }
  if (color) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
};

const hex = (value) => "#" + value.toString(16).padStart(6, "0");

const shade = (value, amount) => {
  const r = Math.min(255, Math.max(0, ((value >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((value >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (value & 255) + amount));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
};

// Fine speckle over a whole canvas: the difference between a surface and a
// flat colour.
const speckle = (context, size, random, amount, alpha = 0.06) => {
  for (let index = 0; index < amount; index += 1) {
    const light = random() > 0.5;
    context.fillStyle = light
      ? `rgba(255,255,255,${alpha * random()})`
      : `rgba(0,0,0,${alpha * 1.6 * random()})`;
    const s = 1 + random() * 2;
    context.fillRect(random() * size, random() * size, s, s);
  }
};

// Floorboards: staggered planks, each with its own tone and a few long grain
// lines. Returns a colour map and a matching roughness map, so worn boards
// catch the window light differently from fresh ones.
export const createFloorTextures = (size, anisotropy) => {
  const random = createRandom(31);
  const color = createCanvas(size, size);
  const rough = createCanvas(size, size);
  const c = color.getContext("2d");
  const r = rough.getContext("2d");
  const rows = 8;
  const plankHeight = size / rows;

  c.fillStyle = "#1c1611";
  c.fillRect(0, 0, size, size);
  r.fillStyle = "#8a8a8a";
  r.fillRect(0, 0, size, size);

  for (let row = 0; row < rows; row += 1) {
    let x = -random() * size * 0.5;
    while (x < size) {
      const length = size * (0.42 + random() * 0.4);
      const tone = -6 + random() * 12;
      const y = row * plankHeight;
      c.fillStyle = shade(0x2b2119, tone);
      c.fillRect(x, y, length, plankHeight);
      // Grain: long, slightly wandering strokes.
      for (let line = 0; line < 16; line += 1) {
        const gy = y + random() * plankHeight;
        c.strokeStyle = `rgba(${random() > 0.5 ? "255,220,180" : "0,0,0"},${0.03 + random() * 0.06})`;
        c.lineWidth = 0.6 + random();
        c.beginPath();
        c.moveTo(x, gy);
        c.bezierCurveTo(
          x + length * 0.3, gy + (random() - 0.5) * 5,
          x + length * 0.6, gy + (random() - 0.5) * 5,
          x + length, gy + (random() - 0.5) * 3
        );
        c.stroke();
      }
      const wear = 110 + random() * 70;
      r.fillStyle = `rgb(${wear},${wear},${wear})`;
      r.fillRect(x, y, length, plankHeight);
      // The gap between boards.
      c.fillStyle = "rgba(0,0,0,0.55)";
      c.fillRect(x + length - 1.5, y, 1.5, plankHeight);
      r.fillStyle = "#e8e8e8";
      r.fillRect(x + length - 1.5, y, 1.5, plankHeight);
      x += length;
    }
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.fillRect(0, row * plankHeight, size, 1.5);
    r.fillStyle = "#e8e8e8";
    r.fillRect(0, row * plankHeight, size, 1.5);
  }
  speckle(c, size, random, size * 6, 0.05);
  // Soft scuffs where people have walked.
  for (let index = 0; index < 26; index += 1) {
    const cx = random() * size;
    const cy = random() * size;
    const radius = 20 + random() * 70;
    const gradient = r.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, "rgba(40,40,40,0.35)");
    gradient.addColorStop(1, "rgba(40,40,40,0)");
    r.fillStyle = gradient;
    r.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  return {
    map: finish(color, { anisotropy }),
    roughnessMap: finish(rough, { color: false, anisotropy }),
  };
};

// Hand-trowelled plaster: a base tone with broad mottling and fine speckle.
export const createPlasterTexture = (size, base, seed = 7) => {
  const random = createRandom(seed);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  context.fillStyle = hex(base);
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 90; index += 1) {
    const cx = random() * size;
    const cy = random() * size;
    const radius = size * (0.05 + random() * 0.2);
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const light = random() > 0.5;
    gradient.addColorStop(0, light ? "rgba(255,255,255,0.022)" : "rgba(0,0,0,0.04)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  // Trowel sweeps.
  for (let index = 0; index < 60; index += 1) {
    context.strokeStyle = `rgba(255,255,255,${0.012 + random() * 0.02})`;
    context.lineWidth = 6 + random() * 18;
    context.beginPath();
    const x = random() * size;
    const y = random() * size;
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x + (random() - 0.5) * 200, y + (random() - 0.5) * 60,
      x + (random() - 0.5) * 320, y + (random() - 0.5) * 120
    );
    context.stroke();
  }
  speckle(context, size, random, size * 5, 0.045);
  return finish(canvas);
};

// Timber for furniture: straight grain along one axis.
export const createWoodTexture = (size, base, seed = 3) => {
  const random = createRandom(seed);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  context.fillStyle = hex(base);
  context.fillRect(0, 0, size, size);
  for (let line = 0; line < size / 2; line += 1) {
    const y = random() * size;
    context.strokeStyle = `rgba(${random() > 0.45 ? "0,0,0" : "255,214,170"},${0.03 + random() * 0.09})`;
    context.lineWidth = 0.5 + random() * 1.6;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(
      size * 0.33, y + (random() - 0.5) * 8,
      size * 0.66, y + (random() - 0.5) * 8,
      size, y + (random() - 0.5) * 4
    );
    context.stroke();
  }
  speckle(context, size, random, size * 3, 0.04);
  return finish(canvas);
};

// Woven felt for the acoustic panels and the armchair.
export const createFeltTexture = (size, base) => {
  const random = createRandom(19);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  context.fillStyle = hex(base);
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < size * 14; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const angle = random() * Math.PI;
    const length = 2 + random() * 5;
    context.strokeStyle = `rgba(${random() > 0.5 ? "255,255,255" : "0,0,0"},${0.03 + random() * 0.05})`;
    context.lineWidth = 0.6;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    context.stroke();
  }
  return finish(canvas);
};

// A woven rug in the site's own colours: ink ground, a mint and amber border.
export const createRugTexture = (size, { ground = "#0d1512", line = "#89f2c2", accent = "#e7b85e" } = {}) => {
  const random = createRandom(53);
  const canvas = createCanvas(size, Math.round(size * 0.66));
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 0.5;
  context.strokeStyle = accent;
  context.lineWidth = size * 0.012;
  context.strokeRect(size * 0.05, size * 0.05, width - size * 0.1, height - size * 0.1);
  context.strokeStyle = line;
  context.lineWidth = size * 0.004;
  context.strokeRect(size * 0.085, size * 0.085, width - size * 0.17, height - size * 0.17);
  // Five lines across the field: a stave with nothing written on it.
  for (let index = 0; index < 5; index += 1) {
    const y = height * (0.36 + index * 0.07);
    context.beginPath();
    context.moveTo(size * 0.16, y);
    context.lineTo(width - size * 0.16, y);
    context.stroke();
  }
  context.globalAlpha = 1;
  // Weave.
  for (let y = 0; y < height; y += 2) {
    context.fillStyle = `rgba(0,0,0,${0.1 + random() * 0.1})`;
    context.fillRect(0, y, width, 1);
  }
  speckle(context, Math.max(width, height), random, size * 5, 0.05);
  return finish(canvas, { repeat: false });
};

// The sky outside: last light on the horizon under a deep ink dusk, with a
// few stars. Painted on a strip that wraps the building.
export const createSkyTexture = (size) => {
  const random = createRandom(101);
  const canvas = createCanvas(size * 2, size);
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#03060a");
  gradient.addColorStop(0.42, "#0a1a22");
  gradient.addColorStop(0.66, "#1f4a4c");
  gradient.addColorStop(0.8, "#6b8f7c");
  gradient.addColorStop(0.9, "#d9b06a");
  gradient.addColorStop(1, "#3a2a1c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  for (let index = 0; index < 260; index += 1) {
    const y = Math.pow(random(), 1.8) * height * 0.55;
    context.fillStyle = `rgba(242,251,247,${0.25 + random() * 0.6})`;
    const s = random() > 0.92 ? 2 : 1;
    context.fillRect(random() * width, y, s, s);
  }
  // A far ridge line, so the horizon is a place and not a gradient stop.
  context.fillStyle = "#07100e";
  context.beginPath();
  context.moveTo(0, height);
  let y = height * 0.9;
  for (let x = 0; x <= width; x += width / 90) {
    y += (random() - 0.5) * height * 0.012;
    y = Math.min(Math.max(y, height * 0.875), height * 0.925);
    context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.closePath();
  context.fill();
  return finish(canvas, { repeat: false });
};

// A soft round glow for lamps and indicator lights.
export const createGlowTexture = (size = 128) => {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.14)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return finish(canvas, { repeat: false });
};

// A shaft of window light: bright where it enters, gone before the floor.
export const createShaftTexture = () => {
  const canvas = createCanvas(64, 256);
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.32)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 256);
  const across = context.createLinearGradient(0, 0, 64, 0);
  across.addColorStop(0, "rgba(0,0,0,0.9)");
  across.addColorStop(0.25, "rgba(0,0,0,0)");
  across.addColorStop(0.75, "rgba(0,0,0,0)");
  across.addColorStop(1, "rgba(0,0,0,0.9)");
  context.globalCompositeOperation = "destination-out";
  context.fillStyle = across;
  context.fillRect(0, 0, 64, 256);
  return finish(canvas, { repeat: false });
};

/* ------------------------------------------------------------------ labels */

const wrapText = (context, text, maxWidth) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? current + " " + word : word;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
};

// A printed label: paper, brass, or a dark instrument panel. `draw` receives
// the 2D context and the font names, and is kept so the label can be redrawn
// once the site's webfonts have loaded.
export const createLabel = ({ width = 512, height = 256, draw, fonts }) => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const texture = finish(canvas, { repeat: false, anisotropy: 4 });
  const redraw = (nextFonts = fonts) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    draw(context, { width, height, fonts: nextFonts, wrap: (text, max) => wrapText(context, text, max) });
    texture.needsUpdate = true;
  };
  redraw();
  texture.userData = { redraw };
  return texture;
};

// The common placard: a small heading in mono, a title, and a few lines.
export const drawPlacard = (
  context,
  { width, height, fonts, wrap },
  { eyebrow, title, lines = [], ground = "#f2fbf7", ink = "#050806", accent = "#7a5a16" }
) => {
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);
  const pad = width * 0.07;
  let y = pad * 1.5;
  context.textBaseline = "top";
  if (eyebrow) {
    context.fillStyle = accent;
    context.font = `600 ${Math.round(width * 0.038)}px ${fonts.mono}`;
    context.fillText(String(eyebrow).toUpperCase(), pad, y);
    y += width * 0.07;
  }
  if (title) {
    context.fillStyle = ink;
    context.font = `700 ${Math.round(width * 0.075)}px ${fonts.display}`;
    wrap(title, width - pad * 2).forEach((line) => {
      context.fillText(line, pad, y);
      y += width * 0.088;
    });
    y += width * 0.02;
  }
  context.fillStyle = ink;
  context.globalAlpha = 0.82;
  context.font = `400 ${Math.round(width * 0.04)}px ${fonts.body}`;
  lines.forEach((entry) => {
    wrap(entry, width - pad * 2).forEach((line) => {
      if (y < height - pad) context.fillText(line, pad, y);
      y += width * 0.054;
    });
    y += width * 0.014;
  });
  context.globalAlpha = 1;
};

export { createCanvas, createRandom };

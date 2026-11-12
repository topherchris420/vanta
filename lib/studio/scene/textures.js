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

  c.fillStyle = "#4a3626";
  c.fillRect(0, 0, size, size);
  r.fillStyle = "#8a8a8a";
  r.fillRect(0, 0, size, size);

  for (let row = 0; row < rows; row += 1) {
    let x = -random() * size * 0.5;
    while (x < size) {
      const length = size * (0.42 + random() * 0.4);
      const tone = -6 + random() * 12;
      const y = row * plankHeight;
      c.fillStyle = shade(0x8f6d4c, tone * 1.6);
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
      const wear = 96 + random() * 56;
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
export const createRugTexture = (size, { ground = "#22332c", line = "#89f2c2", accent = "#e7b85e" } = {}) => {
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

// Where the horizon sits on the sky drum, as a fraction of its height from
// the top. The drum runs from ten metres below the floor to eighty above, and
// the horizon is drawn at eye level.
export const SKY = { radius: 72, bottom: -10, top: 80, horizon: 1.6 };
const HORIZON_V = 1 - (SKY.horizon - SKY.bottom) / (SKY.top - SKY.bottom);
// The sun has just gone down in the north-west; u runs round the drum from
// south (0) through east (0.25) and north (0.5) to west (0.75).
export const SUNSET_U = 0.6;

const ridge = (random, count) => {
  const waves = Array.from({ length: count }, () => ({
    frequency: 1 + Math.floor(random() * 14),
    phase: random() * Math.PI * 2,
    amplitude: 0.3 + random() * 0.7,
  }));
  const total = waves.reduce((sum, wave) => sum + wave.amplitude, 0);
  // Whole-number frequencies, so the ridge joins itself round the drum.
  return (u) =>
    waves.reduce((sum, wave) => sum + Math.sin(u * Math.PI * 2 * wave.frequency + wave.phase) * wave.amplitude, 0) / total;
};

// The view from the windows: the sky a few minutes after sunset, a lake, the
// hills across it, and the lights of the far shore coming on.
export const createSkyTexture = (size) => {
  const random = createRandom(101);
  const width = size * 4;
  const height = size;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const horizon = Math.round(height * HORIZON_V);

  const sky = context.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0a1420");
  sky.addColorStop(0.3, "#16303f");
  sky.addColorStop(0.55, "#3f4f6e");
  sky.addColorStop(0.74, "#8d6f96");
  sky.addColorStop(0.88, "#dc8f86");
  sky.addColorStop(0.96, "#f6b27c");
  sky.addColorStop(1, "#ffd296");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, horizon);

  // Afterglow where the sun went down, and its cooler echo opposite.
  const glowAt = (u, radius, inner, outer) => {
    [u - 1, u, u + 1].forEach((offset) => {
      const cx = offset * width;
      const glow = context.createRadialGradient(cx, horizon, 0, cx, horizon, radius);
      glow.addColorStop(0, inner);
      glow.addColorStop(1, outer);
      context.fillStyle = glow;
      context.save();
      context.translate(cx, horizon);
      context.scale(2.6, 1);
      context.translate(-cx, -horizon);
      context.fillRect(cx - radius, horizon - radius, radius * 2, radius);
      context.restore();
    });
  };
  glowAt(SUNSET_U, height * 0.5, "rgba(255,214,150,0.85)", "rgba(255,150,110,0)");
  glowAt(SUNSET_U, height * 0.2, "rgba(255,240,200,0.8)", "rgba(255,200,140,0)");
  glowAt(SUNSET_U + 0.5, height * 0.4, "rgba(70,90,140,0.4)", "rgba(40,60,110,0)");

  // A few stars, high up and away from the glow.
  for (let index = 0; index < 500; index += 1) {
    const y = Math.pow(random(), 2.2) * horizon * 0.5;
    context.fillStyle = `rgba(242,251,247,${0.15 + random() * 0.5})`;
    context.fillRect(random() * width, y, random() > 0.9 ? 2 : 1, random() > 0.9 ? 2 : 1);
  }

  // Thin evening cloud, lit pink from below.
  for (let index = 0; index < 90; index += 1) {
    const cx = random() * width;
    const cy = horizon * (0.52 + random() * 0.42);
    const rx = height * (0.12 + random() * 0.4);
    const ry = height * (0.004 + random() * 0.014);
    const warm = cy > horizon * 0.75;
    const cloud = context.createRadialGradient(cx, cy, 0, cx, cy, rx);
    cloud.addColorStop(0, warm ? `rgba(255,170,150,${0.1 + random() * 0.16})` : `rgba(150,130,180,${0.08 + random() * 0.1})`);
    cloud.addColorStop(1, "rgba(0,0,0,0)");
    context.save();
    context.translate(cx, cy);
    context.scale(1, ry / rx);
    context.translate(-cx, -cy);
    context.fillStyle = cloud;
    context.fillRect(cx - rx, cy - rx, rx * 2, rx * 2);
    context.restore();
  }

  // Three ranges of hills, each nearer and darker than the last.
  [
    { rise: 0.085, color: "#8a6f96", waves: 5, base: 0.03 },
    { rise: 0.06, color: "#5d4f78", waves: 7, base: 0.016 },
    { rise: 0.034, color: "#2f2c4a", waves: 9, base: 0.006 },
  ].forEach((range) => {
    const shape = ridge(random, range.waves);
    context.fillStyle = range.color;
    context.beginPath();
    context.moveTo(0, horizon + 2);
    for (let x = 0; x <= width; x += 4) {
      const y = horizon - height * (range.base + range.rise * (0.5 + 0.5 * shape(x / width)));
      context.lineTo(x, y);
    }
    context.lineTo(width, horizon + 2);
    context.closePath();
    context.fill();
  });
  // Haze where the hills meet the water.
  const haze = context.createLinearGradient(0, horizon - height * 0.05, 0, horizon);
  haze.addColorStop(0, "rgba(255,190,150,0)");
  haze.addColorStop(1, "rgba(255,196,160,0.42)");
  context.fillStyle = haze;
  context.fillRect(0, horizon - height * 0.05, width, height * 0.05);

  // The lake, below the horizon: the sky again, darker and stiller.
  const water = context.createLinearGradient(0, horizon, 0, height);
  water.addColorStop(0, "#e0a08a");
  water.addColorStop(0.18, "#8f6f93");
  water.addColorStop(0.6, "#3a4466");
  water.addColorStop(1, "#141f33");
  context.fillStyle = water;
  context.fillRect(0, horizon, width, height - horizon);

  // Lights along the far shore, and their reflections.
  for (let index = 0; index < 260; index += 1) {
    const cluster = Math.floor(random() * 9) / 9 + (random() - 0.5) * 0.05;
    const x = ((cluster % 1) + 1) % 1 * width;
    const y = horizon - 1 - random() * height * 0.006;
    const warm = random() > 0.2;
    const alpha = 0.5 + random() * 0.5;
    context.fillStyle = warm ? `rgba(255,214,150,${alpha})` : `rgba(210,240,255,${alpha})`;
    context.fillRect(x, y, 2, 2);
    const streak = context.createLinearGradient(0, horizon, 0, horizon + height * 0.03);
    streak.addColorStop(0, warm ? `rgba(255,205,140,${alpha * 0.5})` : `rgba(200,230,255,${alpha * 0.4})`);
    streak.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = streak;
    context.fillRect(x, horizon + 1, 2, height * 0.03);
  }

  const texture = finish(canvas, { repeat: false });
  texture.wrapS = RepeatWrapping;
  return texture;
};

// The lake as seen from above the windowsill: darkest at your feet, taking the
// sky's colour toward the far shore, with a path of light toward the sunset.
export const createWaterTexture = (size) => {
  const random = createRandom(211);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const half = size / 2;
  const base = context.createRadialGradient(half, half, 0, half, half, half);
  base.addColorStop(0, "#101a2a");
  base.addColorStop(0.35, "#232c4a");
  base.addColorStop(0.7, "#5d5580");
  base.addColorStop(0.92, "#b98590");
  base.addColorStop(1, "#e0a08a");
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  // The glitter path: toward the sunset. On the disc, +x is east and +y
  // (canvas down) is south, so the north-west is up and to the left.
  const angle = SUNSET_U * Math.PI * 2;
  const dx = Math.sin(angle);
  const dy = Math.cos(angle);
  for (let index = 0; index < 1400; index += 1) {
    const along = Math.pow(random(), 0.7) * half;
    const across = (random() - 0.5) * (8 + along * 0.22);
    const x = half + dx * along - dy * across;
    const y = half + dy * along + dx * across;
    context.fillStyle = `rgba(255,${190 + Math.floor(random() * 40)},${130 + Math.floor(random() * 50)},${0.05 + random() * 0.22})`;
    context.fillRect(x, y, 1 + random() * 3, 1);
  }
  return finish(canvas, { repeat: false });
};

// Light falling down a wall from a strip above it: brightest at the top edge,
// gone by the bottom, feathered at the sides.
export const createWashTexture = () => {
  const size = 256;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    const fall = Math.pow(1 - v, 2.2) * (0.25 + 0.75 * Math.exp(-v * 5));
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const side = Math.min(1, Math.min(u, 1 - u) / 0.12);
      const value = Math.round(255 * fall * side * side * (3 - 2 * side));
      const index = (y * size + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finish(canvas, { repeat: false, color: false });
};

// The baked light on a slatted wall: `washes` are strips, each at a height
// (0 at the floor, 1 at the top) throwing light down (-1) or up (+1).
export const createSlatWashTexture = (washes) => {
  const width = 64;
  const height = 512;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "lighter";
  washes.forEach(({ at, direction, reach, strength = 1 }) => {
    const y0 = (1 - at) * height;
    const y1 = y0 - direction * reach * height;
    const gradient = context.createLinearGradient(0, y0, 0, y1);
    const level = (value) => Math.round(255 * Math.min(1, value * strength));
    gradient.addColorStop(0, `rgb(${level(1)},${level(1)},${level(1)})`);
    gradient.addColorStop(0.12, `rgb(${level(0.62)},${level(0.62)},${level(0.62)})`);
    gradient.addColorStop(0.4, `rgb(${level(0.24)},${level(0.24)},${level(0.24)})`);
    gradient.addColorStop(1, "rgb(0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, Math.min(y0, y1), width, Math.abs(y1 - y0));
  });
  const texture = finish(canvas, { repeat: false, color: false });
  texture.channel = 1;
  return texture;
};

// The marker over something you can use: a ring with a dot in it.
export const createMarkerTexture = () => {
  const size = 96;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const half = size / 2;
  const halo = context.createRadialGradient(half, half, 0, half, half, half);
  halo.addColorStop(0, "rgba(255,255,255,0.28)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = halo;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "#fff";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(half, half, 26, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#fff";
  context.beginPath();
  context.arc(half, half, 9, 0, Math.PI * 2);
  context.fill();
  return finish(canvas, { repeat: false });
};

// The face of a softbox: bright in the middle, a little less at the seams.
export const createDiffuserTexture = () => {
  const size = 128;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.75);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.6, "#f4e9da");
  gradient.addColorStop(1, "#b9a58c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
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

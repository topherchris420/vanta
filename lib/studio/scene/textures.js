// Generated textiles, instrument graphics and labels. Photographic surfaces load separately.
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

// Tileable value noise: a lattice of `period` cells that wraps, so a texture
// built from it repeats without a seam. `fbm` sums octaves of it.
const createNoise = (seed, period) => {
  const random = createRandom(seed);
  const lattice = new Float32Array(period * period);
  for (let index = 0; index < lattice.length; index += 1) lattice[index] = random();
  const at = (ix, iy) => lattice[(((iy % period) + period) % period) * period + (((ix % period) + period) % period)];
  const noise = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return top + (bottom - top) * sy;
  };
  // x and y in lattice cells; octaves double the frequency and keep the wrap.
  noise.fbm = (x, y, octaves = 3) => {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let total = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      sum += noise(x * frequency, y * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / total;
  };
  return noise;
};

const clamp255 = (value) => (value < 0 ? 0 : value > 255 ? 255 : value);

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

// Upholstery: a soft woven bouclé, loops catching the light on a darker weft.
export const createWeaveTexture = (size, base, seed = 29) => {
  const loops = createNoise(seed, 64);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const br = (base >> 16) & 255;
  const bg = (base >> 8) & 255;
  const bb = base & 255;
  const threads = size / 6;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const warp = 0.5 + 0.5 * Math.sin((x / size) * threads * Math.PI * 2);
      const weft = 0.5 + 0.5 * Math.sin((y / size) * threads * Math.PI * 2);
      const loop = loops.fbm((x / size) * 64, (y / size) * 64, 2);
      const light = 0.78 + 0.12 * (warp * weft) + 0.22 * loop;
      const index = (y * size + x) * 4;
      image.data[index] = clamp255(br * light);
      image.data[index + 1] = clamp255(bg * light);
      image.data[index + 2] = clamp255(bb * light);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finish(canvas);
};

// A flat-woven jute rug, the base layer under a patterned one.
export const createJuteTexture = (size, seed = 61) => {
  const fibre = createNoise(seed, 64);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const cell = size / 24;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Basket weave: the direction of the strands alternates cell by cell.
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const across = (cx + cy) % 2 === 0;
      const t = across ? (y % cell) / cell : (x % cell) / cell;
      const strand = 0.5 + 0.5 * Math.cos(t * Math.PI * 6);
      const hair = fibre(across ? (x / size) * 8 : (x / size) * 64, across ? (y / size) * 64 : (y / size) * 8);
      const light = 0.72 + 0.18 * strand + 0.16 * hair;
      const index = (y * size + x) * 4;
      image.data[index] = clamp255(196 * light);
      image.data[index + 1] = clamp255(162 * light);
      image.data[index + 2] = clamp255(116 * light);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
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

// A wall wash falls from a downlight and fades before the floor.
export const createScallopTexture = () => {
  const width = 128;
  const height = 256;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const spread = 0.12 + 0.88 * Math.sqrt(v);
    const onset = Math.min(1, v / 0.07);
    const fall = Math.exp(-v * 1.9) * onset * onset;
    for (let x = 0; x < width; x += 1) {
      const u = Math.abs((x / (width - 1)) * 2 - 1) / spread;
      const inside = u >= 1 ? 0 : 1 - u * u;
      const rim = 1 + 0.5 * Math.exp(-Math.pow((u - 0.86) / 0.1, 2)) * (1 - v);
      const value = clamp255(255 * inside * fall * rim);
      const index = (y * width + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finish(canvas, { repeat: false, color: false });
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

// The blade geometry supplies the silhouette and curl. These veins follow
// its own UVs from the petiole to the tip instead of tiling across the plant.
export const createFicusTexture = () => {
  const canvas = createCanvas(128, 256);
  const context = canvas.getContext("2d");
  const body = context.createLinearGradient(0, 0, 128, 35);
  [[0, "#466338"], [0.4, "#49683c"], [0.49, "#5b7542"], [0.52, "#48643a"], [1, "#344e31"]].forEach(([pos, color]) => body.addColorStop(pos, color));
  context.fillStyle = body;
  context.fillRect(0, 0, 128, 256);
  for (let y = 26; y < 253; y += 12) {
    for (const edge of [0, 128]) {
      context.beginPath();
      context.moveTo(64, y);
      context.quadraticCurveTo(edge * 0.55 + 29, y - 13, edge, y - 36);
      context.strokeStyle = "rgba(165,174,98,0.31)";
      context.lineWidth = 1.1;
      context.stroke();
    }
  }
  context.beginPath();
  context.moveTo(62.2, 256); context.lineTo(64, 0); context.lineTo(65.2, 256);
  context.fillStyle = "#879359"; context.fill();
  return finish(canvas, { repeat: false });
};

// The face of a softbox: bright in the middle, a little less at the seams.
export const createDiffuserTexture = () => {
  const size = 128;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.75);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.6, "#e0d3c2");
  gradient.addColorStop(1, "#999084");
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

export { createCanvas, createRandom, finish };

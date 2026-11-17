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

// Floorboards: wide oiled oak, staggered. Each plank has its own tone and its
// own flat-sawn figure (growth rings drawn per pixel from tileable noise), a
// hair of shadow at every joint, and a roughness map that follows the grain
// and the wear, so low sun picks out the boards rather than a flat sheet.
export const createFloorTextures = (size, anisotropy) => {
  const random = createRandom(31);
  const grain = createNoise(41, 16);
  const fine = createNoise(43, 64);
  const color = createCanvas(size, size);
  const rough = createCanvas(size, size);
  const c = color.getContext("2d");
  const r = rough.getContext("2d");
  const colorImage = c.createImageData(size, size);
  const roughImage = r.createImageData(size, size);
  const rows = 8;
  const plankHeight = size / rows;
  const joint = Math.max(1, size / 700);
  const tones = [
    [158, 122, 88],
    [148, 112, 80],
    [166, 130, 94],
    [140, 106, 76],
    [154, 118, 86],
  ];

  for (let row = 0; row < rows; row += 1) {
    // Planks along this row, wrapping round the texture so it tiles.
    const plankOf = new Int16Array(size);
    const startOf = new Float32Array(size);
    const planks = [];
    let position = Math.floor(random() * size);
    let covered = 0;
    while (covered < size) {
      const length = Math.min(size - covered, Math.round(size * (0.45 + random() * 0.5)));
      const base = tones[Math.floor(random() * tones.length)];
      const shift = 0.9 + random() * 0.2;
      planks.push({
        tone: base.map((value) => value * shift),
        rings: 2.2 + random() * 3.2,
        offset: random() * 10,
        wear: 0.42 + random() * 0.14,
        knot: random() < 0.3 ? { x: random(), y: 0.25 + random() * 0.5 } : null,
      });
      for (let step = 0; step < length; step += 1) {
        const x = (position + step) % size;
        plankOf[x] = planks.length - 1;
        startOf[x] = step / length;
      }
      position = (position + length) % size;
      covered += length;
    }
    const y0 = Math.round(row * plankHeight);
    const y1 = Math.round((row + 1) * plankHeight);
    for (let y = y0; y < y1; y += 1) {
      const ly = (y - y0) / (y1 - y0);
      const yc = (y / size) * 16;
      for (let x = 0; x < size; x += 1) {
        const plank = planks[plankOf[x]];
        const xc = (x / size) * 16;
        let d = ly * plank.rings + grain.fbm(xc * 0.5, yc * 2, 3) * 2.4 + plank.offset;
        if (plank.knot) {
          const kx = (startOf[x] - plank.knot.x) * 9;
          const ky = (ly - plank.knot.y) * 2.2;
          d += 0.6 / (1 + (kx * kx + ky * ky) * 10);
        }
        const ring = Math.pow(0.5 + 0.5 * Math.cos(d * Math.PI * 2), 3);
        const pore = fine(xc * 1.2, yc * 18);
        let light = (1 - 0.14 * ring) * (0.94 + 0.1 * pore);
        // A worn, slightly darker band toward each long edge, then the joint.
        const edge = Math.min(y - y0, y1 - 1 - y);
        const end = Math.min(startOf[x], 1 - startOf[x]) * size;
        if (edge < joint || end < joint * 0.8) light *= 0.32;
        else if (edge < joint * 3) light *= 0.86;
        const index = (y * size + x) * 4;
        colorImage.data[index] = clamp255(plank.tone[0] * light);
        colorImage.data[index + 1] = clamp255(plank.tone[1] * light);
        colorImage.data[index + 2] = clamp255(plank.tone[2] * light);
        colorImage.data[index + 3] = 255;
        const roughness = edge < joint || end < joint * 0.8 ? 0.95 : plank.wear + ring * 0.1 + (pore - 0.5) * 0.06;
        const value = clamp255(roughness * 255);
        roughImage.data[index] = value;
        roughImage.data[index + 1] = value;
        roughImage.data[index + 2] = value;
        roughImage.data[index + 3] = 255;
      }
    }
  }
  c.putImageData(colorImage, 0, 0);
  r.putImageData(roughImage, 0, 0);
  // Soft scuffs where people have walked, duller than the oiled boards.
  for (let index = 0; index < 22; index += 1) {
    const cx = random() * size;
    const cy = random() * size;
    const radius = size * (0.03 + random() * 0.08);
    const gradient = r.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, "rgba(200,200,200,0.16)");
    gradient.addColorStop(1, "rgba(200,200,200,0)");
    r.fillStyle = gradient;
    r.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  return {
    map: finish(color, { anisotropy }),
    roughnessMap: finish(rough, { color: false, anisotropy }),
  };
};

// Hand-trowelled lime plaster: broad, soft clouds of tone, the arcs of the
// trowel, and a fine sanded grain. The same canvas doubles as its bump map.
export const createPlasterTexture = (size, base, seed = 7) => {
  const random = createRandom(seed);
  const broad = createNoise(seed, 6);
  const fine = createNoise(seed + 1, 128);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const br = (base >> 16) & 255;
  const bg = (base >> 8) & 255;
  const bb = base & 255;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const cloud = broad.fbm(u * 6, v * 6, 4);
      const grain = fine(u * 128, v * 128);
      const light = 1 + (cloud - 0.5) * 0.14 + (grain - 0.5) * 0.05;
      const index = (y * size + x) * 4;
      // Darker patches lean a touch warmer, the way lime plaster dries.
      image.data[index] = clamp255(br * light + (cloud < 0.5 ? 2 : 0));
      image.data[index + 1] = clamp255(bg * light);
      image.data[index + 2] = clamp255(bb * light - (cloud < 0.5 ? 2 : 0));
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  // Trowel sweeps.
  for (let index = 0; index < 70; index += 1) {
    const light = random() > 0.4;
    context.strokeStyle = light ? `rgba(255,255,255,${0.02 + random() * 0.03})` : `rgba(90,70,50,${0.015 + random() * 0.02})`;
    context.lineWidth = size * (0.008 + random() * 0.02);
    context.lineCap = "round";
    context.beginPath();
    const x = random() * size;
    const y = random() * size;
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x + (random() - 0.5) * size * 0.25, y + (random() - 0.5) * size * 0.06,
      x + (random() - 0.5) * size * 0.4, y + (random() - 0.5) * size * 0.12
    );
    context.stroke();
  }
  speckle(context, size, random, size * 4, 0.035);
  return finish(canvas);
};

// Timber for furniture and joinery: flat-sawn figure along one axis, pores,
// and the slow change of tone across a board.
export const createWoodTexture = (size, base, seed = 3) => {
  const figure = createNoise(seed, 8);
  const fine = createNoise(seed + 5, 64);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const br = (base >> 16) & 255;
  const bg = (base >> 8) & 255;
  const bb = base & 255;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const d = v * 7 + figure.fbm(u * 2, v * 8, 3) * 3.2;
      const ring = Math.pow(0.5 + 0.5 * Math.cos(d * Math.PI * 2), 4);
      const pore = fine(u * 6, v * 64);
      const board = figure(u * 8 + 3.3, v * 2 + 1.7);
      const light = (1 - 0.3 * ring) * (0.9 + 0.14 * pore) * (0.92 + 0.16 * board);
      const index = (y * size + x) * 4;
      image.data[index] = clamp255(br * light + ring * 6);
      image.data[index + 1] = clamp255(bg * light + ring * 2);
      image.data[index + 2] = clamp255(bb * light);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finish(canvas);
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
// Late afternoon, an hour before sunset: the sun stands low in the
// north-north-west. `u` runs round the drum from south (0) through east
// (0.25) and north (0.5) to west (0.75); `elevation` is in radians. The sky's
// painted sun, the directional light and the window shafts all read this.
export const SUN = { u: 0.6, elevation: 0.3 };
export const SUNSET_U = SUN.u;
const SUN_V = 1 - (SKY.horizon + SKY.radius * Math.tan(SUN.elevation) - SKY.bottom) / (SKY.top - SKY.bottom);

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

// Distance round the drum, in u, from the sun.
const fromSun = (u) => {
  const d = Math.abs(u - SUN.u) % 1;
  return Math.min(d, 1 - d);
};

// The view from the windows at golden hour: clear sky deepening overhead,
// warm haze toward the sun, a few lit clouds, a lake, and ranges of hills
// stepping back into the light.
export const createSkyTexture = (size) => {
  const random = createRandom(101);
  const clouds = createNoise(77, 16);
  const width = size * 4;
  const height = size;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const horizon = Math.round(height * HORIZON_V);
  const sunX = SUN.u * width;
  const sunY = SUN_V * height;

  // The sky itself, per pixel: a vertical gradient warmed toward the sun.
  const image = context.createImageData(width, horizon);
  const stops = [
    [0, [52, 92, 138]],
    [0.35, [86, 128, 168]],
    [0.62, [150, 176, 196]],
    [0.82, [226, 206, 178]],
    [0.94, [246, 204, 150]],
    [1, [252, 214, 160]],
  ];
  const gradientAt = (t) => {
    for (let index = 1; index < stops.length; index += 1) {
      if (t <= stops[index][0]) {
        const [t0, c0] = stops[index - 1];
        const [t1, c1] = stops[index];
        const k = (t - t0) / (t1 - t0);
        return c0.map((value, channel) => value + (c1[channel] - value) * k);
      }
    }
    return stops[stops.length - 1][1];
  };
  for (let y = 0; y < horizon; y += 1) {
    const t = y / horizon;
    const base = gradientAt(t);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const du = fromSun(u) * 4;
      const dv = (y - sunY) / height;
      const near = Math.exp(-(du * du * 6 + dv * dv * 22));
      const halo = Math.exp(-(du * du * 1.6 + dv * dv * 3));
      // Thin, high cloud: streaks stretched along the horizon.
      const c = clouds.fbm(u * 16, t * 3 + 0.4, 4);
      const band = Math.max(0, c - 0.52) * 2.6 * Math.min(1, t * 3) * (1 - Math.pow(t, 6));
      const lit = 0.35 + 0.65 * halo;
      const index = (y * width + x) * 4;
      image.data[index] = clamp255((base[0] + near * 90 + halo * 34 + band * (70 + 130 * lit)) * 0.86);
      image.data[index + 1] = clamp255((base[1] + near * 66 + halo * 18 + band * (56 + 90 * lit)) * 0.86);
      image.data[index + 2] = clamp255((base[2] + near * 20 - halo * 10 + band * (52 + 36 * lit)) * 0.86);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  // The sun: a hot core and its bloom, softened by haze.
  [sunX - width, sunX, sunX + width].forEach((cx) => {
    const glow = context.createRadialGradient(cx, sunY, 0, cx, sunY, height * 0.09);
    glow.addColorStop(0, "rgba(255,252,236,1)");
    glow.addColorStop(0.18, "rgba(255,244,214,0.95)");
    glow.addColorStop(0.45, "rgba(255,220,160,0.35)");
    glow.addColorStop(1, "rgba(255,200,140,0)");
    context.fillStyle = glow;
    context.fillRect(cx - height * 0.1, sunY - height * 0.1, height * 0.2, height * 0.2);
  });

  // Ranges of hills, each nearer, darker and less hazed than the last. The
  // side toward the sun is washed out by the light behind it.
  [
    { rise: 0.07, color: [160, 162, 176], waves: 5, base: 0.024, haze: 0.62 },
    { rise: 0.052, color: [118, 124, 138], waves: 7, base: 0.013, haze: 0.42 },
    { rise: 0.03, color: [70, 80, 84], waves: 9, base: 0.005, haze: 0.22 },
  ].forEach((range) => {
    const shape = ridge(random, range.waves);
    const fill = context.createLinearGradient(0, 0, width, 0);
    for (let step = 0; step <= 20; step += 1) {
      const u = step / 20;
      const warm = Math.exp(-Math.pow(fromSun(u) * 4, 2) * 1.6) * range.haze;
      const [r, g, b] = range.color;
      fill.addColorStop(u, `rgb(${Math.round(r + (250 - r) * warm)},${Math.round(g + (214 - g) * warm)},${Math.round(b + (168 - b) * warm)})`);
    }
    context.fillStyle = fill;
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
  // A line of trees along the near shore.
  context.fillStyle = "rgb(46,52,46)";
  context.beginPath();
  context.moveTo(0, horizon + 1);
  for (let x = 0; x <= width; x += 3) {
    const crown = random() < 0.5 ? random() * height * 0.012 : random() * height * 0.004;
    context.lineTo(x, horizon - height * 0.003 - crown);
  }
  context.lineTo(width, horizon + 1);
  context.closePath();
  context.fill();
  // Haze where the hills meet the water.
  const haze = context.createLinearGradient(0, horizon - height * 0.06, 0, horizon);
  haze.addColorStop(0, "rgba(250,216,170,0)");
  haze.addColorStop(1, "rgba(250,216,170,0.38)");
  context.fillStyle = haze;
  context.fillRect(0, horizon - height * 0.06, width, height * 0.06);

  // The lake, below the horizon: the sky again, deeper and stiller, with the
  // sun's path laid down it.
  const water = context.createLinearGradient(0, horizon, 0, height);
  water.addColorStop(0, "#d9c3a2");
  water.addColorStop(0.15, "#8fa2ae");
  water.addColorStop(0.6, "#3d5666");
  water.addColorStop(1, "#1a2a34");
  context.fillStyle = water;
  context.fillRect(0, horizon, width, height - horizon);
  for (let index = 0; index < 1600; index += 1) {
    const depth = Math.pow(random(), 1.6);
    const spread = (random() - 0.5) * (0.004 + depth * 0.05) * width;
    const x = sunX + spread;
    const y = horizon + 2 + depth * (height - horizon) * 0.9;
    const alpha = (0.15 + random() * 0.55) * (1 - depth * 0.7);
    context.fillStyle = `rgba(255,${226 + Math.floor(random() * 26)},${170 + Math.floor(random() * 50)},${alpha})`;
    const length = 2 + random() * (6 + depth * 18);
    [x - width, x, x + width].forEach((px) => context.fillRect(px - length / 2, y, length, 1 + depth * 1.5));
  }

  const texture = finish(canvas, { repeat: false });
  texture.wrapS = RepeatWrapping;
  return texture;
};

// The lake as seen from the windows, looking down: deep at the foot of the
// building, taking the sky's colour toward the far shore, with the sun's
// glitter path toward the north-north-west.
export const createWaterTexture = (size) => {
  const random = createRandom(211);
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const half = size / 2;
  const base = context.createRadialGradient(half, half, 0, half, half, half);
  base.addColorStop(0, "#132630");
  base.addColorStop(0.35, "#21404c");
  base.addColorStop(0.7, "#58737e");
  base.addColorStop(0.92, "#a8a596");
  base.addColorStop(1, "#d9c3a2");
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  // On the disc, +x is east and +y (canvas down) is south.
  const angle = SUN.u * Math.PI * 2;
  const dx = Math.sin(angle);
  const dy = Math.cos(angle);
  for (let index = 0; index < 2200; index += 1) {
    const along = Math.pow(random(), 0.6) * half;
    const across = (random() - 0.5) * (6 + along * 0.18);
    const x = half + dx * along - dy * across;
    const y = half + dy * along + dx * across;
    context.fillStyle = `rgba(255,${210 + Math.floor(random() * 40)},${150 + Math.floor(random() * 60)},${0.06 + random() * 0.3})`;
    context.fillRect(x, y, 1 + random() * 3, 1);
  }
  return finish(canvas, { repeat: false });
};

// A downlight's scallop on a wall: a sharp-topped cone of light opening as it
// falls, brightest at its rim, fading to nothing above the floor.
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

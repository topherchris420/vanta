// The building: floor, walls with their openings, ceiling and beams, windows,
// and the sky and light that come through them. All of it is read from the
// floor plan in lib/studio/layout.js, so the walls a visitor sees are the
// walls the walker collides with.
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { createSkyTexture, createWaterTexture, SKY } from "./textures";

// Where the last light comes from: low in the north-west.
export const SUN_POSITION = new Vector3(-9, 10, -15);
export const SUN_TARGET = new Vector3(1.5, 0, 2);

// Window openings. `wall` says which exterior wall, `span` runs along it,
// `rise` is sill to head.
export const WINDOWS = [
  { wall: "north", span: [-3.1, -1.9], rise: [0.4, 3.7] },
  { wall: "north", span: [1.9, 3.1], rise: [0.4, 3.7] },
  { wall: "west", span: [-6.6, -5.2], rise: [0.9, 3.3] },
  { wall: "west", span: [-3.4, -2], rise: [0.9, 3.3] },
  { wall: "west", span: [3.2, 5.8], rise: [0.9, 3.3] },
];

const buildExteriorWall = (kit, material, wall, windows, height) => {
  // A wall is built as full-height piers between its windows, plus the piece
  // under each sill and over each head.
  const along = wall === "north" || wall === "south" ? [-10.4, 10.4] : [-9.4, 9.4];
  const across =
    wall === "north" ? [-9.4, -9] : wall === "south" ? [9, 9.4] : wall === "west" ? [-10.4, -10] : [10, 10.4];
  const horizontal = wall === "north" || wall === "south";
  const piece = (a0, a1, y0, y1) => {
    if (a1 - a0 < 1e-4 || y1 - y0 < 1e-4) return;
    if (horizontal) kit.slab(material, [a0, a1], [y0, y1], across);
    else kit.slab(material, across, [y0, y1], [a0, a1]);
  };
  const sorted = [...windows].sort((a, b) => a.span[0] - b.span[0]);
  let cursor = along[0];
  sorted.forEach((window) => {
    piece(cursor, window.span[0], 0, height);
    piece(window.span[0], window.span[1], 0, window.rise[0]);
    piece(window.span[0], window.span[1], window.rise[1], height);
    cursor = window.span[1];
  });
  piece(cursor, along[1], 0, height);
};

const buildWindow = (kit, materials, window) => {
  const [a0, a1] = window.span;
  const [y0, y1] = window.rise;
  const north = window.wall === "north";
  const plane = north ? -9.2 : -10.2;
  const bar = 0.05;
  const depth = 0.1;
  const at = (a, y, sizeAlong, sizeUp) =>
    north
      ? kit.box(materials.iron, [sizeAlong, sizeUp, depth], [a, y, plane])
      : kit.box(materials.iron, [depth, sizeUp, sizeAlong], [plane, y, a]);
  const width = a1 - a0;
  const rise = y1 - y0;
  const mid = (a0 + a1) / 2;
  // Frame.
  at(mid, y0 + bar / 2, width, bar);
  at(mid, y1 - bar / 2, width, bar);
  at(a0 + bar / 2, (y0 + y1) / 2, bar, rise);
  at(a1 - bar / 2, (y0 + y1) / 2, bar, rise);
  // Glazing bars: these are what draw the grid in each pool of light.
  const columns = Math.max(1, Math.round(width / 0.62));
  for (let column = 1; column < columns; column += 1) {
    at(a0 + (width * column) / columns, (y0 + y1) / 2, bar * 0.6, rise);
  }
  const rows = Math.max(2, Math.round(rise / 0.8));
  for (let row = 1; row < rows; row += 1) {
    at(mid, y0 + (rise * row) / rows, width, bar * 0.6);
  }
  // A deep timber sill.
  if (north) kit.box(materials.darkWood, [width + 0.12, 0.05, 0.42], [mid, y0 - 0.02, -9.16]);
  else kit.box(materials.darkWood, [0.42, 0.05, width + 0.12], [-10.16, y0 - 0.02, mid]);
  // Glass.
  if (north) kit.plane(materials.glass, [width, rise], [mid, (y0 + y1) / 2, plane + 0.02]);
  else kit.plane(materials.glass, [width, rise], [plane + 0.02, (y0 + y1) / 2, mid], [0, Math.PI / 2, 0]);
};

// The volume a window's light fills on its way to the floor, as a sheared
// prism. Drawn additively and very faintly: it is the air, not an object.
const createShaftGeometry = (window, direction) => {
  const [a0, a1] = window.span;
  const [y0, y1] = window.rise;
  const north = window.wall === "north";
  const corner = (a, y) => (north ? new Vector3(a, y, -9) : new Vector3(-10, y, a));
  const top = [corner(a0, y1), corner(a1, y1)];
  const bottom = [corner(a0, y0), corner(a1, y0)];
  const land = (point) => {
    const t = point.y / -direction.y;
    return point.clone().addScaledVector(direction, t);
  };
  const vertices = [...top, ...bottom, ...top.map(land), ...bottom.map(land)];
  // 0,1 top at window; 2,3 bottom at window; 4,5 top landed; 6,7 bottom landed
  const faces = [
    [0, 1, 5, 4], // upper sheet
    [2, 3, 7, 6], // lower sheet
    [0, 2, 6, 4], // side
    [1, 3, 7, 5], // side
  ];
  const positions = [];
  const fades = [];
  faces.forEach(([a, b, c, d]) => {
    [a, b, c, a, c, d].forEach((index) => {
      const vertex = vertices[index];
      positions.push(vertex.x, vertex.y, vertex.z);
      fades.push(index < 4 ? 1 : 0);
    });
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aFade", new Float32BufferAttribute(fades, 1));
  return geometry;
};

const createShafts = (direction) => {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uColor: { value: new Color(1, 0.66, 0.42) },
      uStrength: { value: 0.045 },
    },
    vertexShader: `
      attribute float aFade;
      varying float vFade;
      void main() {
        vFade = aFade;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vFade;
      void main() {
        gl_FragColor = vec4(uColor, uStrength * (0.25 + 0.75 * vFade * vFade));
      }
    `,
  });
  const meshes = WINDOWS.map((window) => {
    const mesh = new Mesh(createShaftGeometry(window, direction), material);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    return mesh;
  });
  return { meshes, material };
};

// Dust in the window light. All motion is in the vertex shader.
const createDust = (count, direction, shared) => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const window = WINDOWS[index % WINDOWS.length];
    const north = window.wall === "north";
    const a = window.span[0] + Math.random() * (window.span[1] - window.span[0]);
    const y = window.rise[0] + Math.random() * (window.rise[1] - window.rise[0]);
    const start = north ? new Vector3(a, y, -9) : new Vector3(-10, y, a);
    const travel = (y / -direction.y) * Math.random();
    start.addScaledVector(direction, travel);
    positions[index * 3] = start.x;
    positions[index * 3 + 1] = start.y;
    positions[index * 3 + 2] = start.z;
    seeds[index] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: shared.uTime, uPixelRatio: shared.uPixelRatio },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * (0.05 + aSeed * 0.07) + aSeed * 40.0;
        p.x += sin(t * 1.3) * 0.12;
        p.y += sin(t) * 0.1;
        p.z += cos(t * 0.9) * 0.12;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (3.0 + aSeed * 5.0) * uPixelRatio / max(-mv.z, 0.4);
        vAlpha = (0.25 + 0.75 * aSeed) * smoothstep(14.0, 2.0, -mv.z);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float falloff = exp(-dot(d, d) * 14.0);
        gl_FragColor = vec4(1.0, 0.82, 0.62, falloff * vAlpha * 0.6);
      }
    `,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 3;
  return points;
};

export const buildArchitecture = ({ kit, materials, layout, tier, scene, shared }) => {
  const { height } = layout.studio;
  const m = materials;

  // Floor and ceiling.
  kit.slab(m.floor, [-10.4, 10.4], [-0.2, 0], [-9.4, 9.4]);
  kit.slab(m.ceiling, [-10.4, 10.4], [height, height + 0.2], [-9.4, 9.4]);

  // Exterior walls, pierced for their windows.
  ["north", "south", "west", "east"].forEach((wall) =>
    buildExteriorWall(kit, m.wall, wall, WINDOWS.filter((window) => window.wall === wall), height)
  );
  WINDOWS.forEach((window) => buildWindow(kit, m, window));

  // Interior walls straight from the floor plan (the first four are exterior).
  layout.walls.slice(4).forEach((wall) => {
    kit.slab(m.wall, wall.x, [0, height], wall.z);
  });

  // Headers over each opening, and a timber lining round it.
  layout.openings.forEach((opening) => {
    const head = opening.axis === "z" ? 2.75 : 2.45;
    const [s0, s1] = opening.span;
    if (opening.axis === "z") {
      kit.slab(m.wall, [opening.at - 0.12, opening.at + 0.12], [head, height], [s0, s1]);
      kit.slab(m.darkWood, [opening.at - 0.15, opening.at + 0.15], [head - 0.07, head], [s0, s1]);
      kit.slab(m.darkWood, [opening.at - 0.15, opening.at + 0.15], [0, head], [s0 - 0.001, s0 + 0.06]);
      kit.slab(m.darkWood, [opening.at - 0.15, opening.at + 0.15], [0, head], [s1 - 0.06, s1 + 0.001]);
    } else {
      kit.slab(m.wall, [s0, s1], [head, height], [opening.at - 0.12, opening.at + 0.12]);
      kit.slab(m.darkWood, [s0, s1], [head - 0.07, head], [opening.at - 0.15, opening.at + 0.15]);
      kit.slab(m.darkWood, [s0 - 0.001, s0 + 0.06], [0, head], [opening.at - 0.15, opening.at + 0.15]);
      kit.slab(m.darkWood, [s1 - 0.06, s1 + 0.001], [0, head], [opening.at - 0.15, opening.at + 0.15]);
    }
  });

  // Skirting along every interior wall.
  layout.walls.slice(4).forEach((wall) => {
    kit.slab(m.darkWood, [wall.x[0] - 0.014, wall.x[1] + 0.014], [0, 0.1], [wall.z[0] - 0.014, wall.z[1] + 0.014]);
  });
  kit.slab(m.darkWood, [-10, 10], [0, 0.1], [-9.014, -9]);
  kit.slab(m.darkWood, [-10, 10], [0, 0.1], [9, 9.014]);
  kit.slab(m.darkWood, [-10.014, -10], [0, 0.1], [-9, 9]);
  kit.slab(m.darkWood, [10, 10.014], [0, 0.1], [-9, 9]);

  // The Gallery is lined in a paler plaster, so paint reads against it.
  const liner = 0.016;
  kit.slab(m.wallGallery, [3.62, 10], [0.1, height], [-9, -9 + liner]);
  kit.slab(m.wallGallery, [10 - liner, 10], [0.1, height], [-9, -0.12]);
  kit.slab(m.wallGallery, [3.62, 6.8], [0.1, height], [-0.12 - liner, -0.12]);
  kit.slab(m.wallGallery, [8.4, 10], [0.1, height], [-0.12 - liner, -0.12]);
  kit.slab(m.wallGallery, [6.8, 8.4], [2.45, height], [-0.12 - liner, -0.12]);
  kit.slab(m.wallGallery, [3.62, 3.62 + liner], [0.1, height], [-9, -3.6]);
  kit.slab(m.wallGallery, [3.62, 3.62 + liner], [0.1, height], [-1, -0.12]);
  kit.slab(m.wallGallery, [3.62, 3.62 + liner], [2.75, height], [-3.6, -1]);

  // Ceiling beams across the whole width, and two along the nave.
  [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].forEach((z) => {
    kit.slab(m.darkWood, [-10, 10], [height - 0.26, height], [z - 0.1, z + 0.1]);
  });
  [-3.5, 3.5].forEach((x) => {
    kit.slab(m.darkWood, [x - 0.13, x + 0.13], [height - 0.34, height], [-9, 9]);
  });

  // Outside: a drum of sky a few minutes after sunset, and a lake under it
  // that comes right up to the walls.
  const skyMaterial = new MeshBasicMaterial({
    map: createSkyTexture(tier.textureSize),
    side: BackSide,
    fog: false,
    toneMapped: false,
  });
  skyMaterial.userData = { source: new Color(1, 1, 1), gain: 0.04 };
  const sky = new Mesh(
    new CylinderGeometry(SKY.radius, SKY.radius, SKY.top - SKY.bottom, 64, 1, true),
    skyMaterial
  );
  sky.position.y = (SKY.top + SKY.bottom) / 2;
  sky.userData.noOcclusion = true;
  scene.add(sky);

  const waterMaterial = new MeshBasicMaterial({
    map: createWaterTexture(tier.textureSize),
    fog: false,
    toneMapped: false,
  });
  waterMaterial.userData = { source: new Color(1, 1, 1), gain: 0.04 };
  const water = new Mesh(new CircleGeometry(SKY.radius, 72), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.9;
  water.userData.noOcclusion = true;
  scene.add(water);

  const direction = SUN_TARGET.clone().sub(SUN_POSITION).normalize();
  const shafts = createShafts(direction);
  shafts.meshes.forEach((mesh) => scene.add(mesh));

  let dust = null;
  if (tier.dust > 0) {
    dust = createDust(tier.dust, direction, shared);
    scene.add(dust);
  }

  return { sky, water, shafts, dust, sources: [skyMaterial, waterMaterial] };
};

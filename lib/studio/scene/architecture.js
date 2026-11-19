// The building: floor, walls with their openings, ceiling and beams, windows,
// and the sky and light that come through them. All of it is read from the
// floor plan in lib/studio/layout.js, so the walls a visitor sees are the
// walls the walker collides with.
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { createScallopTexture, createRandom } from "./textures";

import daylight from "../daylight";

const { WINDOWS, panoramaYaw, sunDirection } = daylight;
export const SUN_TARGET = new Vector3(1.5, 0, 2);
const SUN_DIRECTION = new Vector3(...sunDirection);
export const SUN_POSITION = SUN_TARGET.clone().addScaledVector(SUN_DIRECTION, 22);

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

// A steel-framed window: a slim charcoal frame, mullions about a metre
// apart, and a transom at door height on the tall ones. Glazing bars are what
// draw the grid in each pool of light on the floor.
const buildWindow = (kit, materials, window) => {
  const [a0, a1] = window.span;
  const [y0, y1] = window.rise;
  const north = window.wall === "north";
  const plane = north ? -9.2 : -10.2;
  const frame = 0.06;
  const bar = 0.038;
  const depth = 0.09;
  const at = (a, y, sizeAlong, sizeUp, thick = depth) =>
    north
      ? kit.box(materials.iron, [sizeAlong, sizeUp, thick], [a, y, plane])
      : kit.box(materials.iron, [thick, sizeUp, sizeAlong], [plane, y, a]);
  const width = a1 - a0;
  const rise = y1 - y0;
  const mid = (a0 + a1) / 2;
  // Frame.
  at(mid, y0 + frame / 2, width, frame);
  at(mid, y1 - frame / 2, width, frame);
  at(a0 + frame / 2, (y0 + y1) / 2, frame, rise);
  at(a1 - frame / 2, (y0 + y1) / 2, frame, rise);
  const columns = Math.max(1, Math.round(width / 0.95));
  for (let column = 1; column < columns; column += 1) {
    at(a0 + (width * column) / columns, (y0 + y1) / 2, bar, rise, depth * 0.8);
  }
  if (rise > 2.6) {
    at(mid, 2.55, width, bar, depth * 0.8);
    at(mid, 0.42, width, bar * 0.8, depth * 0.8);
  } else {
    at(mid, y0 + rise * 0.62, width, bar, depth * 0.8);
  }
  // A walnut window board where there is a sill; a stone threshold where the
  // glass comes down to the floor.
  if (y0 > 0.3) {
    if (north) kit.box(materials.walnut, [width + 0.12, 0.045, 0.44], [mid, y0 - 0.02, -9.17]);
    else kit.box(materials.walnut, [0.44, 0.045, width + 0.12], [-10.17, y0 - 0.02, mid]);
  } else if (north) {
    kit.box(materials.stone, [width, 0.012, 0.4], [mid, 0.006, -9.2]);
  } else {
    kit.box(materials.stone, [0.4, 0.012, width], [-10.2, 0.006, mid]);
  }
  // Glass.
  if (north) kit.plane(materials.glass, [width, rise], [mid, (y0 + y1) / 2, plane + 0.02]);
  else kit.plane(materials.glass, [width, rise], [plane + 0.02, (y0 + y1) / 2, mid], [0, Math.PI / 2, 0]);
};

// A gathered linen panel with a narrower pleated heading, a soft hem
// and a little variation down each fold. Window fittings share the iron batch.
const dressWindow = (kit, m, window, side) => {
  const [a0, a1] = window.span;
  const north = window.wall === "north";
  const top = 3.88;
  const frame = kit.at(north ? [(a0 + a1) / 2, 0, -9] : [-10, 0, (a0 + a1) / 2], north ? 0 : Math.PI / 2);
  const edge = (a1 - a0) / 2;
  frame.cylinder(m.iron, { radius: 0.012, height: 2 * edge + 0.12, segments: 12 }, [0, top, 0.17], [0, 0, Math.PI / 2]);
  for (const end of [-1, 1]) {
    frame.box(m.iron, [0.028, 0.035, 0.18], [end * (edge - 0.04), top, 0.085]);
  }

  const geometry = new PlaneGeometry(1, 1, 60, 24);
  const { position, uv } = geometry.attributes;
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const fall = 1 - v;
    const phase = u * 5.5 * Math.PI * 2 + 0.42 * fall * Math.sin(6 * u + 2 * v);
    const fold = Math.cos(phase);
    const breadth = 0.38 + 0.23 * fall + 0.03 * Math.sin(fall * Math.PI);
    const x = side * (edge - 0.015 - breadth * u);
    const y = 0.038 + v * (top - 0.073) + (0.009 * fold + 0.007 * Math.sin(u * 8)) * fall ** 5;
    const z = 0.16 + fold * (0.035 + 0.032 * fall) + 0.025 * fall * Math.sin(9 * u + fall);
    position.setXYZ(i, x, y, z);
    // The doubled hem and the recesses between pleats absorb more light.
    const shade = (0.94 + fold * 0.06) * (v < 0.046 || v > 0.97 ? 0.91 : 1);
    colors.push(shade, shade, shade);
    uv.setXY(i, u * 2.8, v * 10);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  frame.add(m.linenCurtain, geometry, [0, 0, 0]);
  for (let i = 0; i < 6; i++) {
    frame.torus(m.brassDull, { radius: 0.023, tube: 0.0035, segments: 12, tubeSegments: 4 },
      [side * (edge - 0.015 - 0.38 * i / 5.5), top, 0.17], [0, Math.PI / 2, 0]);
  }
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
      uStrength: { value: 0.013 },
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
  const random = createRandom(149);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const window = WINDOWS[index % WINDOWS.length];
    const north = window.wall === "north";
    const a = window.span[0] + random() * (window.span[1] - window.span[0]);
    const y = window.rise[0] + random() * (window.rise[1] - window.rise[0]);
    const start = north ? new Vector3(a, y, -9) : new Vector3(-10, y, a);
    const travel = (y / -direction.y) * random();
    start.addScaledVector(direction, travel);
    positions[index * 3] = start.x;
    positions[index * 3 + 1] = start.y;
    positions[index * 3 + 2] = start.z;
    seeds[index] = random();
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
        vAlpha = (0.25 + 0.75 * aSeed) * (1.0 - smoothstep(2.0, 14.0, -mv.z));
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

// Recessed downlights: where each sits in the ceiling. `wash` points one at a
// wall, which then carries its scallop.
const DOWNLIGHTS = [
  // The archive bay: wall-washers down both plaster walls.
  { at: [-3.02, -8.1], wash: { x: -3.38, facing: Math.PI / 2 } },
  { at: [-3.02, -5.9], wash: { x: -3.38, facing: Math.PI / 2 } },
  { at: [3.02, -8.1], wash: { x: 3.38, facing: -Math.PI / 2 } },
  { at: [3.02, -5.9], wash: { x: 3.38, facing: -Math.PI / 2 } },
  // The Hall.
  { at: [-1.7, -3.0] },
  { at: [1.7, -3.0] },
  { at: [-1.7, 2.9] },
  { at: [1.7, 2.9] },
  // The Library, over its wall of books.
  { at: [-7.2, -8.15] },
  { at: [-4.75, -8.15] },
  { at: [-8.9, -2.6] },
  // The Workbench.
  { at: [-7.6, 2.4] },
  { at: [-5.2, 6.2] },
  // The Simulation Room, kept low.
  { at: [4.6, 7.9] },
  { at: [8.2, 7.9] },
  // The Recording Studio, washing its side walls.
  { at: [-3.02, 5.0], wash: { x: -3.38, facing: Math.PI / 2 } },
  { at: [3.02, 5.0], wash: { x: 3.38, facing: -Math.PI / 2 } },
  { at: [-1.6, 8.3] },
  { at: [1.6, 8.3] },
];

// Wainscot: walnut panelling to dado height. `along` is the axis the run
// follows, `at` the face it sits on, `toward` which way the room is.
const LIBRARY_WAINSCOT = [
  { along: "z", at: -10, toward: 1, span: [-9, -6.55] },
  { along: "z", at: -10, toward: 1, span: [-5.05, -3.45] },
  { along: "z", at: -10, toward: 1, span: [-1.7, -0.12] },
  { along: "x", at: -0.12, toward: -1, span: [-10, -8.4] },
  { along: "x", at: -0.12, toward: -1, span: [-6.8, -3.62] },
];

const buildWainscot = (kit, m, runs) => {
  const top = 1.02;
  runs.forEach(({ along, at, toward, span: [s0, s1] }) => {
    const face = (offset, thick, y0, y1, a0, a1, material) => {
      const c0 = at + toward * offset;
      const c1 = at + toward * (offset + thick);
      if (along === "z") kit.slab(material, [Math.min(c0, c1), Math.max(c0, c1)], [y0, y1], [a0, a1]);
      else kit.slab(material, [a0, a1], [y0, y1], [Math.min(c0, c1), Math.max(c0, c1)]);
    };
    face(0, 0.018, 0.1, top, s0, s1, m.walnut);
    // Raised panels between stiles, each a shade proud of the board.
    const panels = Math.max(1, Math.round((s1 - s0) / 0.62));
    const pitch = (s1 - s0) / panels;
    for (let index = 0; index < panels; index += 1) {
      const a0 = s0 + index * pitch + 0.07;
      const a1 = s0 + (index + 1) * pitch - 0.07;
      if (a1 - a0 > 0.1) face(0.018, 0.012, 0.24, top - 0.12, a0, a1, m.darkWood);
    }
    // The dado rail.
    face(0, 0.045, top - 0.01, top + 0.035, s0, s1, m.walnut);
  });
};

export const buildArchitecture = ({ kit, materials, layout, tier, scene, shared, surfaces }) => {
  const { height } = layout.studio;
  const m = materials;

  // Floor and ceiling.
  kit.slab(m.floor, [-10.4, 10.4], [-0.2, 0], [-9.4, 9.4]);
  kit.slab(m.ceiling, [-10.4, 10.4], [height, height + 0.2], [-9.4, 9.4]);

  // Exterior walls, pierced for their windows.
  ["north", "south", "west", "east"].forEach((wall) =>
    buildExteriorWall(kit, m.wall, wall, WINDOWS.filter((window) => window.wall === wall), height)
  );
  WINDOWS.forEach((window) => {
    buildWindow(kit, m, window);
    if (window.rise[0] === 0) {
      const side = window.wall === "north" ? Math.sign(window.span[0]) : (window.span[0] < -5 ? 1 : -1);
      dressWindow(kit, m, window, side);
    }
  });

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

  // The Simulation Room is lined in charcoal plaster, so its screens and
  // dioramas hold the eye and its light stays low.
  kit.slab(m.wallCharcoal, [3.62, 6.8], [0.1, height], [0.12, 0.12 + liner]);
  kit.slab(m.wallCharcoal, [8.4, 10], [0.1, height], [0.12, 0.12 + liner]);
  kit.slab(m.wallCharcoal, [6.8, 8.4], [2.45, height], [0.12, 0.12 + liner]);
  kit.slab(m.wallCharcoal, [10 - liner, 10], [0.1, height], [0.12, 9]);
  kit.slab(m.wallCharcoal, [3.62, 10], [0.1, height], [9 - liner, 9]);
  kit.slab(m.wallCharcoal, [3.62, 3.62 + liner], [0.1, height], [0.12, 1]);
  kit.slab(m.wallCharcoal, [3.62, 3.62 + liner], [0.1, height], [3.6, 9]);
  kit.slab(m.wallCharcoal, [3.62, 3.62 + liner], [2.75, height], [1, 3.6]);

  // The Library is panelled in walnut to the dado.
  buildWainscot(kit, m, LIBRARY_WAINSCOT);

  // Ceiling beams across the whole width, and two along the nave.
  [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].forEach((z) => {
    kit.slab(m.darkWood, [-10, 10], [height - 0.26, height], [z - 0.1, z + 0.1]);
  });
  [-3.5, 3.5].forEach((x) => {
    kit.slab(m.darkWood, [x - 0.13, x + 0.13], [height - 0.34, height], [-9, 9]);
  });

  // Recessed downlights: a lit lens in a slim trim, and where one is set
  // close to a wall, the scallop it throws down the plaster.
  const scallopTexture = createScallopTexture();
  const scallopMaterial = new MeshBasicMaterial({
    map: scallopTexture,
    color: new Color(1, 0.74, 0.5).multiplyScalar(0.26),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  DOWNLIGHTS.forEach(({ at: [x, z], wash }) => {
    kit.cylinder(m.iron, { radius: 0.062, height: 0.012, segments: 16 }, [x, height - 0.004, z]);
    kit.cylinder(m.downlight, { radius: 0.042, height: 0.006, segments: 14 }, [x, height - 0.012, z]);
    if (!wash) return;
    const scallop = new Mesh(new PlaneGeometry(0.95, 2.6), scallopMaterial);
    scallop.position.set(wash.x + Math.sin(wash.facing) * 0.006, height - 1.3 - 0.04, z);
    scallop.rotation.y = wash.facing;
    scallop.renderOrder = 1;
    scallop.userData.noOcclusion = true;
    scene.add(scallop);
  });

  // Outside the north glass, a stone terrace on a plinth that rises out of
  // the lake, and a slim steel rail at its edge.
  kit.slab(m.terrace, [-10.4, 4.6], [-0.9, -0.03], [-12.6, -9.4]);
  kit.slab(m.terrace, [-12.8, -10.4], [-0.9, -0.03], [-12.6, -0.4]);
  kit.slab(m.iron, [-12.75, 4.55], [0.98, 1.02], [-12.55, -12.5]);
  kit.slab(m.iron, [-12.75, -12.7], [0.98, 1.02], [-12.55, -0.45]);
  for (let x = -12.6; x <= 4.6; x += 1.2) kit.slab(m.iron, [x - 0.015, x + 0.015], [-0.03, 1], [-12.545, -12.515]);
  for (let z = -11.4; z <= -0.4; z += 1.2) kit.slab(m.iron, [-12.745, -12.715], [-0.03, 1], [z - 0.015, z + 0.015]);

  // The terrace has parallax. The distant shore stays at infinity for both
  // the visitor and each face of the indoor reflection probe.
  const skyMaterial = new MeshBasicMaterial({
    map: surfaces.color("lakes-dusk", "#b7c9cc", false),
    fog: false, depthWrite: false,
  });
  const sky = new Mesh(new SphereGeometry(100, 64, 32).scale(-1, 1, 1), skyMaterial);
  sky.rotation.y = panoramaYaw;
  sky.frustumCulled = false;
  sky.userData.noOcclusion = true;
  sky.onBeforeRender = (_renderer, _scene, camera) => {
    sky.position.setFromMatrixPosition(camera.matrixWorld);
    sky.updateMatrixWorld();
  };
  scene.add(sky);

  const direction = SUN_TARGET.clone().sub(SUN_POSITION).normalize();
  const shafts = createShafts(direction);
  shafts.meshes.forEach((mesh) => scene.add(mesh));

  let dust = null;
  if (tier.dust > 0) {
    dust = createDust(tier.dust, direction, shared);
    scene.add(dust);
  }

  return { dust };
};

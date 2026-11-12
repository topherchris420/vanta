// What is in each room. Positions come from the floor plan in
// lib/studio/layout.js; what is written on things comes from the practice
// model. Static geometry goes into the shared kit and is merged; anything the
// visitor can move, play, or switch is returned as a handle for the scene to
// animate.
import {
  AdditiveBlending,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  SpotLight,
  BoxGeometry,
  CatmullRomCurve3,
  Line,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import instruments from "../instruments";
import { addChair, addFramedImage, addGlow, addLabel, addPlacard, addStool, addTable } from "./props";
import { createScreen } from "./screens";
import { createRandom, createRugTexture, drawPlacard } from "./textures";
import { part } from "./kit";

const { createKeyboard, scatterGrains } = instruments;

const FACE = { north: 0, south: Math.PI, west: Math.PI / 2, east: -Math.PI / 2 };

const workById = (ctx, id) => ctx.practice.works.find((work) => work.id === id);
const channelById = (ctx, id) => ctx.practice.channels.find((channel) => channel.id === id);

const addRug = (ctx, [x, z], [width, depth], options) => {
  const texture = createRugTexture(512, options);
  ctx.labels.push(texture);
  const rug = new Mesh(
    new PlaneGeometry(width, depth),
    new MeshStandardMaterial({ map: texture, roughness: 1 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(x, 0.006, z);
  rug.receiveShadow = true;
  ctx.scene.add(rug);
};

const accentLight = (ctx, light) => {
  ctx.accents.push(light);
  ctx.scene.add(light);
  if (light.target) ctx.scene.add(light.target);
  return light;
};

const statusLine = (work) => [work.year, ...work.status].filter(Boolean).join(" · ");

/* -------------------------------------------------------------------- hall */

function buildHall(ctx, dyn) {
  const { kit, m } = ctx;
  addRug(ctx, [0, -0.25], [3.4, 2.3]);

  // The desk: a walnut slab on blackened steel trestles.
  kit.box(m.walnut, [2.3, 0.05, 0.9], [0, 0.725, -0.33]);
  [-1, 1].forEach((side) => {
    const x = side * 0.98;
    kit.box(m.steel, [0.045, 0.7, 0.045], [x, 0.35, -0.7]);
    kit.box(m.steel, [0.045, 0.7, 0.045], [x, 0.35, 0.04]);
    kit.box(m.steel, [0.045, 0.045, 0.78], [x, 0.09, -0.33]);
    kit.box(m.steel, [0.045, 0.045, 0.78], [x, 0.68, -0.33]);
  });
  kit.box(m.walnut, [1.9, 0.3, 0.02], [0, 0.52, -0.74]);

  // The monitor. Its screen is live (see screens.js).
  kit.box(m.plastic, [1.02, 0.62, 0.035], [0, 1.27, -0.505]);
  kit.box(m.steel, [0.06, 0.42, 0.04], [0, 0.96, -0.545]);
  kit.box(m.steel, [0.34, 0.014, 0.22], [0, 0.757, -0.52]);
  const monitor = createScreen(768, 448);
  const screenMesh = new Mesh(
    new PlaneGeometry(0.96, 0.56),
    new MeshBasicMaterial({ map: monitor.texture, toneMapped: false })
  );
  screenMesh.position.set(0, 1.27, -0.486);
  ctx.scene.add(screenMesh);
  dyn.monitor = { screen: monitor, mesh: screenMesh };
  // The monitor washes the desk in its own light.
  dyn.monitorLight = accentLight(ctx, new PointLight(0x89f2c2, 0.6, 2.4, 2));
  dyn.monitorLight.position.set(0, 1.25, -0.25);

  // Keyboard, mouse, a notebook, a mug.
  kit.box(m.plastic, [0.44, 0.018, 0.14], [0, 0.759, -0.12]);
  for (let row = 0; row < 4; row += 1) {
    kit.box(m.ebony, [0.4, 0.006, 0.022], [0, 0.771, -0.17 + row * 0.03]);
  }
  kit.box(m.plastic, [0.06, 0.02, 0.1], [0.34, 0.76, -0.1]);
  kit.box(m.paper, [0.2, 0.008, 0.27], [-0.68, 0.754, -0.2], [0, 0.12, 0.03]);
  kit.box(m.paper, [0.2, 0.008, 0.27], [-0.47, 0.754, -0.22], [0, 0.12, -0.03]);
  kit.cylinder(m.brassDull, { radius: 0.004, height: 0.16, segments: 6 }, [-0.57, 0.762, -0.08], [0, 0.4, Math.PI / 2]);
  kit.cylinder(m.ivory, { radius: 0.042, height: 0.095 }, [-0.96, 0.8, -0.52]);
  kit.torus(m.ivory, { radius: 0.028, tube: 0.007, segments: 16, tubeSegments: 6 }, [-0.915, 0.8, -0.52], [0, 0, 0]);

  // A brass desk lamp, angled over the keyboard.
  kit.cylinder(m.brass, { radius: 0.08, height: 0.018 }, [0.92, 0.759, -0.62]);
  kit.cylinder(m.brass, { radius: 0.009, height: 0.42, segments: 8 }, [0.92, 0.97, -0.6], [0.25, 0, 0]);
  kit.cylinder(m.brass, { radius: 0.009, height: 0.36, segments: 8 }, [0.86, 1.25, -0.45], [-0.9, 0.4, 0.4]);
  kit.cylinder(m.brass, { radius: 0.03, radiusTop: 0.075, height: 0.12, segments: 20, open: true }, [0.76, 1.31, -0.33], [Math.PI - 0.5, 0, 0.3]);
  dyn.deskLight = accentLight(ctx, new PointLight(0xffc98a, 1.6, 3.2, 2));
  dyn.deskLight.position.set(0.74, 1.24, -0.3);
  addGlow(ctx, [0.75, 1.28, -0.31], { color: 0xffc98a, size: 0.32, opacity: 0.5 });

  addChair(ctx, [0.92, 0.8], -0.55);

  // The chimes: five tubes, one per room, cut to the lengths their notes ask
  // for. A tube's pitch goes as one over its length squared, so length goes as
  // one over the square root of frequency.
  const bar = { x: -3.12, y: 2.62 };
  kit.cylinder(m.brass, { radius: 0.016, height: 1.3, segments: 12 }, [bar.x, bar.y, 0], [Math.PI / 2, 0, 0]);
  [-0.64, 0.64].forEach((z) => {
    kit.box(m.steel, [0.28, 0.03, 0.03], [-3.25, bar.y, z]);
    kit.box(m.steel, [0.02, 0.18, 0.08], [-3.37, bar.y, z]);
  });
  const voiced = [...ctx.practice.channels].sort((a, b) => a.frequency - b.frequency);
  dyn.chimes = voiced.map((channel, index) => {
    const length = 18.2 / Math.sqrt(channel.frequency);
    const group = new Group();
    group.position.set(bar.x, bar.y, -0.48 + index * 0.24);
    const string = part(new CylinderGeometry(0.002, 0.002, 0.07, 4), ctx.m.rubber, [0, -0.035, 0], { shadow: false });
    const tube = part(new CylinderGeometry(0.021, 0.021, length, 18, 1, true), ctx.m.aluminium, [0, -0.07 - length / 2, 0]);
    const cap = part(new CylinderGeometry(0.022, 0.022, 0.012, 18), ctx.m.brass, [0, -0.07, 0]);
    group.add(string, tube, cap);
    addLabel(ctx, {
      parent: group,
      size: [0.07, 0.04],
      position: [0.024, -0.07 - length + 0.06, 0],
      rotation: [0, Math.PI / 2, 0],
      width: 128,
      draw: (context, { width, height, fonts }) => {
        context.fillStyle = "#b89250";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#050806";
        context.font = `700 ${Math.round(height * 0.6)}px ${fonts.mono}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(channel.note, width / 2, height / 2);
      },
    });
    ctx.scene.add(group);
    return { group, channel: channel.id, note: channel.note, frequency: channel.frequency, swing: 0, velocity: 0 };
  });
  addPlacard(ctx, {
    size: [0.46, 0.24],
    position: [-3.365, 1.2, 0],
    rotation: [0, FACE.west, 0],
    width: 460,
    content: {
      eyebrow: "The chord",
      title: voiced.map((channel) => channel.note).join(" · "),
      lines: ["One chime for each room. Sound them together."],
      ground: "#151d1a",
      ink: "#f2fbf7",
      accent: "#e7b85e",
    },
  });

  // The Now board: one card, chosen by hand.
  const { now } = ctx.practice;
  const nowWork = workById(ctx, now.work);
  kit.box(m.card, [0.03, 0.8, 1.1], [3.365, 1.52, 0]);
  kit.box(m.darkWood, [0.04, 0.84, 0.03], [3.36, 1.52, -0.565]);
  kit.box(m.darkWood, [0.04, 0.84, 0.03], [3.36, 1.52, 0.565]);
  addPlacard(ctx, {
    size: [0.5, 0.36],
    position: [3.345, 1.6, 0.18],
    rotation: [0, FACE.east, 0.02],
    width: 500,
    content: { eyebrow: `Now · as of ${now.asOf}`, title: nowWork.title, lines: [now.text] },
  });
  const circle = channelById(ctx, "instruments").artifact;
  const photo = new Mesh(
    new PlaneGeometry(0.3, 0.3 * (circle.height / circle.width)),
    new MeshStandardMaterial({ map: ctx.loadImage(circle.src), roughness: 0.7 })
  );
  photo.position.set(3.345, 1.38, -0.3);
  photo.rotation.set(0, FACE.east, -0.04, "YXZ");
  ctx.scene.add(photo);
  [[3.34, 1.76, 0.18], [3.34, 1.47, -0.3]].forEach((position) =>
    kit.sphere(m.amber, { radius: 0.009, segments: 8 }, position)
  );

  // A plant, because someone lives here.
  kit.cylinder(m.stone, { radius: 0.17, radiusTop: 0.2, height: 0.42 }, [2.9, 0.21, 3.7]);
  const random = createRandom(77);
  for (let leaf = 0; leaf < 14; leaf += 1) {
    const angle = random() * Math.PI * 2;
    const tilt = 0.3 + random() * 0.6;
    const length = 0.5 + random() * 0.45;
    kit.box(ctx.leaf, [0.07, length, 0.01], [
      2.9 + Math.cos(angle) * Math.sin(tilt) * length * 0.45,
      0.42 + Math.cos(tilt) * length * 0.48,
      3.7 + Math.sin(angle) * Math.sin(tilt) * length * 0.45,
    ], [Math.sin(angle) * tilt, angle, Math.cos(angle) * -tilt]);
  }
}

/* ------------------------------------------------------------------ archive */

function buildArchiveInstallation(ctx, dyn) {
  const { kit, m } = ctx;
  const cx = 0;
  const cz = -6.4;
  kit.cylinder(m.stone, { radius: 1.45, height: 0.32, segments: 72 }, [cx, 0.16, cz]);
  kit.cylinder(m.steel, { radius: 1.2, height: 0.04, segments: 72 }, [cx, 0.34, cz]);
  kit.torus(m.brass, { radius: 1.45, tube: 0.014, segments: 96 }, [cx, 0.322, cz], [Math.PI / 2, 0, 0]);
  kit.torus(m.brass, { radius: 1.32, tube: 0.02, segments: 96 }, [cx, 2.9, cz], [Math.PI / 2, 0, 0]);
  kit.torus(m.steel, { radius: 1.32, tube: 0.03, segments: 96 }, [cx, 0.36, cz], [Math.PI / 2, 0, 0]);

  // Four posts carry the optics: a brass-ringed lens on each, aimed at the
  // throat, like the collimators round a sample.
  for (let index = 0; index < 4; index += 1) {
    const angle = Math.PI / 4 + (index * Math.PI) / 2;
    const px = cx + Math.cos(angle) * 1.32;
    const pz = cz + Math.sin(angle) * 1.32;
    kit.cylinder(m.steel, { radius: 0.024, height: 2.56, segments: 10 }, [px, 1.62, pz]);
    const lx = cx + Math.cos(angle) * 1.2;
    const lz = cz + Math.sin(angle) * 1.2;
    const facing = Math.atan2(cx - lx, cz - lz);
    kit.torus(m.brass, { radius: 0.085, tube: 0.014, segments: 32, tubeSegments: 8 }, [lx, 1.62, lz], [0, facing, 0]);
    kit.cylinder(m.glass, { radius: 0.08, height: 0.012, segments: 24 }, [lx, 1.62, lz], [Math.PI / 2, facing, 0]);
    kit.box(m.steel, [0.12, 0.03, 0.03], [(px + lx) / 2, 1.62, (pz + lz) / 2], [0, facing + Math.PI / 2, 0]);
  }

  // Two gimbal rings turn slowly round the archive.
  const rings = new Group();
  rings.position.set(cx, 1.62, cz);
  const ringA = new Mesh(new TorusGeometry(1.14, 0.011, 8, 120), m.brass);
  const ringB = new Mesh(new TorusGeometry(1.04, 0.008, 8, 120), m.brassDull);
  ringA.rotation.x = Math.PI / 2 + 0.32;
  ringB.rotation.y = Math.PI / 2;
  ringB.rotation.x = 0.4;
  [ringA, ringB].forEach((ring) => {
    ring.castShadow = true;
    rings.add(ring);
  });
  ctx.scene.add(rings);
  dyn.archiveRings = { group: rings, ringA, ringB };

  // A glass hood over the whole instrument.
  const hood = new Mesh(new CylinderGeometry(1.33, 1.33, 2.54, 72, 1, true), m.glass);
  hood.position.set(cx, 1.63, cz);
  hood.renderOrder = 10;
  ctx.scene.add(hood);

  // The read-out on its own small stand at the front.
  kit.box(m.steel, [0.05, 0.86, 0.05], [0.95, 0.43, -5.12]);
  kit.box(m.steel, [0.42, 0.03, 0.3], [0.95, 0.875, -5.12], [-0.5, 0, 0]);
  const works = ctx.practice.works.length;
  const records = ctx.documents.length;
  addLabel(ctx, {
    size: [0.38, 0.26],
    position: [0.95, 0.9, -5.105],
    rotation: [-0.5, 0, 0],
    width: 512,
    glow: true,
    draw: (context, info) =>
      drawPlacard(context, info, {
        eyebrow: "Event Horizon Archive",
        title: `${works} works, ${records} sources`,
        lines: ["One surface. Cross it to reach the research atlas."],
        ground: "#050806",
        ink: "#f2fbf7",
        accent: "#89f2c2",
      }),
  });

  // The archive is wired to the workstation: one cable across the floor.
  kit.tube(m.rubber, [
    [0.75, 0.33, -5.2],
    [0.7, 0.02, -4.7],
    [0.45, 0.02, -3.2],
    [0.62, 0.02, -1.6],
    [0.55, 0.02, -0.82],
    [0.4, 0.4, -0.72],
  ], { radius: 0.013, segments: 40 });

  dyn.archiveLight = accentLight(ctx, new PointLight(0x89f2c2, 2.6, 6, 2));
  dyn.archiveLight.position.set(cx, 1.4, cz + 0.4);
  dyn.archiveMount = new Group();
  dyn.archiveMount.position.set(cx, 1.66, cz);
  dyn.archiveMount.scale.setScalar(0.3);
  ctx.scene.add(dyn.archiveMount);
}

/* ------------------------------------------------------------------ library */

const shelfRow = (ctx, random, { from, to, y, gap, along, front, depthMax, spineFacing }) => {
  // `along` is "x" or "z"; `front` the coordinate of the shelf's front edge.
  let cursor = from;
  while (cursor < to - 0.03) {
    if (random() < 0.05) {
      cursor += 0.05 + random() * 0.12;
      continue;
    }
    const material = ctx.books[Math.floor(random() * ctx.books.length)];
    if (random() < 0.06) {
      // A short stack lying flat.
      const count = 2 + Math.floor(random() * 4);
      const length = 0.18 + random() * 0.08;
      let stackY = y;
      for (let index = 0; index < count; index += 1) {
        const thickness = 0.025 + random() * 0.025;
        const depth = Math.min(depthMax, 0.15 + random() * 0.07);
        const mat = ctx.books[Math.floor(random() * ctx.books.length)];
        if (along === "x") {
          ctx.kit.box(mat, [length, thickness, depth], [cursor + length / 2, stackY + thickness / 2, front - spineFacing * depth / 2]);
        } else {
          ctx.kit.box(mat, [depth, thickness, length], [front - spineFacing * depth / 2, stackY + thickness / 2, cursor + length / 2]);
        }
        stackY += thickness;
      }
      cursor += length + 0.01;
      continue;
    }
    const width = 0.02 + random() * 0.04;
    const height = Math.min(gap - 0.04, 0.19 + random() * 0.15);
    const depth = Math.min(depthMax, 0.14 + random() * 0.09);
    const lean = random() < 0.04 ? (random() - 0.5) * 0.3 : 0;
    if (along === "x") {
      ctx.kit.box(material, [width, height, depth], [cursor + width / 2, y + height / 2, front - spineFacing * (depth / 2 + 0.01)], [0, 0, lean]);
    } else {
      ctx.kit.box(material, [depth, height, width], [front - spineFacing * (depth / 2 + 0.01), y + height / 2, cursor + width / 2], [lean, 0, 0]);
    }
    cursor += width + 0.002;
  }
};

function buildLibrary(ctx, dyn) {
  const { kit, m } = ctx;
  const random = createRandom(2021);

  // The north wall of books, floor to nearly the ceiling.
  const levels = [0.12, 0.56, 1.0, 1.44, 1.88, 2.32, 2.76, 3.2];
  const north = { x0: -8.2, x1: -3.7, back: -9, front: -8.52 };
  kit.slab(m.darkWood, [north.x0, north.x1], [0, 3.55], [north.back, north.back + 0.02]);
  levels.forEach((y) => kit.slab(m.darkWood, [north.x0, north.x1], [y - 0.025, y], [north.back, north.front]));
  kit.slab(m.darkWood, [north.x0, north.x1], [3.52, 3.56], [north.back, north.front]);
  const bays = 4;
  for (let index = 0; index <= bays; index += 1) {
    const x = north.x0 + ((north.x1 - north.x0) * index) / bays;
    kit.slab(m.darkWood, [x - 0.02, x + 0.02], [0, 3.56], [north.back, north.front]);
  }
  for (let index = 0; index < bays; index += 1) {
    const x0 = north.x0 + ((north.x1 - north.x0) * index) / bays + 0.03;
    const x1 = north.x0 + ((north.x1 - north.x0) * (index + 1)) / bays - 0.03;
    levels.slice(0, -1).forEach((y, level) => {
      shelfRow(ctx, random, { from: x0, to: x1, y, gap: levels[level + 1] - y - 0.025, along: "x", front: north.front - 0.02, depthMax: 0.42, spineFacing: -1 });
    });
  }
  // A library ladder on a brass rail.
  kit.cylinder(m.brass, { radius: 0.012, height: 4.5, segments: 8 }, [-5.95, 3.0, -8.46], [0, 0, Math.PI / 2]);
  [-0.22, 0.22].forEach((dx) => kit.box(m.oak, [0.04, 3.1, 0.05], [-5.2 + dx, 1.52, -8.15], [-0.2, 0, 0]));
  for (let rung = 0; rung < 9; rung += 1) {
    const y = 0.25 + rung * 0.33;
    kit.cylinder(m.oak, { radius: 0.014, height: 0.44, segments: 8 }, [-5.2, y, -8.15 + (y - 1.52) * -0.2], [0, 0, Math.PI / 2]);
  }

  // A lower case along the partition, spines facing west.
  const eastLevels = [0.12, 0.56, 1.0, 1.44, 1.88];
  kit.slab(m.darkWood, [-3.64, -3.62], [0, 2.3], [-8.4, -3.9]);
  eastLevels.forEach((y) => kit.slab(m.darkWood, [-3.98, -3.62], [y - 0.025, y], [-8.4, -3.9]));
  kit.slab(m.darkWood, [-3.98, -3.62], [2.28, 2.32], [-8.4, -3.9]);
  [-8.4, -6.15, -3.9].forEach((z) => kit.slab(m.darkWood, [-3.98, -3.62], [0, 2.32], [z - 0.02, z + 0.02]));
  [[-8.37, -6.18], [-6.12, -3.93]].forEach(([z0, z1]) =>
    eastLevels.slice(0, -1).forEach((y, level) =>
      shelfRow(ctx, random, { from: z0, to: z1, y, gap: eastLevels[level + 1] - y - 0.025, along: "z", front: -3.98, depthMax: 0.32, spineFacing: -1 })
    )
  );

  // The reading table and what is on it.
  addRug(ctx, [-7, -4.62], [3.2, 2.2], { ground: "#141a16", line: "#c9b27a", accent: "#7a3b2e" });
  addTable(ctx, { top: m.oak, legs: m.darkWood, center: [-7, -4.625], size: [1.9, 1.15], height: 0.76, thickness: 0.05, legSize: 0.07 });
  addChair(ctx, [-8.3, -4.62], -Math.PI / 2, { wood: m.darkWood });
  addChair(ctx, [-5.7, -4.62], Math.PI / 2, { wood: m.darkWood });

  // Location Is a Dynamic Variable: three bound preprints, squared up.
  [0, 1, 2].forEach((index) =>
    kit.box(index === 1 ? m.card : m.paper, [0.22, 0.012, 0.3], [-7.55 + index * 0.006, 0.766 + index * 0.012, -4.42 + index * 0.004], [0, 0.08 - index * 0.05, 0])
  );
  addPlacard(ctx, {
    size: [0.21, 0.29],
    position: [-7.538, 0.803, -4.412],
    rotation: [-Math.PI / 2, 0.02, 0],
    width: 300,
    content: {
      eyebrow: "Preprint · Zenodo",
      title: "Location Is a Dynamic Variable",
      lines: ["Christopher Woodyard", "Not peer reviewed."],
    },
  });

  // The research notebook, open.
  kit.box(m.leather, [0.42, 0.01, 0.28], [-6.95, 0.765, -4.4]);
  addLabel(ctx, {
    size: [0.4, 0.26],
    position: [-6.95, 0.772, -4.4],
    rotation: [-Math.PI / 2, 0, 0],
    width: 640,
    draw: (context, { width, height, fonts, wrap }) => {
      context.fillStyle = "#ece6d6";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(0,0,0,0.25)";
      context.fillRect(width / 2 - 1, 0, 2, height);
      context.strokeStyle = "rgba(60,90,120,0.18)";
      for (let y = 40; y < height; y += 22) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.fillStyle = "#1c2420";
      context.font = `600 22px ${fonts.body}`;
      let y = 54;
      wrap("Does shared mathematical vocabulary cause unsupported provenance links?", width / 2 - 50).forEach((line) => {
        context.fillText(line, 24, y);
        y += 26;
      });
      context.fillStyle = "#7a2f22";
      context.font = `700 20px ${fonts.mono}`;
      context.fillText("NOT TESTED", width / 2 + 24, 60);
      context.fillStyle = "#1c2420";
      context.font = `400 17px ${fonts.body}`;
      y = 96;
      wrap("Negative control: two works sharing keywords, no cited relationship.", width / 2 - 50).forEach((line) => {
        context.fillText(line, width / 2 + 24, y);
        y += 22;
      });
    },
  });
  kit.cylinder(m.brassDull, { radius: 0.004, height: 0.15, segments: 6 }, [-6.82, 0.775, -4.28], [0, -0.6, Math.PI / 2]);

  // Resonant Intelligence, closed, its title on the cover.
  kit.box(m.ebony, [0.2, 0.035, 0.27], [-6.38, 0.777, -4.42], [0, -0.1, 0]);
  addPlacard(ctx, {
    size: [0.18, 0.25],
    position: [-6.38, 0.7955, -4.42],
    rotation: [-Math.PI / 2, -0.1, 0],
    width: 300,
    content: { eyebrow: "Manuscript", title: "Resonant Intelligence", lines: [ctx.practice.epigraph.source], ground: "#0c0f0e", ink: "#f2fbf7", accent: "#e7b85e" },
  });

  // A manila folder of preprints, fanned.
  [0, 1, 2, 3].forEach((index) =>
    kit.box(m.paper, [0.21, 0.004, 0.29], [-7 + index * 0.018, 0.764 + index * 0.004, -4.88 - index * 0.01], [0, -0.25 + index * 0.1, 0])
  );
  kit.box(m.card, [0.24, 0.006, 0.31], [-7.02, 0.762, -4.87], [0, -0.2, 0]);

  // The lectern, with Life of a Line open on it.
  const lectern = { x: -5, z: -6.91 };
  kit.box(m.darkWood, [0.5, 0.06, 0.42], [lectern.x, 0.03, lectern.z]);
  kit.box(m.darkWood, [0.1, 1.0, 0.1], [lectern.x, 0.53, lectern.z]);
  kit.box(m.darkWood, [0.58, 0.04, 0.44], [lectern.x, 1.06, lectern.z], [0.32, 0, 0]);
  kit.box(m.darkWood, [0.58, 0.04, 0.03], [lectern.x, 0.99, lectern.z + 0.21], [0.32, 0, 0]);
  const lifeOfALine = workById(ctx, "life-of-a-line");
  addLabel(ctx, {
    size: [0.46, 0.3],
    position: [lectern.x, 1.088, lectern.z - 0.005],
    rotation: [-Math.PI / 2 + 0.32, 0, 0],
    width: 720,
    draw: (context, { width, height, fonts, wrap }) => {
      context.fillStyle = "#efe9dc";
      context.fillRect(0, 0, width, height);
      const gutter = context.createLinearGradient(width / 2 - 30, 0, width / 2 + 30, 0);
      gutter.addColorStop(0, "rgba(0,0,0,0)");
      gutter.addColorStop(0.5, "rgba(0,0,0,0.28)");
      gutter.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gutter;
      context.fillRect(width / 2 - 30, 0, 60, height);
      context.fillStyle = "#151a17";
      context.textAlign = "center";
      context.font = `700 40px ${fonts.display}`;
      context.fillText(lifeOfALine.title, width / 4, height * 0.42);
      context.font = `400 20px ${fonts.body}`;
      context.fillText(`Christopher Woodyard · ${lifeOfALine.year}`, width / 4, height * 0.56);
      context.textAlign = "left";
      context.font = `400 19px ${fonts.body}`;
      let y = height * 0.3;
      wrap(lifeOfALine.body + " The poems are in the paperback, not here.", width / 2 - 90).forEach((line) => {
        context.fillText(line, width / 2 + 45, y);
        y += 27;
      });
    },
  });

  // The reading corner: an armchair and the lamp.
  kit.box(m.leather, [0.82, 0.38, 0.8], [-9.1, 0.24, -8.1], [0, 0.6, 0]);
  kit.box(m.leather, [0.82, 0.55, 0.2], [-9.32, 0.6, -8.4], [0, 0.6, 0]);
  kit.box(m.leather, [0.18, 0.28, 0.78], [-8.82, 0.52, -8.38], [0, 0.6, 0]);
  kit.box(m.leather, [0.18, 0.28, 0.78], [-9.48, 0.52, -7.9], [0, 0.6, 0]);
  const lampX = -9.4;
  const lampZ = -7.1;
  kit.cylinder(m.iron, { radius: 0.16, height: 0.025 }, [lampX, 0.012, lampZ]);
  kit.cylinder(m.brass, { radius: 0.012, height: 1.36, segments: 8 }, [lampX, 0.7, lampZ]);
  const shadeMaterial = new MeshStandardMaterial({
    color: 0xd8cdb5,
    roughness: 0.9,
    side: DoubleSide,
    emissive: new Color(0xffc98a),
    emissiveIntensity: 0,
  });
  const shade = new Mesh(new CylinderGeometry(0.15, 0.22, 0.26, 32, 1, true), shadeMaterial);
  shade.position.set(lampX, 1.46, lampZ);
  shade.castShadow = true;
  ctx.scene.add(shade);
  const lampLight = new PointLight(0xffc488, 0, 5.5, 2);
  lampLight.position.set(lampX, 1.42, lampZ);
  ctx.scene.add(lampLight);
  const lampGlow = addGlow(ctx, [lampX, 1.42, lampZ], { color: 0xffc98a, size: 0.9, opacity: 0 });
  dyn.lamp = { light: lampLight, glow: lampGlow, shade: shadeMaterial, level: 0, target: 0 };

  // The provenance board above the chair: index cards for every work that
  // keeps its receipts, joined by one thread. In the dark it is only paper.
  const provenance = ctx.practice.threads.find((thread) => thread.id === "provenance");
  const boardX = -9.985;
  kit.box(m.card, [0.02, 1.0, 1.7], [boardX, 2.08, -7.6]);
  const cards = provenance.works.map((id, index) => {
    const work = workById(ctx, id);
    const column = index % 3;
    const row = Math.floor(index / 3);
    const z = -8.15 + column * 0.55 + (row ? 0.12 : 0);
    const y = 2.36 - row * 0.5;
    addPlacard(ctx, {
      size: [0.36, 0.22],
      position: [boardX + 0.016, y, z],
      rotation: [0, FACE.west, (random() - 0.5) * 0.06],
      width: 360,
      content: { eyebrow: channelById(ctx, work.channel).title, title: work.title, lines: [work.evidence[0].label] },
    });
    kit.sphere(m.brass, { radius: 0.008, segments: 6 }, [boardX + 0.03, y + 0.09, z]);
    return [boardX + 0.032, y + 0.09, z];
  });
  const threadMaterial = new MeshBasicMaterial({ color: 0x3a2c18, toneMapped: false });
  const threadGeometry = new BufferGeometry().setFromPoints(cards.map(([x, y, z]) => new Vector3(x, y, z)));
  const thread = new Line(threadGeometry, threadMaterial);
  ctx.scene.add(thread);
  const caption = addPlacard(ctx, {
    size: [0.62, 0.15],
    position: [boardX + 0.016, 1.68, -7.6],
    rotation: [0, FACE.west, 0],
    width: 620,
    content: { eyebrow: "Provenance", title: provenance.question, lines: [], ground: "#efe9dc" },
  });
  caption.visible = false;
  dyn.provenance = { threadMaterial, caption };

  // The claim the preprints test, on the wall between the windows.
  const writing = channelById(ctx, "writing").artifact;
  kit.box(m.darkWood, [0.04, 0.84, 1.24], [-9.98, 1.72, -4.3]);
  addLabel(ctx, {
    size: [1.16, 0.76],
    position: [-9.955, 1.72, -4.3],
    rotation: [0, FACE.west, 0],
    width: 900,
    draw: (context, { width, height, fonts, wrap }) => {
      context.fillStyle = "#f2fbf7";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#050806";
      context.font = `800 64px ${fonts.display}`;
      let y = 150;
      wrap(`“${writing.text}”`, width - 140).forEach((line) => {
        context.fillText(line, 70, y);
        y += 76;
      });
      context.fillStyle = "#7a5a16";
      context.font = `600 22px ${fonts.mono}`;
      context.fillText(writing.source.toUpperCase(), 70, height - 70);
    },
  });
}

/* ---------------------------------------------------------------- workbench */

function buildWorkbench(ctx, dyn) {
  const { kit, m } = ctx;
  // The long bench under the west window.
  const benchTop = 0.88;
  kit.box(m.oak, [0.86, 0.06, 6.6], [-9.55, benchTop - 0.03, 4.5]);
  [1.3, 3.4, 5.6, 7.7].forEach((z) => {
    kit.box(m.steel, [0.05, benchTop - 0.06, 0.05], [-9.2, (benchTop - 0.06) / 2, z]);
    kit.box(m.steel, [0.05, benchTop - 0.06, 0.05], [-9.92, (benchTop - 0.06) / 2, z]);
  });
  kit.box(m.steel, [0.7, 0.03, 6.4], [-9.55, 0.24, 4.5]);
  // Drawers under one end.
  kit.box(m.darkWood, [0.7, 0.5, 1.4], [-9.58, 0.53, 6.9]);
  [0.4, 0.62].forEach((y) => kit.box(m.brass, [0.012, 0.02, 0.18], [-9.225, y, 6.9]));

  // Signal generator and oscilloscope.
  kit.box(m.plastic, [0.36, 0.2, 0.42], [-9.55, benchTop + 0.1, 1.95]);
  kit.box(m.plastic, [0.4, 0.3, 0.5], [-9.55, benchTop + 0.15, 2.62]);
  kit.box(m.aluminium, [0.012, 0.28, 0.48], [-9.348, benchTop + 0.15, 2.62]);
  const scope = createScreen(512, 352);
  const scopeMesh = new Mesh(
    new PlaneGeometry(0.3, 0.206),
    new MeshBasicMaterial({ map: scope.texture, toneMapped: false })
  );
  scopeMesh.position.set(-9.34, benchTop + 0.17, 2.58);
  scopeMesh.rotation.y = FACE.west;
  ctx.scene.add(scopeMesh);
  dyn.scope = { screen: scope, mesh: scopeMesh };
  // The generator's frequency knob turns with its setting.
  const knobGroup = new Group();
  knobGroup.position.set(-9.33, benchTop + 0.1, 1.95);
  const knobBody = part(new CylinderGeometry(0.045, 0.05, 0.03, 28), m.aluminium);
  knobBody.rotation.z = Math.PI / 2;
  knobGroup.add(knobBody);
  const pointer = part(new BoxGeometry(0.006, 0.006, 0.036), m.mint, [0.016, 0, 0.016], { shadow: false });
  knobGroup.add(pointer);
  ctx.scene.add(knobGroup);
  dyn.generatorKnob = knobGroup;
  // Probe leads from generator to scope.
  kit.tube(m.amber, [[-9.36, benchTop + 0.06, 2.06], [-9.2, benchTop + 0.02, 2.2], [-9.25, benchTop + 0.03, 2.42], [-9.35, benchTop + 0.07, 2.5]], { radius: 0.004 });
  kit.tube(m.rubber, [[-9.36, benchTop + 0.05, 2.1], [-9.1, benchTop + 0.01, 2.3], [-9.3, benchTop + 0.02, 2.55], [-9.35, benchTop + 0.06, 2.75]], { radius: 0.004 });

  // An architect's lamp clamped to the bench, lighting the instruments.
  kit.box(m.iron, [0.06, 0.05, 0.08], [-9.86, benchTop + 0.025, 3.25]);
  kit.cylinder(m.iron, { radius: 0.008, height: 0.5, segments: 8 }, [-9.78, benchTop + 0.27, 3.25], [0, 0, -0.25]);
  kit.cylinder(m.iron, { radius: 0.008, height: 0.46, segments: 8 }, [-9.55, benchTop + 0.58, 3.12], [0.35, 0, -1.1]);
  kit.cylinder(m.iron, { radius: 0.035, radiusTop: 0.085, height: 0.14, segments: 20, open: true }, [-9.32, benchTop + 0.6, 2.98], [0.6, 0, 0.9]);
  dyn.benchLight = accentLight(ctx, new PointLight(0xffd7a8, 3.2, 4.5, 2));
  dyn.benchLight.position.set(-9.3, benchTop + 0.5, 2.92);
  addGlow(ctx, [-9.3, benchTop + 0.55, 2.95], { color: 0xffd7a8, size: 0.28, opacity: 0.45 });

  // Shelves over the bench: parts drawers, boxes, a spool of wire.
  [[1.3, 3.1, 1.78], [5.9, 7.8, 2.36]].forEach(([z0, z1, y]) => {
    kit.box(m.oak, [0.32, 0.03, z1 - z0], [-9.84, y, (z0 + z1) / 2]);
    [z0 + 0.1, z1 - 0.1].forEach((z) => kit.box(m.iron, [0.25, 0.02, 0.02], [-9.87, y - 0.04, z], [0, 0, 0.6]));
  });
  for (let index = 0; index < 4; index += 1) {
    const z = 1.45 + index * 0.4;
    kit.box(m.plastic, [0.26, 0.18, 0.32], [-9.84, 1.885, z]);
    for (let row = 0; row < 3; row += 1) kit.box(row % 2 ? m.paper : m.card, [0.005, 0.04, 0.12], [-9.708, 1.83 + row * 0.055, z]);
  }
  [[6.1, 0.24, m.card], [6.55, 0.18, m.darkWood], [7.0, 0.3, m.card], [7.5, 0.16, m.plastic]].forEach(([z, height, material]) =>
    kit.box(material, [0.26, height, 0.34], [-9.84, 2.375 + height / 2, z])
  );
  kit.cylinder(m.brass, { radius: 0.06, height: 0.07, segments: 20 }, [-9.5, benchTop + 0.035, 5.25]);
  kit.cylinder(m.darkWood, { radius: 0.066, height: 0.008, segments: 20 }, [-9.5, benchTop + 0.075, 5.25]);
  kit.box(m.amber, [0.07, 0.12, 0.025], [-9.42, benchTop + 0.06, 3.7], [0, 0.3, 0]);

  // A tuning fork on its resonator box.
  kit.box(m.oak, [0.12, 0.1, 0.26], [-9.45, benchTop + 0.05, 4.5]);
  kit.box(m.darkWood, [0.02, 0.07, 0.06], [-9.45, benchTop + 0.05, 4.5]);
  const fork = new Group();
  fork.position.set(-9.45, benchTop + 0.1, 4.5);
  fork.add(part(new CylinderGeometry(0.006, 0.006, 0.06, 10), m.aluminium, [0, 0.03, 0]));
  fork.add(part(new BoxGeometry(0.02, 0.012, 0.03), m.aluminium, [0, 0.066, 0]));
  const prongs = [-1, 1].map((side) => {
    const prong = part(new BoxGeometry(0.008, 0.16, 0.008), m.aluminium, [0, 0.15, side * 0.012]);
    fork.add(prong);
    return prong;
  });
  ctx.scene.add(fork);
  kit.cylinder(m.oak, { radius: 0.009, height: 0.18, segments: 8 }, [-9.32, benchTop + 0.012, 4.72], [Math.PI / 2, 0.4, 0]);
  kit.sphere(m.rubber, { radius: 0.02, segments: 10 }, [-9.36, benchTop + 0.015, 4.8]);
  dyn.fork = { group: fork, prongs, energy: 0 };

  // CIRCLE: its polygraph on the wall, and a board on the bench.
  const circle = channelById(ctx, "instruments").artifact;
  const circleWidth = 1.28;
  addFramedImage(ctx, {
    src: circle.src,
    size: [circleWidth, circleWidth * (circle.height / circle.width)],
    position: [-9.97, 1.72, 6.8],
    facing: FACE.west,
    frame: m.steel,
    lift: 0.3,
  });
  kit.box(ctx.pcb, [0.2, 0.012, 0.3], [-9.5, benchTop + 0.006, 6.75], [0, 0.15, 0]);
  [[-0.03, 0.05], [0.04, -0.06], [-0.05, -0.08], [0.05, 0.08]].forEach(([dx, dz], index) =>
    kit.box(index % 2 ? m.ebony : m.aluminium, [0.04, 0.012, 0.03 + index * 0.01], [-9.5 + dx, benchTop + 0.018, 6.75 + dz], [0, 0.15, 0])
  );
  kit.tube(m.rubber, [[-9.42, benchTop + 0.01, 6.6], [-9.3, benchTop + 0.01, 6.4], [-9.4, benchTop + 0.01, 6.2], [-9.36, benchTop + 0.03, 6.05]], { radius: 0.005 });
  kit.box(m.rubber, [0.06, 0.02, 0.1], [-9.36, benchTop + 0.02, 6.0]);
  addPlacard(ctx, {
    size: [0.3, 0.17],
    position: [-9.2, benchTop + 0.001, 7.2],
    rotation: [-Math.PI / 2, FACE.west, 0],
    width: 360,
    content: { eyebrow: "CIRCLE · " + statusLine(workById(ctx, "circle")), title: "Simulated. No person has been connected.", lines: [] },
  });

  // The south bench: DRR's failed benchmark, pinned up; the R.A.I.N. box.
  kit.box(m.oak, [4, 0.06, 0.8], [-6.6, benchTop - 0.03, 8.6]);
  [-8.45, -6.6, -4.75].forEach((x) => {
    kit.box(m.steel, [0.05, benchTop - 0.06, 0.05], [x, (benchTop - 0.06) / 2, 8.25]);
    kit.box(m.steel, [0.05, benchTop - 0.06, 0.05], [x, (benchTop - 0.06) / 2, 8.95]);
  });
  const drr = workById(ctx, "drr");
  addLabel(ctx, {
    size: [0.84, 0.6],
    position: [-7.6, 1.56, 8.975],
    rotation: [0, FACE.south, 0.012],
    width: 840,
    draw: (context, { width, height, fonts }) => {
      context.fillStyle = "#f4f6f2";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#1a201d";
      context.font = `700 30px ${fonts.display}`;
      context.fillText(drr.title, 40, 64);
      context.font = `500 19px ${fonts.mono}`;
      context.fillStyle = "#3a433f";
      context.fillText("docs/external-evidence.md", 40, 100);
      // A plotted lead–lag series, drawn as what it is: a diagnostic.
      context.strokeStyle = "#2e6b55";
      context.lineWidth = 2;
      context.beginPath();
      for (let x = 0; x <= width - 80; x += 4) {
        const y = 250 + Math.sin(x * 0.035) * 46 + Math.sin(x * 0.11) * 12;
        if (x === 0) context.moveTo(40 + x, y);
        else context.lineTo(40 + x, y);
      }
      context.stroke();
      context.strokeStyle = "#b07a2a";
      context.beginPath();
      for (let x = 0; x <= width - 80; x += 4) {
        const y = 270 + Math.sin(x * 0.035 - 0.9) * 40;
        if (x === 0) context.moveTo(40 + x, y);
        else context.lineTo(40 + x, y);
      }
      context.stroke();
      context.fillStyle = "#1a201d";
      context.font = `600 22px ${fonts.mono}`;
      context.fillText(drr.detail.split("→")[0].trim(), 40, height - 110);
      context.fillStyle = "#9a2f1e";
      context.font = `700 30px ${fonts.mono}`;
      context.fillText("→ " + drr.detail.split("→")[1].trim(), 40, height - 64);
    },
  });
  [[-7.95, 1.82], [-7.25, 1.82]].forEach(([x, y]) => kit.sphere(m.brass, { radius: 0.01, segments: 6 }, [x, y, 8.965]));

  kit.box(m.ebony, [0.36, 0.1, 0.3], [-5.6, benchTop + 0.05, 8.55]);
  kit.box(m.steel, [0.3, 0.004, 0.24], [-5.6, benchTop + 0.102, 8.55]);
  const led = part(new BoxGeometry(0.012, 0.012, 0.004), new MeshBasicMaterial({ color: 0xe7b85e, toneMapped: false }), [-5.48, benchTop + 0.05, 8.398], { shadow: false });
  ctx.scene.add(led);
  dyn.rainLed = led;
  addPlacard(ctx, {
    size: [0.34, 0.2],
    position: [-5.6, benchTop + 0.104, 8.55],
    rotation: [-Math.PI / 2, 0, 0],
    width: 400,
    content: { eyebrow: "R.A.I.N. Lab · local-first", title: workById(ctx, "rain").question, lines: [], ground: "#0c0f0e", ink: "#f2fbf7", accent: "#e7b85e" },
  });
  addStool(ctx, [-8.4, 3.4]);
  addStool(ctx, [-6.6, 7.7], { height: 0.66 });

  // The resonance plate on its stand, sand and all.
  const plate = { x: -6.6, z: 4.6, y: 0.96, half: 0.42 };
  kit.cylinder(m.iron, { radius: 0.3, height: 0.03 }, [plate.x, 0.015, plate.z]);
  kit.cylinder(m.steel, { radius: 0.03, height: 0.82, segments: 12 }, [plate.x, 0.44, plate.z]);
  kit.cylinder(m.iron, { radius: 0.08, height: 0.1, segments: 20 }, [plate.x, 0.88, plate.z]);
  kit.box(m.aluminium, [plate.half * 2, 0.006, plate.half * 2], [plate.x, plate.y - 0.003, plate.z]);
  kit.tube(m.rubber, [[plate.x, 0.86, plate.z + 0.05], [plate.x + 0.3, 0.5, plate.z + 0.2], [plate.x + 0.5, 0.02, plate.z + 0.25], [-9.2, 0.02, 2.2], [-9.4, 0.85, 2.0]], { radius: 0.007, segments: 48 });
  const count = ctx.tier.plateParticles;
  const grains = scatterGrains(count, createRandom(432));
  const positions = new Float32Array(count * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const grainMaterial = new PointsMaterial({ color: 0xd9c49a, size: 0.0065, sizeAttenuation: true });
  const points = new Points(geometry, grainMaterial);
  points.position.set(plate.x, plate.y + 0.002, plate.z);
  points.frustumCulled = false;
  ctx.scene.add(points);
  dyn.plate = { points, grains, positions, geometry, half: plate.half, capacity: count };

  // A pegboard of tools on the cross wall.
  kit.box(m.card, [1.6, 0.9, 0.02], [-5.2, 1.7, 0.135]);
  [[-5.7, 1.85, 0.3], [-5.35, 1.8, 0.24], [-5.0, 1.9, 0.34], [-4.65, 1.78, 0.2]].forEach(([x, y, length], index) => {
    kit.box(index % 2 ? m.steel : m.brassDull, [0.025, length, 0.02], [x, y, 0.16], [0, 0, index % 2 ? 0.1 : -0.05]);
  });
  kit.torus(m.amber, { radius: 0.09, tube: 0.006, segments: 24, tubeSegments: 6 }, [-4.9, 1.45, 0.155], [0, 0, 0]);
}

/* -------------------------------------------------------------- simulations */

function buildSimulationRoom(ctx, dyn) {
  const { kit, m } = ctx;
  const plinthTop = 0.95;
  const dioramas = [
    { id: "pine-gap", z: 2.5 },
    { id: "lop-nur", z: 4.5 },
    { id: "mannahatta", z: 6.5 },
  ];
  dioramas.forEach(({ id, z }) => {
    const work = workById(ctx, id);
    kit.box(m.paper, [0.6, plinthTop, 0.6], [6.4, plinthTop / 2, z]);
    kit.box(m.darkWood, [0.52, 0.04, 0.52], [6.4, plinthTop + 0.02, z]);
    addPlacard(ctx, {
      size: [0.4, 0.2],
      position: [6.098, 0.72, z],
      rotation: [0, FACE.east, 0],
      width: 420,
      content: { eyebrow: statusLine(work), title: work.title, lines: [] },
    });
  });
  const base = plinthTop + 0.04;

  // Pine Gap: red ground, two radomes, the road the coffee runs along.
  kit.box(ctx.ochre, [0.5, 0.03, 0.5], [6.4, base + 0.015, 2.5]);
  const dome = new IcosahedronGeometry(0.1, 2);
  kit.add(m.ivory, dome, [6.48, base + 0.11, 2.42]);
  kit.add(m.ivory, new IcosahedronGeometry(0.06, 2), [6.3, base + 0.08, 2.64]);
  kit.cylinder(m.paper, { radius: 0.06, height: 0.03 }, [6.48, base + 0.045, 2.42]);
  kit.box(m.stone, [0.5, 0.004, 0.035], [6.4, base + 0.032, 2.56], [0, 0.4, 0]);
  kit.box(ctx.olive, [0.03, 0.022, 0.02], [6.3, base + 0.045, 2.53], [0, 0.4, 0]);

  // Lop Nur: a desert airfield, the runway and a few aprons.
  kit.box(m.sand, [0.5, 0.03, 0.5], [6.4, base + 0.015, 4.5]);
  kit.box(m.stone, [0.44, 0.004, 0.05], [6.4, base + 0.032, 4.48], [0, -0.35, 0]);
  kit.box(m.stone, [0.1, 0.004, 0.025], [6.34, base + 0.032, 4.6], [0, 0.6, 0]);
  [[6.25, 4.33], [6.32, 4.33], [6.55, 4.65]].forEach(([x, z]) => kit.box(m.paper, [0.05, 0.025, 0.04], [x, base + 0.045, z]));

  // Mannahatta: one block, land cover and streets, the river edge.
  kit.box(ctx.olive, [0.5, 0.03, 0.5], [6.4, base + 0.015, 6.5]);
  kit.box(ctx.water, [0.12, 0.031, 0.5], [6.21, base + 0.016, 6.5]);
  const random = createRandom(1609);
  for (let ix = 0; ix < 4; ix += 1) {
    for (let iz = 0; iz < 5; iz += 1) {
      if (random() < 0.25) continue;
      const height = 0.02 + random() * 0.09;
      kit.box(random() < 0.5 ? m.paper : m.card, [0.05, height, 0.06], [6.33 + ix * 0.07, base + 0.03 + height / 2, 6.32 + iz * 0.085]);
    }
  }

  // The projection wall: the one real frame of Pine Gap the portfolio holds.
  const worlds = channelById(ctx, "worlds").artifact;
  const screenWidth = 4.2;
  const screenHeight = screenWidth * (worlds.height / worlds.width);
  kit.box(m.ebony, [0.04, screenHeight + 0.12, screenWidth + 0.12], [9.98, 2.02, 4.5]);
  const projection = new Mesh(
    new PlaneGeometry(screenWidth, screenHeight),
    new MeshBasicMaterial({ map: ctx.loadImage(worlds.src), toneMapped: false, color: new Color(0.82, 0.82, 0.82) })
  );
  projection.position.set(9.955, 2.02, 4.5);
  projection.rotation.y = FACE.east;
  ctx.scene.add(projection);
  addPlacard(ctx, {
    size: [1.3, 0.3],
    position: [9.975, 0.62, 4.5],
    rotation: [0, FACE.east, 0],
    width: 900,
    content: { eyebrow: "Still frame, not a live feed", title: "Pine Gap: After Hours", lines: [worlds.caption], ground: "#0c0f0e", ink: "#f2fbf7", accent: "#e7b85e" },
  });
  // The projector and the faint cone of its throw.
  kit.box(m.plastic, [0.3, 0.12, 0.34], [5.2, 3.55, 4.5]);
  kit.cylinder(m.steel, { radius: 0.012, height: 0.3, segments: 8 }, [5.2, 3.8, 4.5]);
  kit.cylinder(m.glass, { radius: 0.04, height: 0.02, segments: 20 }, [5.36, 3.55, 4.5], [0, 0, Math.PI / 2]);
  const beamGeometry = new BufferGeometry();
  const lens = [5.37, 3.55, 4.5];
  const corners = [
    [9.95, 2.02 + screenHeight / 2, 4.5 - screenWidth / 2],
    [9.95, 2.02 + screenHeight / 2, 4.5 + screenWidth / 2],
    [9.95, 2.02 - screenHeight / 2, 4.5 + screenWidth / 2],
    [9.95, 2.02 - screenHeight / 2, 4.5 - screenWidth / 2],
  ];
  const beam = [];
  const fade = [];
  for (let index = 0; index < 4; index += 1) {
    const a = corners[index];
    const b = corners[(index + 1) % 4];
    beam.push(...lens, ...a, ...b);
    fade.push(1, 0, 0);
  }
  beamGeometry.setAttribute("position", new Float32BufferAttribute(beam, 3));
  beamGeometry.setAttribute("aFade", new Float32BufferAttribute(fade, 1));
  const beamMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    vertexShader: `attribute float aFade; varying float vFade; void main(){ vFade = aFade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vFade; void main(){ gl_FragColor = vec4(0.75, 0.85, 0.82, 0.025 + 0.06 * vFade * vFade); }`,
  });
  const beamMesh = new Mesh(beamGeometry, beamMaterial);
  beamMesh.renderOrder = 4;
  beamMesh.frustumCulled = false;
  ctx.scene.add(beamMesh);

  // The control desk: two controllers on one input path.
  kit.box(m.walnut, [2.4, 0.05, 0.8], [6.4, 0.725, 8.6]);
  kit.box(m.steel, [2.3, 0.7, 0.04], [6.4, 0.35, 8.98]);
  [5.25, 7.55].forEach((x) => kit.box(m.steel, [0.04, 0.7, 0.76], [x, 0.35, 8.6]));
  kit.box(m.plastic, [0.16, 0.05, 0.1], [6.4, 0.775, 8.78]);
  const controllers = [5.98, 6.82].map((x, index) => {
    const group = new Group();
    group.position.set(x, 0.762, 8.5);
    group.add(part(new BoxGeometry(0.17, 0.035, 0.09), m.plastic));
    [-0.06, 0.06].forEach((dx) => group.add(part(new CylinderGeometry(0.03, 0.03, 0.04, 16), m.plastic, [dx, 0, 0.03])));
    group.add(part(new CylinderGeometry(0.012, 0.012, 0.02, 12), m.rubber, [-0.035, 0.026, -0.01]));
    group.add(part(new BoxGeometry(0.012, 0.004, 0.012), index ? m.amber : m.mint, [0.04, 0.02, -0.012], { shadow: false }));
    ctx.scene.add(group);
    kit.tube(m.rubber, [[x, 0.765, 8.55], [x, 0.752, 8.66], [(x + 6.4) / 2, 0.752, 8.74], [6.4, 0.77, 8.76]], { radius: 0.004 });
    return group;
  });
  [["person", 5.98], ["agent", 6.82]].forEach(([word, x]) =>
    addLabel(ctx, {
      size: [0.14, 0.04],
      position: [x, 0.751, 8.38],
      rotation: [-Math.PI / 2, 0, 0],
      width: 256,
      draw: (context, { width, height, fonts }) => {
        context.fillStyle = "#e9efe9";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#050806";
        context.font = `600 ${Math.round(height * 0.55)}px ${fonts.mono}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(word.toUpperCase(), width / 2, height / 2);
      },
    })
  );
  dyn.controllers = { groups: controllers, lift: 0, target: 0 };
}

/* ------------------------------------------------------------------ gallery */

function buildGallery(ctx, dyn) {
  const { kit, m } = ctx;
  const art = channelById(ctx, "art").artifact;
  const hangings = [
    { object: "art-0", panel: 0, position: [6.75, 1.82, -8.968], facing: FACE.north, height: 1.5 },
    { object: "art-1", panel: 1, position: [9.968, 1.74, -6.3], facing: FACE.east, height: 1.06 },
    { object: "art-2", panel: 2, position: [9.968, 1.74, -3], facing: FACE.east, height: 1.06 },
  ];
  dyn.paintings = hangings.map((hanging) => {
    const panel = art.panels[hanging.panel];
    const width = hanging.height * (panel.width / panel.height);
    const framed = addFramedImage(ctx, {
      src: panel.src,
      size: [width, hanging.height],
      position: hanging.position,
      facing: hanging.facing,
      frame: hanging.panel === 0 ? m.ebony : m.oak,
      mat: hanging.panel !== 0,
      lift: 0.2,
    });
    // A small caption beside each, in the gallery's own words.
    const side = width / 2 + (hanging.panel !== 0 ? 0.32 : 0.26);
    const cos = Math.cos(hanging.facing);
    const sin = Math.sin(hanging.facing);
    addPlacard(ctx, {
      size: [0.26, 0.17],
      position: [
        hanging.position[0] + cos * side + sin * 0.004,
        1.32,
        hanging.position[2] - sin * side + cos * 0.004,
      ],
      rotation: [0, hanging.facing, 0],
      width: 320,
      content: { eyebrow: "Christopher Woodyard", title: panel.caption, lines: [] },
    });
    // A track spot for each painting.
    const forward = new Vector3(sin, 0, cos);
    const source = new Vector3(...hanging.position).addScaledVector(forward, 1.7).setY(3.72);
    const spot = new SpotLight(0xfff1dc, 42, 7, 0.4, 0.55, 2);
    spot.position.copy(source);
    spot.target.position.set(...hanging.position);
    accentLight(ctx, spot);
    kit.cylinder(m.iron, { radius: 0.035, radiusTop: 0.045, height: 0.14, segments: 14 }, [source.x, source.y - 0.04, source.z]);
    return { ...hanging, framed, spot };
  });
  kit.box(m.iron, [0.04, 0.03, 8.6], [8.25, 3.82, -4.5]);
  kit.box(m.iron, [3.2, 0.03, 0.04], [6.75, 3.82, -7.25]);

  // A bench to sit and look from.
  kit.box(m.leather, [1.5, 0.08, 0.5], [6.8, 0.44, -4.6]);
  [-0.65, 0.65].forEach((dx) => kit.box(m.steel, [0.05, 0.4, 0.42], [6.8 + dx, 0.2, -4.6]));

  // The exhibition card by the door.
  const exhibitions = workById(ctx, "exhibitions");
  addPlacard(ctx, {
    size: [0.8, 0.6],
    position: [5.2, 1.5, -0.142],
    rotation: [0, FACE.south, 0],
    width: 640,
    content: {
      eyebrow: "Exhibited",
      title: exhibitions.title,
      lines: [exhibitions.body, ...exhibitions.evidence.map((entry) => "→ " + entry.label)],
    },
  });

  // Cymatics, by the painting of its own still.
  const cymatics = workById(ctx, "cymatics");
  addPlacard(ctx, {
    size: [0.46, 0.4],
    position: [9.97, 1.4, -1.9],
    rotation: [0, FACE.east, 0],
    width: 480,
    content: { eyebrow: statusLine(cymatics), title: cymatics.title, lines: [cymatics.question, cymatics.body] },
  });

  // Signal Lab: a console you play by scrolling, kept as a scroll.
  const signalLab = workById(ctx, "signal-lab");
  kit.box(m.paper, [0.6, 0.98, 0.6], [4.6, 0.49, -7.6]);
  kit.cylinder(m.paper, { radius: 0.05, height: 0.42, segments: 20 }, [4.6, 1.04, -7.68], [0, 0.3, Math.PI / 2]);
  addLabel(ctx, {
    size: [0.4, 0.2],
    position: [4.6, 0.987, -7.48],
    rotation: [-Math.PI / 2 + 0.05, 0.3, 0],
    width: 480,
    draw: (context, { width, height, fonts }) => {
      context.fillStyle = "#efe9dc";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "#2e6b55";
      context.lineWidth = 3;
      context.beginPath();
      for (let x = 0; x <= width - 40; x += 3) {
        const y = height * 0.55 + Math.sin(x * 0.06) * Math.sin(x * 0.011) * height * 0.28;
        if (x === 0) context.moveTo(20 + x, y);
        else context.lineTo(20 + x, y);
      }
      context.stroke();
      context.fillStyle = "#1a201d";
      context.font = `700 26px ${fonts.display}`;
      context.fillText(signalLab.title, 20, 36);
    },
  });
  addPlacard(ctx, {
    size: [0.36, 0.2],
    position: [4.6, 0.62, -7.296],
    rotation: [0, 0, 0],
    width: 400,
    content: { eyebrow: statusLine(signalLab), title: signalLab.body, lines: [] },
  });
}

/* ---------------------------------------------------------- recording room */

function buildRecordingStudio(ctx, dyn) {
  const { kit, m } = ctx;
  addRug(ctx, [0, 7.4], [3.2, 2.4], { ground: "#0b1210", line: "#89f2c2", accent: "#e7b85e" });

  // Felt on the south wall, behind the player.
  [-2.6, -1.7, 1.7, 2.6].forEach((x) => {
    kit.box(m.darkWood, [0.78, 1.3, 0.04], [x, 1.8, 8.975]);
    kit.box(m.feltDark, [0.7, 1.22, 0.06], [x, 1.8, 8.95]);
  });

  // The synthesizer on its stand. Keys face the player, who stands south.
  const synth = { x: 0, z: 7.22, y: 0.96 };
  [-0.55, 0.55].forEach((dx) => {
    kit.box(m.steel, [0.035, 0.98, 0.035], [synth.x + dx, 0.48, synth.z - 0.12], [0.32, 0, 0]);
    kit.box(m.steel, [0.035, 0.98, 0.035], [synth.x + dx, 0.48, synth.z + 0.12], [-0.32, 0, 0]);
  });
  kit.box(m.steel, [1.2, 0.03, 0.03], [synth.x, 0.42, synth.z]);
  kit.box(m.walnut, [1.62, 0.1, 0.5], [synth.x, synth.y - 0.05, synth.z]);
  [-0.79, 0.79].forEach((dx) => kit.box(m.walnut, [0.05, 0.16, 0.52], [synth.x + dx, synth.y - 0.02, synth.z]));
  kit.box(m.walnut, [1.58, 0.07, 0.08], [synth.x, synth.y + 0.01, synth.z - 0.215], [0.3, 0, 0]);
  kit.box(m.ebony, [1.5, 0.012, 0.22], [synth.x, synth.y + 0.004, synth.z - 0.1]);
  const { keys, whiteCount } = createKeyboard(ctx.practice.channels);
  const keyWidth = 1.36 / whiteCount;
  const keyFront = synth.z + 0.235;
  const keyMeshes = new Map();
  const whiteGeometry = new BoxGeometry(keyWidth * 0.94, 0.022, 0.15);
  const blackGeometry = new BoxGeometry(keyWidth * 0.56, 0.026, 0.09);
  whiteGeometry.translate(0, 0, 0.075);
  blackGeometry.translate(0, 0, 0.045);
  keys.forEach((key) => {
    // White keys sit on whole slots; a black key's slot is half a key back,
    // so the same formula centres it on the line between two white keys.
    const x = synth.x - 0.68 + (key.slot + 0.5) * keyWidth;
    const pivot = new Group();
    pivot.position.set(x, synth.y + (key.black ? 0.026 : 0.011), keyFront - (key.black ? 0.16 : 0.15));
    const material = key.black ? m.ebony : key.channel ? ctx.keyChannel : m.ivory;
    const mesh = new Mesh(key.black ? blackGeometry : whiteGeometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pivot.add(mesh);
    ctx.scene.add(pivot);
    keyMeshes.set(key.midi, { pivot, key, press: 0, target: 0 });
  });
  dyn.keys = keyMeshes;
  // The synth panel: four knobs and a display.
  const knobs = ["shape", "attack", "release", "brightness"].map((name, index) => {
    const group = new Group();
    group.position.set(synth.x - 0.62 + index * 0.13, synth.y + 0.02, synth.z - 0.12);
    group.add(part(new CylinderGeometry(0.026, 0.03, 0.03, 24), m.aluminium));
    group.add(part(new BoxGeometry(0.005, 0.032, 0.02), m.mint, [0, 0.002, -0.014], { shadow: false }));
    ctx.scene.add(group);
    return { name, group };
  });
  dyn.synthKnobs = knobs;
  const synthDisplay = createScreen(320, 150);
  const displayMesh = new Mesh(
    new PlaneGeometry(0.24, 0.112),
    new MeshBasicMaterial({ map: synthDisplay.texture, toneMapped: false })
  );
  displayMesh.position.set(synth.x + 0.36, synth.y + 0.012, synth.z - 0.12);
  displayMesh.rotation.x = -Math.PI / 2 + 0.25;
  ctx.scene.add(displayMesh);
  dyn.synthDisplay = { screen: synthDisplay, mesh: displayMesh };
  addLabel(ctx, {
    size: [0.3, 0.05],
    position: [synth.x + 0.62, synth.y + 0.0065, synth.z - 0.12],
    rotation: [-Math.PI / 2, 0, 0],
    width: 300,
    draw: (context, { width, height, fonts }) => {
      context.fillStyle = "#0c0c0d";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#e7b85e";
      context.font = `600 ${Math.round(height * 0.5)}px ${fonts.mono}`;
      context.textBaseline = "middle";
      context.fillText("VANTA · FIVE NOTES", 8, height / 2);
    },
  });

  // Monitor speakers, cones that move with the level.
  dyn.cones = [-1.35, 1.35].map((x) => {
    kit.cylinder(m.steel, { radius: 0.12, height: 0.03 }, [x, 0.015, 6.7]);
    kit.cylinder(m.steel, { radius: 0.02, height: 0.95 }, [x, 0.49, 6.7]);
    kit.box(m.steel, [0.18, 0.02, 0.18], [x, 0.965, 6.7]);
    kit.box(m.walnut, [0.22, 0.34, 0.25], [x, 1.14, 6.7], [0, x < 0 ? 0.3 : -0.3, 0]);
    const facing = x < 0 ? 0.3 : -0.3;
    const cone = new Mesh(new CircleGeometry(0.07, 32), m.rubber);
    const tweeter = new Mesh(new CircleGeometry(0.025, 20), m.aluminium);
    const front = 0.127;
    [[1.09, 0.072], [1.25, 0.028]].forEach(([y, radius]) =>
      kit.torus(m.aluminium, { radius, tube: 0.006, segments: 28, tubeSegments: 6 }, [x + Math.sin(facing) * front, y, 6.7 + Math.cos(facing) * front], [0, facing, 0])
    );
    cone.position.set(x + Math.sin(facing) * front, 1.09, 6.7 + Math.cos(facing) * front);
    tweeter.position.set(x + Math.sin(facing) * front, 1.25, 6.7 + Math.cos(facing) * front);
    cone.rotation.y = facing;
    tweeter.rotation.y = facing;
    ctx.scene.add(cone, tweeter);
    return cone;
  });

  // The credenza and turntable, with Green Machine waiting by it.
  kit.box(m.walnut, [0.58, 0.68, 2.0], [-3.09, 0.36, 6.4]);
  [5.75, 6.4, 7.05].forEach((z) => kit.box(m.darkWood, [0.01, 0.6, 0.62], [-2.795, 0.36, z]));
  kit.box(m.darkWood, [0.44, 0.08, 0.36], [-3.08, 0.74, 6.45]);
  kit.cylinder(m.steel, { radius: 0.155, height: 0.02, segments: 48 }, [-3.08, 0.79, 6.47]);
  const recordGroup = new Group();
  recordGroup.position.set(-3.08, 0.802, 6.47);
  const vinyl = part(new CylinderGeometry(0.15, 0.15, 0.004, 64), m.vinyl);
  recordGroup.add(vinyl);
  const music = channelById(ctx, "music");
  const cover = ctx.art.panels.find((panel) => /green-machine/.test(panel.src));
  const label = new Mesh(
    new CircleGeometry(0.05, 40),
    new MeshStandardMaterial({ map: ctx.loadImage(cover.src), roughness: 0.6 })
  );
  label.rotation.x = -Math.PI / 2;
  label.position.y = 0.0025;
  recordGroup.add(label);
  ctx.scene.add(recordGroup);
  const arm = new Group();
  arm.position.set(-2.92, 0.81, 6.3);
  arm.add(part(new CylinderGeometry(0.018, 0.02, 0.03, 16), m.aluminium));
  const armRod = part(new CylinderGeometry(0.004, 0.004, 0.24, 8), m.aluminium, [0, 0.02, 0.12]);
  armRod.rotation.x = Math.PI / 2;
  arm.add(armRod);
  arm.add(part(new BoxGeometry(0.02, 0.012, 0.03), m.plastic, [0, 0.014, 0.245]));
  arm.rotation.y = 0.55;
  ctx.scene.add(arm);
  dyn.record = { group: recordGroup, arm, armTarget: 0.55, spin: 0, playing: false };
  const sleeveSize = 0.31;
  const sleeve = new Mesh(
    new PlaneGeometry(sleeveSize, sleeveSize),
    new MeshStandardMaterial({ map: ctx.loadImage(cover.src), roughness: 0.75 })
  );
  sleeve.position.set(-3.33, 0.86, 5.82);
  sleeve.rotation.set(0, FACE.west, -0.08, "YXZ");
  ctx.scene.add(sleeve);
  kit.box(m.card, [0.008, sleeveSize, sleeveSize], [-3.338, 0.86, 5.82], [0, 0, -0.08]);
  addPlacard(ctx, {
    size: [0.3, 0.16],
    position: [-3.08, 0.701, 7.15],
    rotation: [-Math.PI / 2, FACE.west, 0],
    width: 380,
    content: { eyebrow: "Indigo People", title: music.artifact.title, lines: [`${music.artifact.duration}-second excerpt`] },
  });

  // The rack: a scope that reads the synth, two meters, and a patch bay with
  // one cable hanging loose.
  kit.box(m.ebony, [0.56, 1.5, 0.56], [3.1, 0.75, 6.3]);
  kit.box(m.aluminium, [0.012, 1.42, 0.5], [2.817, 0.78, 6.3]);
  const rackScope = createScreen(384, 200);
  const rackMesh = new Mesh(
    new PlaneGeometry(0.34, 0.177),
    new MeshBasicMaterial({ map: rackScope.texture, toneMapped: false })
  );
  rackMesh.position.set(2.81, 1.3, 6.3);
  rackMesh.rotation.y = FACE.east;
  ctx.scene.add(rackMesh);
  dyn.rackScope = { screen: rackScope, mesh: rackMesh };
  dyn.vu = [6.18, 6.42].map((z) => {
    kit.box(m.paper, [0.004, 0.1, 0.16], [2.811, 1.05, z]);
    const needle = part(new BoxGeometry(0.003, 0.08, 0.004), m.ebony, [0, 0.04, 0], { shadow: false });
    const pivot = new Group();
    pivot.position.set(2.806, 1.0, z);
    pivot.add(needle);
    ctx.scene.add(pivot);
    return pivot;
  });
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      kit.cylinder(m.brass, { radius: 0.007, height: 0.012, segments: 10 }, [2.808, 0.82 - row * 0.07, 6.08 + column * 0.063], [0, 0, Math.PI / 2]);
    }
  }
  const loose = new Group();
  const plugged = new Group();
  const cableMaterial = ctx.cable;
  const tube = (points) => {
    const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
    const mesh = new Mesh(new TubeGeometry(curve, 40, 0.006, 6, false), cableMaterial);
    mesh.castShadow = true;
    return mesh;
  };
  loose.add(tube([[2.8, 0.82, 6.08], [2.7, 0.7, 6.1], [2.62, 0.4, 6.2], [2.66, 0.18, 6.38], [2.72, 0.12, 6.5]]));
  plugged.add(tube([[2.8, 0.82, 6.08], [2.68, 0.66, 6.25], [2.7, 0.62, 6.5], [2.8, 0.75, 6.52]]));
  plugged.visible = false;
  ctx.scene.add(loose, plugged);
  dyn.patch = { loose, plugged };

  // A warm lamp in the far corner, so the room is somewhere to stay.
  kit.cylinder(m.iron, { radius: 0.14, height: 0.02 }, [2.95, 0.01, 8.45]);
  kit.cylinder(m.brass, { radius: 0.01, height: 1.55, segments: 8 }, [2.95, 0.78, 8.45]);
  kit.cylinder(m.paper, { radius: 0.16, radiusTop: 0.12, height: 0.26, segments: 28, open: true }, [2.95, 1.62, 8.45]);
  dyn.studioLamp = accentLight(ctx, new PointLight(0xffc48a, 4, 6, 2));
  dyn.studioLamp.position.set(2.95, 1.58, 8.45);
  addGlow(ctx, [2.95, 1.6, 8.45], { color: 0xffc98a, size: 0.7, opacity: 0.35 });

  // A microphone, on a stand, in the corner.
  kit.cylinder(m.iron, { radius: 0.14, height: 0.02 }, [-2.3, 0.01, 8.3]);
  kit.cylinder(m.steel, { radius: 0.01, height: 1.5, segments: 8 }, [-2.3, 0.76, 8.3]);
  kit.cylinder(m.steel, { radius: 0.007, height: 0.5, segments: 8 }, [-2.18, 1.52, 8.18], [0.9, 0.8, 0]);
  kit.cylinder(m.aluminium, { radius: 0.025, height: 0.12, segments: 16 }, [-2.02, 1.66, 8.03], [0.9, 0.8, 0]);
}

/* -------------------------------------------------------------------- build */

export const buildRooms = (ctx) => {
  const dyn = {};
  const extra = (color, options = {}) => new MeshStandardMaterial({ color, roughness: 0.8, ...options });
  ctx.books = [0x5a2620, 0x23382f, 0x1e2a3a, 0x8a6a2e, 0x3b3f3c, 0xc9bfa6, 0x101211, 0x4b3a5a, 0x6f4a2a].map((color) =>
    extra(color, { roughness: 0.78 })
  );
  ctx.leaf = extra(0x2c4a2e, { side: DoubleSide });
  ctx.pcb = extra(0x0f3b2a, { roughness: 0.5 });
  ctx.ochre = extra(0x8a3f22, { roughness: 1 });
  ctx.olive = extra(0x41513a, { roughness: 1 });
  ctx.water = extra(0x22404e, { roughness: 0.3 });
  ctx.cable = extra(0xe7b85e, { roughness: 0.5 });
  ctx.keyChannel = extra(0xd8f2e4, { roughness: 0.35 });
  ctx.art = channelById(ctx, "art").artifact;

  buildHall(ctx, dyn);
  buildArchiveInstallation(ctx, dyn);
  buildLibrary(ctx, dyn);
  buildWorkbench(ctx, dyn);
  buildSimulationRoom(ctx, dyn);
  buildGallery(ctx, dyn);
  buildRecordingStudio(ctx, dyn);
  return dyn;
};

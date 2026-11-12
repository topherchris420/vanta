// Things that recur from room to room: printed labels, framed pictures,
// tables, chairs, and the pendant lamps.
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
} from "three";
import { createLabel, createRandom, createSlatWashTexture, drawPlacard } from "./textures";

// A flat printed surface. `glow` makes it a lit screen instead of paper.
export const addLabel = (ctx, { size, position, rotation = [0, 0, 0], width = 512, draw, glow = false, source = 0, parent }) => {
  const [w, h] = size;
  const texture = createLabel({
    width,
    height: Math.max(32, Math.round((width * h) / w)),
    fonts: ctx.fonts,
    draw,
  });
  ctx.labels.push(texture);
  const material = glow
    ? new MeshBasicMaterial({ map: texture, toneMapped: false })
    : new MeshStandardMaterial({ map: texture, roughness: 0.9 });
  if (glow && source) {
    material.userData = { source: material.color.clone(), gain: source };
    ctx.sources.push(material);
  }
  const mesh = new Mesh(new PlaneGeometry(w, h), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2], "YXZ");
  mesh.receiveShadow = !glow;
  (parent ?? ctx.scene).add(mesh);
  return mesh;
};

// The usual paper placard, as a mesh.
export const addPlacard = (ctx, { size, position, rotation, content, width, glow }) =>
  addLabel(ctx, {
    size,
    position,
    rotation,
    width,
    glow,
    draw: (context, info) => drawPlacard(context, info, content),
  });

// One of Christopher's own images, hung: a canvas plane inside a timber frame.
// `facing` is the wall normal as a yaw, so the picture can go on any wall.
export const addFramedImage = (ctx, { src, size, position, facing = 0, frame = ctx.m.darkWood, mat = false, lift = 0.22 }) => {
  const [w, h] = size;
  const texture = ctx.loadImage(src);
  const material = new MeshStandardMaterial({
    map: texture,
    roughness: 0.82,
    // A little self-light, so a painting is never lost to a dim room.
    emissive: new Color(0xffffff),
    emissiveMap: texture,
    emissiveIntensity: lift,
  });
  const group = new Group();
  group.position.set(position[0], position[1], position[2]);
  group.rotation.y = facing;
  const picture = new Mesh(new PlaneGeometry(w, h), material);
  picture.position.z = 0.032;
  group.add(picture);
  ctx.scene.add(group);

  // The frame is static, so it goes into the merged batch, placed by hand.
  const border = mat ? 0.1 : 0.045;
  const depth = 0.05;
  const cos = Math.cos(facing);
  const sin = Math.sin(facing);
  const place = (dx, dy, sx, sy) => {
    ctx.kit.box(frame, [sx, sy, depth], [
      position[0] + cos * dx + sin * 0.012,
      position[1] + dy,
      position[2] - sin * dx + cos * 0.012,
    ], [0, facing, 0]);
  };
  place(0, h / 2 + border / 2, w + border * 2, border);
  place(0, -h / 2 - border / 2, w + border * 2, border);
  place(-w / 2 - border / 2, 0, border, h);
  place(w / 2 + border / 2, 0, border, h);
  // Backing board.
  ctx.kit.box(ctx.m.card, [w + border * 2, h + border * 2, 0.012], [
    position[0] + sin * 0.004,
    position[1],
    position[2] + cos * 0.004,
  ], [0, facing, 0]);
  return { group, picture, material };
};

// Four legs and a top.
export const addTable = (ctx, { top, legs = ctx.m.steel, center, size, height, thickness = 0.045, legInset = 0.07, legSize = 0.05 }) => {
  const [cx, cz] = center;
  const [w, d] = size;
  ctx.kit.box(top, [w, thickness, d], [cx, height - thickness / 2, cz]);
  const lx = w / 2 - legInset;
  const lz = d / 2 - legInset;
  [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(([dx, dz]) => {
    ctx.kit.box(legs, [legSize, height - thickness, legSize], [cx + dx, (height - thickness) / 2, cz + dz]);
  });
  // A stretcher rail, so it reads as built rather than balanced.
  ctx.kit.box(legs, [w - legInset * 2, 0.03, 0.03], [cx, 0.16, cz - lz]);
  ctx.kit.box(legs, [w - legInset * 2, 0.03, 0.03], [cx, 0.16, cz + lz]);
};

export const addStool = (ctx, [x, z], { height = 0.62, seat = ctx.m.walnut } = {}) => {
  ctx.kit.cylinder(seat, { radius: 0.17, height: 0.04 }, [x, height, z]);
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2 + 0.4;
    ctx.kit.cylinder(ctx.m.steel, { radius: 0.014, height: height }, [
      x + Math.cos(angle) * 0.11,
      height / 2,
      z + Math.sin(angle) * 0.11,
    ], [Math.sin(angle) * 0.12, 0, -Math.cos(angle) * 0.12]);
  }
  ctx.kit.torus(ctx.m.steel, { radius: 0.13, tube: 0.008, segments: 24, tubeSegments: 6 }, [x, height * 0.42, z], [Math.PI / 2, 0, 0]);
};

// A simple side chair, turned by `yaw`.
export const addChair = (ctx, [x, z], yaw = 0, { wood = ctx.m.walnut, seatHeight = 0.46 } = {}) => {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const at = (dx, dz) => [x + cos * dx + sin * dz, z - sin * dx + cos * dz];
  ctx.kit.box(wood, [0.44, 0.04, 0.42], [x, seatHeight, z], [0, yaw, 0]);
  [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([dx, dz]) => {
    const [px, pz] = at(dx, dz);
    const tall = dz > 0;
    ctx.kit.box(wood, [0.035, tall ? 0.92 : seatHeight, 0.035], [px, (tall ? 0.92 : seatHeight) / 2, pz], [0, yaw, 0]);
  });
  const [bx, bz] = at(0, 0.18);
  ctx.kit.box(wood, [0.4, 0.2, 0.025], [bx, 0.78, bz], [0, yaw, 0]);
};

// A lamp's halo: an additive sprite that always faces the visitor.
export const addGlow = (ctx, position, { color = 0xffd9a0, size = 0.6, opacity = 0.6, parent } = {}) => {
  const material = new SpriteMaterial({
    map: ctx.glowTexture,
    color: new Color(color),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new Sprite(material);
  sprite.position.set(position[0], position[1], position[2]);
  sprite.scale.setScalar(size);
  sprite.renderOrder = 6;
  (parent ?? ctx.scene).add(sprite);
  return sprite;
};

// One pendant per room. Its cord is one wavelength of the room's note long,
// so the five lamps hang at five heights and the lowest note hangs lowest.
export const addPendants = (ctx) => {
  const pendants = new Map();
  ctx.layout.rooms.forEach((room) => {
    const { x, z, y, drop } = room.pendant;
    const ceiling = ctx.layout.studio.height;
    ctx.kit.cylinder(ctx.m.brassDull, { radius: 0.05, height: 0.03 }, [x, ceiling - 0.275, z]);
    ctx.kit.cylinder(ctx.m.rubber, { radius: 0.005, height: drop - 0.26, segments: 6 }, [x, y + (drop - 0.26) / 2 + 0.06, z]);
    ctx.kit.cylinder(ctx.m.brass, { radius: 0.045, radiusTop: 0.02, height: 0.09 }, [x, y + 0.085, z]);
    const material = new MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false });
    const bulb = new Mesh(new SphereGeometry(0.075, 20, 14), material);
    bulb.position.set(x, y, z);
    ctx.scene.add(bulb);
    const glow = addGlow(ctx, [x, y, z], { size: 1.1, opacity: 0.4 });
    pendants.set(room.id, { room, bulb, material, glow, level: 0.4 });
  });
  return pendants;
};

export const loadImageTexture = (loader, src, anisotropy, onLoad) => {
  const texture = loader.load(src, onLoad);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

/* ------------------------------------------------------- light and timber */

const WARM = [1, 0.55, 0.26];

// Light from a strip, falling down (or up) a plaster wall. Drawn, not
// computed: a soft additive gradient a few millimetres off the surface.
export const addWash = (ctx, { center, facing = 0, size, color = WARM, strength = 0.5, up = false }) => {
  const material = new MeshBasicMaterial({
    map: ctx.washTexture,
    color: new Color(color[0] * strength, color[1] * strength, color[2] * strength),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  const mesh = new Mesh(new PlaneGeometry(size[0], size[1]), material);
  mesh.position.set(
    center[0] + Math.sin(facing) * 0.004,
    center[1],
    center[2] + Math.cos(facing) * 0.004
  );
  mesh.rotation.set(0, facing, up ? Math.PI : 0, "YXZ");
  mesh.renderOrder = 1;
  ctx.scene.add(mesh);
  return mesh;
};

// An LED strip: a thin line of light. `along` is its length, laid across the
// wall whose normal is `facing`.
export const addLedStrip = (ctx, { center, facing = 0, length, vertical = false }) => {
  ctx.kit.box(ctx.m.led, vertical ? [0.012, length, 0.01] : [length, 0.012, 0.01], center, [0, facing, 0]);
};

// A wall of vertical walnut slats over a dark backing, with its lighting
// baked in: each wash is a strip at a height (0 floor, 1 top) throwing light
// down (-1) or up (+1) the timber. The slats keep their relief because only
// their faces carry the light; the gaps stay dark.
export const addSlatWall = (ctx, { center, facing = 0, width, height, washes = [], pitch = 0.064, slat = 0.042, depth = 0.026, glow = 0.95 }) => {
  const count = Math.max(1, Math.floor(width / pitch));
  const span = count * pitch;
  const positions = [];
  const normals = [];
  const uvs = [];
  const uv1s = [];
  const random = ctx.random;
  const quad = (corners, normal, grain) => {
    [0, 1, 2, 0, 2, 3].forEach((index) => {
      const [x, y, z] = corners[index];
      positions.push(x, y, z);
      normals.push(normal[0], normal[1], normal[2]);
      // Grain runs up the slat; each slat is cut from a different board.
      uvs.push((y + height / 2) / 1.3 + grain, x * 3 + z * 3);
      uv1s.push((x + span / 2) / span, (y + height / 2) / height);
    });
  };
  const h = height / 2;
  for (let index = 0; index < count; index += 1) {
    const x0 = -span / 2 + index * pitch + (pitch - slat) / 2;
    const x1 = x0 + slat;
    const grain = random() * 7;
    quad([[x0, -h, depth], [x1, -h, depth], [x1, h, depth], [x0, h, depth]], [0, 0, 1], grain);
    quad([[x0, -h, 0], [x0, -h, depth], [x0, h, depth], [x0, h, 0]], [-1, 0, 0], grain);
    quad([[x1, -h, depth], [x1, -h, 0], [x1, h, 0], [x1, h, depth]], [1, 0, 0], grain);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("uv1", new Float32BufferAttribute(uv1s, 2));
  const washMap = washes.length ? createSlatWashTexture(washes) : null;
  if (washMap) ctx.labels.push(washMap);
  const material = new MeshStandardMaterial({
    map: ctx.m.walnut.map,
    color: 0xd9b48f,
    roughness: 0.5,
    envMapIntensity: 0.6,
    emissive: new Color(WARM[0], WARM[1], WARM[2]),
    emissiveMap: washMap,
    emissiveIntensity: washMap ? glow : 0,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(center[0], center[1], center[2]);
  mesh.rotation.y = facing;
  mesh.receiveShadow = true;
  ctx.scene.add(mesh);

  const sin = Math.sin(facing);
  const cos = Math.cos(facing);
  ctx.kit.box(ctx.m.slatBack, [span, height, 0.006], [center[0] + sin * 0.002, center[1], center[2] + cos * 0.002], [0, facing, 0]);
  washes.forEach(({ at }) => {
    const y = center[1] - height / 2 + at * height;
    addLedStrip(ctx, {
      center: [center[0] + sin * (depth + 0.03), y, center[2] + cos * (depth + 0.03)],
      facing,
      length: span - 0.04,
    });
  });
  return { mesh, span, depth };
};

// A walnut shelf with a strip of light under it. On plaster it also paints
// the wash below; on a slat wall, the wall's own baked wash does that.
export const addShelf = (ctx, { center, facing = 0, width, depth = 0.24, wash = 0, strip = true }) => {
  const sin = Math.sin(facing);
  const cos = Math.cos(facing);
  const out = (distance) => [center[0] + sin * distance, center[1], center[2] + cos * distance];
  ctx.kit.box(ctx.m.walnut, [width, 0.034, depth], out(depth / 2), [0, facing, 0]);
  if (strip) {
    const under = out(0.05);
    under[1] -= 0.024;
    addLedStrip(ctx, { center: under, facing, length: width - 0.08 });
  }
  if (wash > 0) {
    addWash(ctx, { center: [center[0], center[1] - 0.02 - wash / 2, center[2]], facing, size: [width + 0.25, wash], strength: 0.55 });
  }
  // Where things can stand on it.
  return (along, lift = 0.017) => {
    const point = out(depth * 0.5);
    return [point[0] + cos * along, center[1] + lift, point[2] - sin * along];
  };
};

/* ---------------------------------------------------------------- plants */

// One leaf: a pointed blade along +z, folded a little along its midrib and
// drooping toward the tip.
const createLeaf = (length, width, droop) => {
  const geometry = new PlaneGeometry(1, 1, 2, 7);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index) * 2;
    const t = position.getY(index) + 0.5;
    const profile = Math.pow(Math.sin(Math.PI * Math.min(t * 0.92 + 0.04, 1)), 0.75);
    const half = (width / 2) * profile;
    const along = droop > 0.01 ? Math.sin(t * droop) / droop : t;
    const down = droop > 0.01 ? (1 - Math.cos(t * droop)) / droop : 0;
    position.setXYZ(index, x * half, -down * length + Math.abs(x) * half * 0.38, along * length);
  }
  geometry.computeVertexNormals();
  return geometry;
};

// A tall plant in a pot: a leaning stem with big leaves spiralling up it.
export const addPlant = (ctx, [x, z], { height = 1.7, leaves = 16, leaf = 0.46, pot = 0.19, seed = 5, spread = 1 } = {}) => {
  const { kit, m } = ctx;
  const random = createRandom(seed);
  const potHeight = pot * 1.7;
  kit.cylinder(m.ceramic, { radius: pot * 0.82, radiusTop: pot, height: potHeight, segments: 32 }, [x, potHeight / 2, z]);
  kit.cylinder(m.rubber, { radius: pot * 0.94, height: 0.02, segments: 32 }, [x, potHeight - 0.03, z]);
  const lean = [(random() - 0.5) * 0.25, (random() - 0.5) * 0.25];
  const stemAt = (t) => [
    x + lean[0] * t * t * height + Math.sin(t * 3.1) * 0.035,
    potHeight - 0.04 + t * (height - potHeight),
    z + lean[1] * t * t * height + Math.cos(t * 2.3) * 0.03,
  ];
  kit.tube(ctx.stem, [0, 0.25, 0.5, 0.75, 1].map(stemAt), { radius: 0.014, segments: 20, radial: 6 });
  for (let index = 0; index < leaves; index += 1) {
    const t = 0.24 + (index / leaves) * 0.76;
    const yaw = index * 2.39996 + random() * 0.4;
    const young = t > 0.8;
    const size = leaf * (0.72 + random() * 0.45) * (young ? 0.7 : 1);
    const elevation = (young ? 1.05 : 0.5 + random() * 0.35) / spread;
    const geometry = createLeaf(size, size * 0.42, 0.9 + random() * 0.7);
    kit.add(m.leaf, geometry, stemAt(t), [-elevation, yaw, (random() - 0.5) * 0.3]);
  }
};

// A small trailing plant for a shelf.
export const addTrailingPlant = (ctx, position, { seed = 9, strands = 9 } = {}) => {
  const { kit, m } = ctx;
  const random = createRandom(seed);
  const [x, y, z] = position;
  kit.cylinder(m.ceramic, { radius: 0.05, radiusTop: 0.065, height: 0.1, segments: 20 }, [x, y + 0.05, z]);
  for (let index = 0; index < strands; index += 1) {
    const yaw = random() * Math.PI * 2;
    const size = 0.1 + random() * 0.12;
    kit.add(m.leaf, createLeaf(size, size * 0.5, 2.2 + random()), [x, y + 0.1, z], [-0.5 + random() * 0.5, yaw, 0]);
  }
};

/* ---------------------------------------------------------------- lights */

// A softbox on a light stand, aimed at `aim`: the studio's key light.
// Returns where its face is, for the light that shines from it.
export const addSoftbox = (ctx, [x, z], { height = 2.05, aim, size = 0.62 }) => {
  const { kit, m } = ctx;
  for (let leg = 0; leg < 3; leg += 1) {
    const angle = (leg / 3) * Math.PI * 2 + 0.5;
    const reach = 0.42;
    kit.tube(m.steel, [
      [x, 0.62, z],
      [x + Math.cos(angle) * reach * 0.55, 0.3, z + Math.sin(angle) * reach * 0.55],
      [x + Math.cos(angle) * reach, 0.012, z + Math.sin(angle) * reach],
    ], { radius: 0.009, segments: 6, radial: 6 });
  }
  kit.cylinder(m.steel, { radius: 0.013, height: height - 0.1, segments: 10 }, [x, (height - 0.1) / 2 + 0.05, z]);
  kit.cylinder(m.steel, { radius: 0.02, height: 0.07, segments: 10 }, [x, 0.62, z]);

  const head = [x, height, z];
  const dx = aim[0] - head[0];
  const dy = aim[1] - head[1];
  const dz = aim[2] - head[2];
  const length = Math.hypot(dx, dy, dz);
  const yaw = Math.atan2(dx, dz);
  const pitch = -Math.asin(dy / length);
  const depth = 0.34;
  // The hood: a square horn, narrow at the lamp and wide at the face.
  const hood = new CylinderGeometry((size / 2) * Math.SQRT2, 0.07, depth, 4, 1, true);
  hood.rotateY(Math.PI / 4);
  hood.rotateX(Math.PI / 2);
  const hoodMaterial = ctx.hood;
  const forward = [dx / length, dy / length, dz / length];
  const centre = [head[0] + forward[0] * 0.2, head[1] + forward[1] * 0.2, head[2] + forward[2] * 0.2];
  kit.add(hoodMaterial, hood, centre, [pitch, yaw, 0]);
  const face = centre.map((value, index) => value + forward[index] * (depth / 2 + 0.004));
  const diffuser = new PlaneGeometry(size, size);
  kit.add(m.diffuser, diffuser, face, [pitch, yaw, 0]);
  // A thin white lip round the face, like the fabric edge of a real one.
  const lip = new CylinderGeometry((size / 2) * Math.SQRT2 + 0.008, (size / 2) * Math.SQRT2 + 0.008, 0.02, 4, 1, true);
  lip.rotateY(Math.PI / 4);
  lip.rotateX(Math.PI / 2);
  kit.add(m.paper, lip, face.map((value, index) => value - forward[index] * 0.012), [pitch, yaw, 0]);
  return { face, forward };
};

// A floor lamp with a glass globe.
export const addGlobeLamp = (ctx, [x, z], { height = 1.62, radius = 0.15 } = {}) => {
  const { kit, m } = ctx;
  kit.cylinder(m.brass, { radius: 0.15, height: 0.022, segments: 32 }, [x, 0.011, z]);
  kit.cylinder(m.brass, { radius: 0.011, height: height - radius, segments: 10 }, [x, (height - radius) / 2, z]);
  kit.sphere(m.bulb, { radius, segments: 32 }, [x, height, z]);
  return [x, height, z];
};

/* ----------------------------------------------------------------- chair */

// A task chair on five castors, upholstered, facing north at yaw 0.
export const addOfficeChair = (ctx, [x, z], yaw = 0) => {
  const { m } = ctx;
  const chair = ctx.kit.at([x, 0, z], yaw);
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const angle = (spoke / 5) * Math.PI * 2;
    chair.box(m.plastic, [0.045, 0.03, 0.3], [Math.sin(angle) * 0.15, 0.085, Math.cos(angle) * 0.15], [0, angle, 0]);
    chair.sphere(m.rubber, { radius: 0.03, segments: 12 }, [Math.sin(angle) * 0.29, 0.03, Math.cos(angle) * 0.29]);
  }
  chair.cylinder(m.aluminium, { radius: 0.026, height: 0.32, segments: 14 }, [0, 0.25, 0]);
  chair.box(m.plastic, [0.22, 0.045, 0.24], [0, 0.42, 0]);
  chair.box(m.fabric, [0.5, 0.1, 0.5], [0, 0.49, -0.01], null, { bevel: 0.045 });
  chair.box(m.fabric, [0.47, 0.66, 0.085], [0, 0.93, 0.27], [0.14, 0, 0], { bevel: 0.04 });
  chair.box(m.plastic, [0.07, 0.36, 0.03], [0, 0.62, 0.275], [0.14, 0, 0]);
  [-1, 1].forEach((side) => {
    chair.box(m.plastic, [0.03, 0.2, 0.045], [side * 0.285, 0.57, 0.06]);
    chair.box(m.plastic, [0.07, 0.03, 0.27], [side * 0.285, 0.685, 0.02], null, { bevel: 0.012 });
  });
};

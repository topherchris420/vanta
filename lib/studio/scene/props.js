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
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
} from "three";
import { addPot, lathe } from "./furniture";
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

// Sweep the moulding around a rectangle. Each corner is mitred, so grain
// follows the individual rails and each bevel catches the track light.
const moulding = (width, height, profile) => {
  const positions = [], uvs = [];
  const corners = [[-1,-1], [1,-1], [1,1], [-1,1]];
  const corner = (i, [offset,z]) => [corners[i][0] * (width / 2 + offset), corners[i][1] * (height / 2 + offset), z];
  for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4;
    const length = side % 2 ? height : width;
    let run = 0;
    for (let j = 1; j < profile.length; j++) {
      const prev = profile[j-1], here = profile[j];
      const end = run + Math.hypot(here[0] - prev[0], here[1] - prev[1]);
      const a = corner(side, prev), b = corner(side, here), c = corner(next, here), d = corner(next, prev);
      positions.push(...a,...b,...d, ...b,...c,...d);
      uvs.push(0,run, 0,end, length,run, 0,end, length,end, length,run);
      run = end;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
};

export const addFramedImage = (ctx, { src, size: [w,h], position, facing = 0,
  frame = ctx.m.darkWood, mat = false, impasto = false, lift = 0.22 }) => {
  const map = ctx.loadImage(src);
  const finish = { map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: lift };
  const material = impasto ? new MeshPhysicalMaterial({
    ...finish, roughness: 0.73, clearcoat: 0.23, clearcoatRoughness: 0.55,
    bumpMap: ctx.surfaces.height("impasto-relief"), bumpScale: 0.0015,
  }) : new MeshStandardMaterial({ ...finish, roughness: 0.88 });
  const mount = ctx.kit.at(position, facing);
  const reveal = mat ? 0.095 : 0.015;
  const innerW = w + 2 * reveal, innerH = h + 2 * reveal;
  const faceZ = mat ? 0.023 : 0.043;
  mount.box(mat ? ctx.m.paper : ctx.m.iron, [innerW + 0.012, innerH + 0.012, 0.015], [0,0,0.012]);
  if (mat) {
    mount.add(ctx.m.paper, moulding(w, h, [[0,faceZ], [0.005,0.027], [reveal + 0.003,0.027]]), [0,0,0]);
  } else {
    mount.box(ctx.m.card, [w,h,0.028], [0,0,faceZ-0.0145], null, { bevel: 0.001 });
  }
  mount.add(frame, moulding(innerW, innerH, [[0,0.01], [0,0.045], [0.003,0.050],
    [0.020,0.050], [0.025,0.045], [0.025,0.002]]), [0,0,0]);
  const picture = new Mesh(new PlaneGeometry(w,h), material);
  picture.position.set(...mount.place([0,0,faceZ+0.0005]));
  picture.rotation.y = facing;
  picture.receiveShadow = true;
  ctx.scene.add(picture);
  return { picture, material };
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
// Each is a spun dome: charcoal outside, brass within, the lamp just showing
// under its rim.
export const addPendants = (ctx) => {
  const pendants = new Map();
  const profile = (scale) => [
    [0.022 * scale, 0.19],
    [0.05 * scale, 0.185],
    [0.11 * scale, 0.15],
    [0.16 * scale, 0.08],
    [0.185 * scale, 0.01],
    [0.19 * scale, 0],
  ];
  // The lining is the same profile turned the other way round, so its faces
  // look inward and it shows from under the lamp.
  const dome = (scale) => lathe(profile(scale).reverse(), 40);
  const lining = (scale) => lathe(profile(scale), 40);
  ctx.layout.rooms.forEach((room) => {
    const { x, z, y, drop } = room.pendant;
    const ceiling = ctx.layout.studio.height;
    const top = y + 0.2;
    ctx.kit.cylinder(ctx.m.iron, { radius: 0.05, height: 0.025, segments: 24 }, [x, ceiling - 0.0125, z]);
    ctx.kit.cylinder(ctx.m.rubber, { radius: 0.0045, height: ceiling - top, segments: 6 }, [x, top + (ceiling - top) / 2, z]);
    ctx.kit.cylinder(ctx.m.brass, { radius: 0.022, height: 0.05, segments: 16 }, [x, top - 0.005, z]);
    ctx.kit.add(ctx.m.iron, dome(1), [x, y + 0.01, z]);
    ctx.kit.add(ctx.m.brass, lining(0.97), [x, y + 0.008, z]);
    const material = new MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false });
    const bulb = new Mesh(new SphereGeometry(0.06, 20, 14), material);
    bulb.position.set(x, y + 0.06, z);
    bulb.userData.noShadow = true;
    ctx.scene.add(bulb);
    const glow = addGlow(ctx, [x, y + 0.02, z], { size: 1.1, opacity: 0.4 });
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
  const geometry = new PlaneGeometry(1, 1, 6, 12);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = -position.getX(i) * 2;
    const t = position.getY(i) + 0.5;
    const half = width * 0.5 * (0.006 + Math.max(0, Math.sin(Math.PI * t ** 0.9)) ** 0.8);
    const along = Math.sin(t * droop) / droop;
    const down = (1 - Math.cos(t * droop)) / droop;
    const edge = Math.abs(x);
    const curl = half * (edge * 0.20 + edge ** 3 * (0.20 + 0.13 * Math.sin(t * 11)));
    position.setXYZ(i, x * half + length * 0.05 * t * t, -down * length + curl, along * length);
  }
  geometry.computeVertexNormals();
  return geometry;
};

// A tall plant in a pot: a leaning stem with big leaves spiralling up it.
export const addPlant = (ctx, [x, z], { height = 1.7, leaves = 16, leaf = 0.46, pot = 0.19, seed = 5, spread = 1 } = {}) => {
  const { kit, m } = ctx;
  const random = createRandom(seed);
  const potHeight = pot * 1.7;
  const materials = [m.terracotta, m.stoneware, m.ceramic];
  addPot(ctx, [x, z], { radius: pot, height: potHeight, shape: "taper", material: materials[seed % materials.length] });
  const angle = random() * Math.PI * 2;
  const trunkAt = (t) => [
    x + Math.cos(angle) * t * t * 0.15,
    potHeight - 0.04 + t * (height - potHeight),
    z + Math.sin(angle) * t * t * 0.15,
  ];
  kit.tube(ctx.stem, [0, 0.28, 0.55, 0.8, 1].map(trunkAt), { radius: 0.013, segments: 14, radial: 7 });
  // Alternate woody side shoots along the trunk. Petioles carry the blades
  // clear of each fork and the young crown has smaller, more upright leaves.
  for (let branch = 0; branch < 6; branch++) {
    const base = trunkAt(0.19 + branch * 0.132);
    const bearing = angle + branch * 2.39996;
    const reach = (0.28 + random() * 0.12) * (1 - branch * 0.078) * spread;
    const at = (t) => [base[0] + Math.cos(bearing) * reach * t,
      base[1] + (0.13 * t + 0.14 * t * t) * (height / 1.8),
      base[2] + Math.sin(bearing) * reach * t];
    kit.tube(ctx.stem, [at(0), at(0.5), at(1)], { radius: 0.0045, segments: 6, radial: 5 });
    const count = Math.ceil(leaves / 4) + (branch < 3 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const t = 0.20 + 0.8 * i / (count - 1);
      const root = at(t);
      const yaw = Math.PI / 2 - bearing + (i % 2 ? 1 : -1) * (0.64 + random() * 0.64);
      const young = branch > 3 && t > 0.65;
      const length = leaf * (young ? 0.54 : 0.77) * (0.8 + 0.4 * random());
      const end = [root[0] + 0.038 * Math.sin(yaw), root[1] + 0.023, root[2] + 0.038 * Math.cos(yaw)];
      kit.tube(ctx.stem, [root, end], { radius: 0.0022, segments: 2, radial: 4 });
      kit.add(m.ficus, createLeaf(length, length * 0.51, 1.12 + random() * 0.8), end,
        [young ? -1.0 : -0.32 - random() * 0.45, yaw, (random() - 0.5) * 0.6]);
    }
  }
};

// A small trailing plant for a shelf.
export const addTrailingPlant = (ctx, position, { seed = 9, strands = 9 } = {}) => {
  const { kit, m } = ctx;
  const random = createRandom(seed);
  const [x, y, z] = position;
  addPot(ctx, [x, z], { radius: 0.065, height: 0.11, shape: "belly", material: seed % 2 ? m.stoneware : m.ceramic, y });
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
  // Recess the diffusion silk behind a black fabric eggcrate. Each baffle
  // has depth, so the illuminated area narrows when seen from the side.
  const frame = kit.at(face, yaw);
  const inFace = (x, y, z) => [x, y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
  const cells = 6;
  for (let i = 0; i <= cells; i++) {
    const at = size * (i / cells - 0.5);
    const thick = i === 0 || i === cells ? 0.012 : 0.002;
    frame.box(m.rubber, [thick, size, 0.058], inFace(at, 0, 0.028), [pitch, 0, 0], { bevel: 0 });
    frame.box(m.rubber, [size, thick, 0.058], inFace(0, at, 0.028), [pitch, 0, 0], { bevel: 0 });
  }
  return { face, forward };
};

// A floor lamp with a glass globe.
export const addGlobeLamp = (ctx, [x, z], { height = 1.62, radius = 0.15 } = {}) => {
  const { kit, m } = ctx;
  kit.cylinder(m.brass, { radius: 0.15, height: 0.022, segments: 32 }, [x, 0.011, z]);
  kit.cylinder(m.brass, { radius: 0.011, height: height - radius, segments: 10 }, [x, (height - radius) / 2, z]);
  kit.cylinder(m.brassDull, { radius: radius * 0.40, radiusTop: radius * 0.49, height: 0.032, segments: 24 }, [x, height - radius + 0.002, z]);
  kit.sphere(m.opal, { radius, segments: 32 }, [x, height, z]);
  return [x, height, z];
};

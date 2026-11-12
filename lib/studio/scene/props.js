// Things that recur from room to room: printed labels, framed pictures,
// tables, chairs, and the pendant lamps.
import {
  AdditiveBlending,
  Color,
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
import { createLabel, drawPlacard } from "./textures";

// A flat printed surface. `glow` makes it a lit screen instead of paper.
export const addLabel = (ctx, { size, position, rotation = [0, 0, 0], width = 512, draw, glow = false, parent }) => {
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

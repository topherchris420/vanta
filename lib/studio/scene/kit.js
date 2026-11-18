// A small kit for building rooms out of primitives. Static geometry is batched
// by material and merged into one mesh each, so a studio full of furniture
// costs a few dozen draw calls instead of a few thousand. Anything that moves
// is built as its own mesh by the caller.
import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  createDiffuserTexture,
  createFeltTexture,
  createJuteTexture,
  createWeaveTexture,
} from "./textures";

export const PALETTE = {
  ink: 0x050806,
  surface: 0x0a110e,
  paper: 0xf2fbf7,
  mint: 0x89f2c2,
  amber: 0xe7b85e,
  muted: 0x9dafaa,
};

// How much brighter than paper a light source is drawn when the picture is
// rendered in high dynamic range, so that it blooms. On the Light tier, which
// renders straight to the screen, sources are drawn at paper white.
export const HDR_GAIN = 3.2;

// The studio's materials. Physically based, and deliberately few: the same
// walnut, cream plaster, oiled oak, brass and charcoal steel recur in every
// room, which is most of what makes five rooms read as one person's place.
// `bevel` is the radius a box of that material has its edges eased by;
// nothing made by hand has a knife edge, and an eased edge is what catches
// the light.
export const createMaterials = (tier, surfaces) => {
  const size = tier.textureSize;
  const oak = surfaces.color("oak-color", "#ae825a");
  const oakNormal = surfaces.normal("oak-normal");
  const oakRoughness = surfaces.roughness("oak-rough");
  const plaster = surfaces.color("plaster-color", "#dcd6ca");
  const plasterNormal = surfaces.normal("plaster-normal");
  const walnut = surfaces.color("walnut-color", "#876346");
  const walnutFinish = {
    map: walnut,
    normalMap: surfaces.normal("walnut-normal"),
    normalScale: new Vector2(0.45, 0.45),
    roughnessMap: surfaces.roughness("walnut-rough"),
    roughness: 0.82,
  };
  const wallFinish = { map: plaster, normalMap: plasterNormal, normalScale: new Vector2(0.42, 0.42), roughness: 0.91 };
  const clothNormal = surfaces.normal("linen-normal");
  const felt = createFeltTexture(size / 2, 0x3a3f3b);
  const linen = createWeaveTexture(size / 4, 0xd8cdbb, 29);
  const olive = createWeaveTexture(size / 4, 0x66694a, 31);
  const rust = createWeaveTexture(size / 4, 0xa65f3c, 37);
  const charcoalWeave = createWeaveTexture(size / 4, 0x3f3f40, 41);
  const jute = createJuteTexture(size / 2);
  const standard = (options, userData = {}) => {
    const material = new MeshStandardMaterial(options);
    material.userData = userData;
    return material;
  };
  const light = (color, userData = {}) => {
    const material = new MeshBasicMaterial({ color: new Color(color), toneMapped: false });
    material.userData = { noShadow: true, source: new Color(color), ...userData };
    return material;
  };

  const cloth = (map) => {
    const material = new MeshPhysicalMaterial({
      map, normalMap: clothNormal, normalScale: new Vector2(0.24, 0.24),
      roughness: 0.93, sheen: 0.32, sheenColor: 0xc5b9a9, sheenRoughness: 0.9,
    });
    material.userData = { uvScale: 0.36, bevel: 0.03 };
    return material;
  };

  const materials = {
    // Oiled oak boards: satin, so the windows and the lamps lie in them.
    floor: standard(
      {
        map: oak, normalMap: oakNormal, normalScale: new Vector2(0.8, 0.8),
        roughnessMap: oakRoughness, roughness: 0.82, envMapIntensity: 0.95,
      },
      { uvScale: 1.2, uvTurn: true, floorContact: true }
    ),
    wall: standard(wallFinish, { uvScale: 2.2 }),
    wallGallery: standard({ ...wallFinish, color: 0xfffcf5 }, { uvScale: 2.2 }),
    wallCharcoal: standard({ ...wallFinish, color: 0x434746 }, { uvScale: 2.2 }),
    ceiling: standard({ ...wallFinish, color: 0xf7f5f0, roughness: 0.98 }, { uvScale: 2.2 }),
    walnut: standard(walnutFinish, { uvScale: 0.95, bevel: 0.007, grain: true }),
    oak: standard({ map: oak, normalMap: oakNormal, roughnessMap: oakRoughness, roughness: 0.92 }, { uvScale: 1.2, bevel: 0.007, grain: true }),
    darkWood: standard({ ...walnutFinish, color: 0xbf9f85 }, { uvScale: 0.95, bevel: 0.004, grain: true }),
    slatBack: standard({ color: 0x141211, roughness: 1 }),
    steel: standard({ color: 0x1a1c1d, roughness: 0.38, metalness: 0.85, envMapIntensity: 1 }, { bevel: 0.003 }),
    // Charcoal powder-coated steel: window frames, lamp hoods, track.
    iron: standard({ color: 0x2a2b2c, roughness: 0.55, metalness: 0.5 }, { bevel: 0.003 }),
    aluminium: standard({ color: 0xa9b0ad, roughness: 0.32, metalness: 0.95 }, { bevel: 0.003 }),
    brass: standard({ color: 0xc69d5a, roughness: 0.26, metalness: 1, envMapIntensity: 1.2 }, { bevel: 0.003 }),
    brassDull: standard({ color: 0x9a7a44, roughness: 0.48, metalness: 0.9 }, { bevel: 0.003 }),
    paper: standard({ color: 0xf1efe8, roughness: 0.9 }, { bevel: 0.005 }),
    card: standard({ color: 0xd8ceb8, roughness: 0.9 }, { bevel: 0.003 }),
    ceramic: standard({ color: 0xebe5da, roughness: 0.3, envMapIntensity: 0.8 }, { bevel: 0.006 }),
    stoneware: standard({ color: 0x5b5651, roughness: 0.62, envMapIntensity: 0.6 }, { bevel: 0.006 }),
    terracotta: standard({ color: 0xb06a45, roughness: 0.86 }, { bevel: 0.006 }),
    marble: standard({ color: 0xe8e3db, roughness: 0.22, envMapIntensity: 1 }, { bevel: 0.006 }),
    felt: standard({ map: felt, roughness: 1 }, { uvScale: 0.8, bevel: 0.012 }),
    feltDark: standard({ map: felt, color: 0x9a9a92, roughness: 1 }, { uvScale: 0.8, bevel: 0.012 }),
    fabric: cloth(linen),
    fabricOlive: cloth(olive),
    fabricRust: cloth(rust),
    fabricCharcoal: cloth(charcoalWeave),
    jute: standard({ map: jute, roughness: 1 }, { uvScale: 0.9, floorContact: true }),
    leather: standard({ color: 0x7a4628, roughness: 0.48, envMapIntensity: 0.7 }, { bevel: 0.035 }),
    coffee: standard({ color: 0x241409, roughness: 0.11 }),
    rubber: standard({ color: 0x0c0e0d, roughness: 0.85 }),
    plastic: standard({ color: 0x1b1d1f, roughness: 0.44, envMapIntensity: 0.7 }, { bevel: 0.006 }),
    ivory: standard({ color: 0xece7db, roughness: 0.32, envMapIntensity: 0.7 }, { bevel: 0.004 }),
    ebony: standard({ color: 0x0f0f10, roughness: 0.28, envMapIntensity: 0.8 }, { bevel: 0.004 }),
    stone: standard({ color: 0x3a3c3a, roughness: 0.78, metalness: 0.05 }, { uvScale: 2, bevel: 0.006 }),
    terrace: standard({ ...wallFinish, color: 0x8c887f }, { uvScale: 1.5 }),
    sand: standard({ color: 0xc09a68, roughness: 1 }),
    vinyl: standard({ color: 0x070808, roughness: 0.3, metalness: 0.2, envMapIntensity: 1 }),
    leaf: standard({ color: 0x3f6b3c, roughness: 0.55, side: DoubleSide, envMapIntensity: 0.6 }),
    leafDark: standard({ color: 0x2c4a2e, roughness: 0.5, side: DoubleSide, envMapIntensity: 0.6 }),
    glass: new MeshPhysicalMaterial({
      color: 0xe8f2ee,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.08,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
    // Clear glass for instrument hoods, vitrines and lenses: barely there, so
    // what is behind it keeps its contrast.
    glassClear: new MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.02,
      metalness: 0,
      transparent: true,
      opacity: 0.05,
      envMapIntensity: 0.35,
      depthWrite: false,
    }),
    mint: light(PALETTE.mint, { gain: 0.3 }),
    amber: light(PALETTE.amber, { gain: 0.3 }),
    // Light sources proper: LED strip, lamp globes, the softbox face,
    // the lenses of the recessed downlights.
    led: light(0xffc388, { gain: 1 }),
    bulb: light(0xfff0d8, { gain: 0.8 }),
    downlight: light(0xfff2df, { gain: 1 }),
    diffuser: light(0xfff4e6, { gain: 0.26 }),
    screenOff: standard({ color: 0x050908, roughness: 0.25, envMapIntensity: 1 }),
  };
  materials.linenCurtain = cloth(linen);
  materials.linenCurtain.side = DoubleSide;
  materials.linenCurtain.vertexColors = true;
  materials.diffuser.map = createDiffuserTexture();
  materials.glass.userData = { noShadow: true };
  materials.glassClear.userData = { noShadow: true };
  return materials;
};

// Draw the light sources as bright as the pipeline can show them.
export const setSourceGain = (materials, hdr) => {
  Object.values(materials).forEach((material) => {
    const { source, gain } = material.userData ?? {};
    if (!source) return;
    material.color.copy(source).multiplyScalar(hdr && gain ? 1 + (HDR_GAIN - 1) * gain : 1);
  });
};

const scratchMatrix = new Matrix4();
const scratchQuaternion = new Quaternion();
const scratchEuler = new Euler();
const scratchPosition = new Vector3();
const scratchScale = new Vector3(1, 1, 1);

const compose = (position, rotation, scale) => {
  scratchPosition.set(position[0], position[1], position[2]);
  scratchEuler.set(rotation?.[0] ?? 0, rotation?.[1] ?? 0, rotation?.[2] ?? 0, "YXZ");
  scratchQuaternion.setFromEuler(scratchEuler);
  if (scale) scratchScale.set(scale[0], scale[1], scale[2]);
  else scratchScale.set(1, 1, 1);
  return scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
};

// Give a box texture coordinates in metres, read off whichever axis each face
// looks along, so plaster and timber keep one grain size whether the box is a
// skirting board or a wall. Works for plain and rounded boxes alike.
const applyWorldUv = (geometry, uvScale, turn, longAxis) => {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < position.count; index += 1) {
    const nx = Math.abs(normal.getX(index));
    const ny = Math.abs(normal.getY(index));
    const nz = Math.abs(normal.getZ(index));
    let u;
    let v;
    if (ny >= nx && ny >= nz) {
      u = position.getX(index);
      v = position.getZ(index);
    } else if (nx >= nz) {
      u = position.getZ(index);
      v = position.getY(index);
    } else {
      u = position.getX(index);
      v = position.getY(index);
    }
    const alongSecondAxis = longAxis === (ny >= nx && ny >= nz ? "z" : "y");
    if (turn || alongSecondAxis) uv.setXY(index, v / uvScale, u / uvScale);
    else uv.setXY(index, u / uvScale, v / uvScale);
  }
};

export const createKit = () => {
  const batches = new Map();

  const add = (material, geometry, position = [0, 0, 0], rotation = null, scale = null) => {
    geometry.applyMatrix4(compose(position, rotation, scale));
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
    return geometry;
  };

  const kit = {
    add,

    // A box by size and centre. Its edges are eased by the material's bevel,
    // or by `options.bevel`, when the box is thick enough to carry one.
    box(material, [width, height, depth], position, rotation, options = {}) {
      const bevel = options.bevel ?? material.userData?.bevel ?? 0;
      const thinnest = Math.min(width, height, depth);
      const radius = Math.min(bevel, thinnest * 0.45);
      const geometry =
        radius >= 0.002 && thinnest >= 0.008
          ? new RoundedBoxGeometry(width, height, depth, radius >= 0.02 ? 2 : 1, radius)
          : new BoxGeometry(width, height, depth);
      const uvScale = material.userData?.uvScale;
      if (uvScale) {
        const longest = Math.max(width, height, depth);
        const longAxis = material.userData.grain ? (longest === height ? "y" : longest === depth ? "z" : "x") : null;
        applyWorldUv(geometry, uvScale, material.userData.uvTurn, longAxis);
      }
      return add(material, geometry, position, rotation);
    },

    // A box by its extents, the way walls are specified in the floor plan.
    slab(material, [x0, x1], [y0, y1], [z0, z1]) {
      return kit.box(
        material,
        [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)],
        [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]
      );
    },

    cylinder(material, { radius, radiusTop, height, segments = 24, open = false }, position, rotation) {
      return add(
        material,
        new CylinderGeometry(radiusTop ?? radius, radius, height, segments, 1, open),
        position,
        rotation
      );
    },

    sphere(material, { radius, segments = 20, scale = null }, position, rotation) {
      return add(
        material,
        new SphereGeometry(radius, segments, Math.max(8, Math.round(segments * 0.66))),
        position,
        rotation,
        scale
      );
    },

    torus(material, { radius, tube, segments = 64, tubeSegments = 10, arc = Math.PI * 2 }, position, rotation) {
      return add(
        material,
        new TorusGeometry(radius, tube, tubeSegments, segments, arc),
        position,
        rotation
      );
    },

    plane(material, [width, height], position, rotation) {
      return add(material, new PlaneGeometry(width, height), position, rotation);
    },

    // A cable or a cord: a tube along a smooth curve through the points.
    tube(material, points, { radius = 0.012, segments = 28, radial = 6 } = {}) {
      const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
      return add(material, new TubeGeometry(curve, segments, radius, radial, false));
    },

    // The same kit, working in the frame of something standing at `origin`
    // and turned by `yaw`, so a chair or a lamp is described once, facing
    // north, and placed anywhere.
    at(origin, yaw = 0) {
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const place = ([x, y, z]) => [origin[0] + cos * x + sin * z, origin[1] + y, origin[2] - sin * x + cos * z];
      const turn = (rotation) => [rotation?.[0] ?? 0, (rotation?.[1] ?? 0) + yaw, rotation?.[2] ?? 0];
      return {
        place,
        box: (material, size, position, rotation, options) => kit.box(material, size, place(position), turn(rotation), options),
        cylinder: (material, shape, position, rotation) => kit.cylinder(material, shape, place(position), turn(rotation)),
        sphere: (material, shape, position, rotation) => kit.sphere(material, shape, place(position), turn(rotation)),
        torus: (material, shape, position, rotation) => kit.torus(material, shape, place(position), turn(rotation)),
        add: (material, geometry, position, rotation, scale) => kit.add(material, geometry, place(position), turn(rotation), scale),
        tube: (material, points, options) => kit.tube(material, points.map(place), options),
      };
    },

    // Merge every batch into one mesh per material and add them to `parent`.
    flush(parent, { shadows = true } = {}) {
      const meshes = [];
      batches.forEach((geometries, material) => {
        if (!geometries.length) return;
        // Merging needs every geometry indexed, or none of them.
        const mixed = geometries.some((g) => g.index) && geometries.some((g) => !g.index);
        const ready = mixed ? geometries.map((g) => (g.index ? g.toNonIndexed() : g)) : geometries;
        const merged = mergeGeometries(ready, false);
        if (mixed) ready.forEach((g) => g.dispose());
        geometries.forEach((geometry) => geometry.dispose());
        if (!merged) return;
        const mesh = new Mesh(merged, material);
        const noShadow = material.userData?.noShadow || material.transparent;
        mesh.castShadow = shadows && !noShadow;
        mesh.receiveShadow = shadows && !material.isMeshBasicMaterial;
        parent.add(mesh);
        meshes.push(mesh);
      });
      batches.clear();
      return meshes;
    },
  };

  return kit;
};

// A mesh that stands alone because it moves or changes.
export const part = (geometry, material, position = [0, 0, 0], { shadow = true } = {}) => {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = shadow && !material.transparent;
  mesh.receiveShadow = shadow;
  return mesh;
};

// An unlit, glowing surface: screens, indicator lights, lit traces.
export const glowMaterial = (color, options = {}) =>
  new MeshBasicMaterial({
    color: new Color(color),
    toneMapped: false,
    side: options.doubleSide ? DoubleSide : undefined,
    transparent: options.opacity !== undefined || options.transparent,
    opacity: options.opacity ?? 1,
    map: options.map ?? null,
    depthWrite: options.depthWrite ?? true,
    blending: options.blending,
  });

export const disposeTree = (object) => {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const list = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    list.forEach((material) => {
      materials.add(material);
      ["map", "roughnessMap", "emissiveMap", "alphaMap", "bumpMap", "normalMap"].forEach((key) => {
        if (material[key]) textures.add(material[key]);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
};

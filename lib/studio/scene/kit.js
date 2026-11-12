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
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  createFeltTexture,
  createFloorTextures,
  createPlasterTexture,
  createWoodTexture,
} from "./textures";

export const PALETTE = {
  ink: 0x050806,
  surface: 0x0a110e,
  paper: 0xf2fbf7,
  mint: 0x89f2c2,
  amber: 0xe7b85e,
  muted: 0x9dafaa,
};

// The studio's materials. Physically based, and deliberately few: the same
// walnut, brass, and blackened steel recur in every room, which is most of
// what makes five rooms read as one person's place.
export const createMaterials = (tier) => {
  const size = tier.textureSize;
  const floor = createFloorTextures(size, tier.anisotropy);
  const plaster = createPlasterTexture(size, 0x7d8a84, 7);
  const galleryPlaster = createPlasterTexture(size, 0xb9c0ba, 23);
  const walnut = createWoodTexture(size / 2, 0x4a3324, 3);
  const oak = createWoodTexture(size / 2, 0x9a7a52, 5);
  const felt = createFeltTexture(size / 2, 0x33473f);

  const standard = (options, userData = {}) => {
    const material = new MeshStandardMaterial(options);
    material.userData = userData;
    return material;
  };

  const materials = {
    floor: standard(
      { map: floor.map, roughnessMap: floor.roughnessMap, color: 0xd8c8b8, roughness: 0.62, metalness: 0.02, envMapIntensity: 0.9 },
      { uvScale: 2.4 }
    ),
    wall: standard({ map: plaster, color: 0x74857c, roughness: 0.94 }, { uvScale: 3 }),
    wallGallery: standard({ map: galleryPlaster, color: 0xa3aca5, roughness: 0.95 }, { uvScale: 3 }),
    ceiling: standard({ map: plaster, color: 0x313b36, roughness: 1 }, { uvScale: 3 }),
    walnut: standard({ map: walnut, roughness: 0.58, envMapIntensity: 0.6 }, { uvScale: 1.1 }),
    oak: standard({ map: oak, roughness: 0.66, envMapIntensity: 0.5 }, { uvScale: 1.1 }),
    darkWood: standard({ map: walnut, color: 0x54463c, roughness: 0.72 }, { uvScale: 1.1 }),
    steel: standard({ color: 0x0f1312, roughness: 0.42, metalness: 0.85, envMapIntensity: 0.9 }),
    iron: standard({ color: 0x191d1c, roughness: 0.7, metalness: 0.55 }),
    aluminium: standard({ color: 0x9aa5a0, roughness: 0.36, metalness: 0.95 }),
    brass: standard({ color: 0xb89250, roughness: 0.3, metalness: 1, envMapIntensity: 1.1 }),
    brassDull: standard({ color: 0x8a6c38, roughness: 0.55, metalness: 0.9 }),
    paper: standard({ color: 0xe9efe9, roughness: 0.92 }),
    card: standard({ color: 0xcfc6ae, roughness: 0.9 }),
    felt: standard({ map: felt, roughness: 1 }, { uvScale: 0.8 }),
    feltDark: standard({ map: felt, color: 0x5b6660, roughness: 1 }, { uvScale: 0.8 }),
    leather: standard({ color: 0x2b1d15, roughness: 0.5, envMapIntensity: 0.5 }),
    rubber: standard({ color: 0x0b0d0c, roughness: 0.85 }),
    plastic: standard({ color: 0x15191a, roughness: 0.5, envMapIntensity: 0.6 }),
    ivory: standard({ color: 0xe6e2d6, roughness: 0.35, envMapIntensity: 0.6 }),
    ebony: standard({ color: 0x0c0c0d, roughness: 0.3, envMapIntensity: 0.7 }),
    stone: standard({ color: 0x232a27, roughness: 0.8, metalness: 0.1 }, { uvScale: 2 }),
    sand: standard({ color: 0xb48a5a, roughness: 1 }),
    vinyl: standard({ color: 0x070808, roughness: 0.32, metalness: 0.2, envMapIntensity: 1 }),
    glass: new MeshPhysicalMaterial({
      color: 0xcfe9df,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
    mint: new MeshBasicMaterial({ color: PALETTE.mint, toneMapped: false }),
    amber: new MeshBasicMaterial({ color: PALETTE.amber, toneMapped: false }),
    screenOff: standard({ color: 0x050908, roughness: 0.25, envMapIntensity: 1 }),
  };
  materials.glass.userData = { noShadow: true };
  materials.mint.userData = { noShadow: true };
  materials.amber.userData = { noShadow: true };
  return materials;
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

// Scale a box's texture coordinates to its real size, so plaster and timber
// keep one grain size whether the box is a skirting board or a wall.
const scaleBoxUv = (geometry, width, height, depth, uvScale) => {
  const uv = geometry.attributes.uv;
  const faces = [
    [depth, height], [depth, height], // +x, -x
    [width, depth], [width, depth], // +y, -y
    [width, height], [width, height], // +z, -z
  ];
  for (let face = 0; face < 6; face += 1) {
    const [u, v] = faces[face];
    for (let vertex = 0; vertex < 4; vertex += 1) {
      const index = face * 4 + vertex;
      uv.setXY(index, (uv.getX(index) * u) / uvScale, (uv.getY(index) * v) / uvScale);
    }
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

    // A box by size and centre.
    box(material, [width, height, depth], position, rotation) {
      const geometry = new BoxGeometry(width, height, depth);
      const uvScale = material.userData?.uvScale;
      if (uvScale) scaleBoxUv(geometry, width, height, depth, uvScale);
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
      ["map", "roughnessMap", "emissiveMap", "alphaMap", "bumpMap"].forEach((key) => {
        if (material[key]) textures.add(material[key]);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
};

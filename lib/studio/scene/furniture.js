// Furniture with real silhouettes. Where props.js builds things from boxes,
// these pieces are turned (lathe profiles), cut and bevelled (extrusions of a
// plan or a section), or upholstered (rounded, cushioned forms), the way the
// real things are made. Everything here is static, so it goes into the kit's
// merged batches and costs nothing per piece at draw time.
//
// Conventions follow props.js: a piece is described facing north (-z) at
// yaw 0 and placed with `ctx.kit.at(origin, yaw)`.
import {
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  Vector2,
} from "three";

// Extrude a plan (x, z on the floor) upward from y0 to y1, with its edges
// rounded by `bevel`. Plan points are given as [x, z].
const extrudePlan = (shape, y0, y1, { bevel = 0.02, segments = 2, curve = 14 } = {}) => {
  const depth = Math.max(0.001, y1 - y0 - bevel * 2);
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: segments,
    curveSegments: curve,
  });
  // Shape y is plan -z; extrusion runs along +z, which becomes up.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y0 + bevel, 0);
  return geometry;
};

const circleShape = (radius, cx = 0, cz = 0) => {
  const shape = new Shape();
  shape.absarc(cx, -cz, radius, 0, Math.PI * 2, false);
  return shape;
};

const ellipseShape = (rx, rz) => {
  const shape = new Shape();
  shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  return shape;
};

// An arc band in plan: the barrel of a tub chair, the bent back of a chair.
// `spread` is the half-angle either side of the back (+z).
const arcBandShape = (outer, thickness, spread) => {
  const inner = outer - thickness;
  const shape = new Shape();
  // Angles measured in the shape's own plane, where +y is plan -z, so the
  // back of the chair (+z) is at -90 degrees.
  const back = -Math.PI / 2;
  const a0 = back - spread;
  const a1 = back + spread;
  shape.absarc(0, 0, outer, a0, a1, false);
  // Round the ends of the band.
  const endCentre = (angle) => [Math.cos(angle) * (outer - thickness / 2), Math.sin(angle) * (outer - thickness / 2)];
  const [ex1, ey1] = endCentre(a1);
  shape.absarc(ex1, ey1, thickness / 2, a1, a1 + Math.PI, false);
  shape.absarc(0, 0, inner, a1, a0, true);
  const [ex0, ey0] = endCentre(a0);
  shape.absarc(ex0, ey0, thickness / 2, a0 + Math.PI, a0 + Math.PI * 2, false);
  return shape;
};

// A turned profile: points are [radius, height].
const lathe = (points, segments = 32) =>
  new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), segments);

// A leg that tapers toward the floor, splayed outward by `splay`.
const taperedLeg = (piece, material, [x, z], height, { top = 0.022, foot = 0.013, splay = 0.08, square = false } = {}) => {
  const geometry = new CylinderGeometry(top, foot, height, square ? 4 : 12);
  if (square) geometry.rotateY(Math.PI / 4);
  // Tilt the foot outward, away from the centre of the piece, keeping the top
  // where the leg meets the frame.
  const angle = Math.atan2(x, z);
  const out = (height / 2) * Math.sin(splay);
  piece.add(material, geometry, [x + Math.sin(angle) * out, height / 2, z + Math.cos(angle) * out], [
    -Math.cos(angle) * splay,
    0,
    Math.sin(angle) * splay,
  ]);
};

/* ------------------------------------------------------------------ seating */

// A tub chair: a deep upholstered barrel that wraps round into its arms, a
// round seat cushion, on four splayed walnut legs. Footprint about 0.8 m.
export const addTubChair = (ctx, [x, z], yaw = 0, { fabric = ctx.m.fabric, legs = ctx.m.walnut, radius = 0.4 } = {}) => {
  const piece = ctx.kit.at([x, 0, z], yaw);
  const deck = 0.17;
  piece.add(fabric, extrudePlan(circleShape(radius - 0.02), deck, deck + 0.08, { bevel: 0.03 }), [0, 0, 0]);
  piece.add(fabric, extrudePlan(arcBandShape(radius, 0.15, Math.PI * 0.64), deck, 0.72, { bevel: 0.05, segments: 3 }), [0, 0, 0]);
  piece.add(fabric, extrudePlan(circleShape(radius - 0.13, 0, -0.04), deck + 0.07, 0.43, { bevel: 0.05, segments: 3 }), [0, 0, 0]);
  // A loose lumbar cushion against the back.
  piece.box(fabric, [0.38, 0.2, 0.1], [0, 0.52, radius - 0.2], [-0.18, 0, 0], { bevel: 0.045 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    taperedLeg(piece, legs, [sx * radius * 0.56, sz * radius * 0.56], deck + 0.005, { top: 0.024, foot: 0.014, splay: 0.12 });
  });
};

// A round upholstered pouf.
export const addOttoman = (ctx, [x, z], { fabric = ctx.m.fabric, radius = 0.27, height = 0.4 } = {}) => {
  ctx.kit.add(fabric, extrudePlan(circleShape(radius), 0.03, height, { bevel: 0.06, segments: 3 }), [x, 0, z]);
  ctx.kit.cylinder(ctx.m.walnut, { radius: radius * 0.86, height: 0.03, segments: 32 }, [x, 0.015, z]);
};

// A side chair: a saddled walnut seat, a bent back rail between two tall
// rear legs, square tapered legs.
export const addBentChair = (ctx, [x, z], yaw = 0, { wood = ctx.m.walnut, seatHeight = 0.46 } = {}) => {
  const piece = ctx.kit.at([x, 0, z], yaw);
  piece.add(wood, extrudePlan(ellipseShape(0.225, 0.21), seatHeight - 0.035, seatHeight, { bevel: 0.012 }), [0, 0, 0]);
  [[-0.17, -0.15], [0.17, -0.15]].forEach(([dx, dz]) =>
    taperedLeg(piece, wood, [dx, dz], seatHeight - 0.03, { top: 0.02, foot: 0.014, splay: 0.06, square: true })
  );
  // Rear legs run up past the seat to carry the back.
  [-0.17, 0.17].forEach((dx) => piece.box(wood, [0.03, 0.82, 0.03], [dx, 0.41, 0.17], [0.06, 0, 0]));
  piece.add(wood, extrudePlan(arcBandShape(0.34, 0.022, 0.62), 0.66, 0.8, { bevel: 0.008 }), [0, 0, -0.14]);
  piece.box(wood, [0.33, 0.02, 0.02], [0, 0.17, -0.15]);
  piece.box(wood, [0.33, 0.02, 0.02], [0, 0.17, 0.17]);
};

// A long gallery bench: a leather cushion on a walnut frame.
export const addGalleryBench = (ctx, [x, z], yaw = 0, { length = 1.5, depth = 0.46 } = {}) => {
  const piece = ctx.kit.at([x, 0, z], yaw);
  piece.box(ctx.m.leather, [length, 0.075, depth], [0, 0.445, 0], null, { bevel: 0.03 });
  piece.box(ctx.m.walnut, [length - 0.04, 0.03, depth - 0.04], [0, 0.395, 0], null, { bevel: 0.008 });
  [-1, 1].forEach((side) => {
    const ax = side * (length / 2 - 0.12);
    piece.box(ctx.m.walnut, [0.05, 0.38, 0.05], [ax, 0.19, -depth / 2 + 0.06], [0, 0, side * 0.04]);
    piece.box(ctx.m.walnut, [0.05, 0.38, 0.05], [ax, 0.19, depth / 2 - 0.06], [0, 0, side * 0.04]);
    piece.box(ctx.m.walnut, [0.04, 0.035, depth - 0.1], [ax, 0.1, 0]);
  });
  piece.box(ctx.m.walnut, [length - 0.24, 0.03, 0.03], [0, 0.1, 0]);
};

// A three-seat sofa: a low frame, deep seat cushions, loose back cushions,
// rounded arms, on short walnut legs.
export const addSofa = (ctx, [x, z], yaw = 0, { fabric = ctx.m.fabric, length = 2.1, depth = 0.9 } = {}) => {
  const piece = ctx.kit.at([x, 0, z], yaw);
  const inner = length - 0.36;
  piece.box(fabric, [length, 0.2, depth], [0, 0.22, 0], null, { bevel: 0.05 });
  piece.box(fabric, [length, 0.42, 0.2], [0, 0.48, depth / 2 - 0.1], null, { bevel: 0.07 });
  [-1, 1].forEach((side) => piece.box(fabric, [0.18, 0.36, depth], [side * (length / 2 - 0.09), 0.45, 0], null, { bevel: 0.08 }));
  const seats = 3;
  for (let index = 0; index < seats; index += 1) {
    const cx = -inner / 2 + (inner / seats) * (index + 0.5);
    piece.box(fabric, [inner / seats - 0.012, 0.14, depth - 0.22], [cx, 0.39, -0.08], null, { bevel: 0.055 });
    piece.box(fabric, [inner / seats - 0.02, 0.4, 0.17], [cx, 0.62, depth / 2 - 0.28], [-0.16, 0, 0], { bevel: 0.07 });
  }
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
    taperedLeg(piece, ctx.m.walnut, [sx * (length / 2 - 0.08), sz * (depth / 2 - 0.08)], 0.12, { top: 0.022, foot: 0.016, splay: 0 })
  );
};

/* ------------------------------------------------------------------- tables */

// A turned pedestal side table with a marble top.
export const addSideTable = (ctx, [x, z], { height = 0.52, top = ctx.m.marble, radius = 0.22 } = {}) => {
  ctx.kit.add(
    ctx.m.walnut,
    lathe([
      [0, 0],
      [0.16, 0],
      [0.165, 0.012],
      [0.12, 0.03],
      [0.04, 0.06],
      [0.028, 0.2],
      [0.024, height * 0.62],
      [0.04, height - 0.05],
      [0.07, height - 0.025],
      [0, height - 0.025],
    ]),
    [x, 0, z]
  );
  ctx.kit.add(top, extrudePlan(circleShape(radius), height - 0.026, height, { bevel: 0.006 }), [x, 0, z]);
};

// An oval coffee table in walnut on tapered legs.
export const addCoffeeTable = (ctx, [x, z], yaw = 0, { length = 1.1, depth = 0.6, height = 0.4 } = {}) => {
  const piece = ctx.kit.at([x, 0, z], yaw);
  piece.add(ctx.m.walnut, extrudePlan(ellipseShape(length / 2, depth / 2), height - 0.04, height, { bevel: 0.012 }), [0, 0, 0]);
  piece.add(ctx.m.walnut, extrudePlan(ellipseShape(length / 2 - 0.08, depth / 2 - 0.06), 0.14, 0.165, { bevel: 0.006 }), [0, 0, 0]);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
    taperedLeg(piece, ctx.m.walnut, [sx * length * 0.3, sz * depth * 0.28], height - 0.035, { top: 0.024, foot: 0.014, splay: 0.08 })
  );
};

/* ---------------------------------------------------------------- vessels */

// Turned planters. Returns the height of the soil, for what grows in it.
const POT_PROFILES = {
  // A tall tapered planter with a rolled lip.
  taper: (r, h) => [[0, 0], [r * 0.72, 0], [r * 0.76, 0.02], [r * 0.95, h * 0.9], [r * 1.02, h * 0.96], [r, h], [r * 0.9, h], [r * 0.86, h * 0.92], [0, h * 0.92]],
  // A rounded belly, narrowing to a short neck.
  belly: (r, h) => [[0, 0], [r * 0.5, 0], [r * 0.56, 0.02], [r * 0.98, h * 0.45], [r * 0.9, h * 0.82], [r * 0.78, h * 0.94], [r * 0.8, h], [r * 0.72, h], [r * 0.7, h * 0.94], [0, h * 0.94]],
  // A low cylinder, a bowl on a foot.
  bowl: (r, h) => [[0, 0], [r * 0.6, 0], [r * 0.62, h * 0.12], [r * 0.9, h * 0.3], [r, h], [r * 0.93, h], [r * 0.88, h * 0.9], [0, h * 0.9]],
};

export const addPot = (ctx, [x, z], { radius = 0.18, height = 0.32, shape = "taper", material = ctx.m.ceramic, y = 0 } = {}) => {
  ctx.kit.add(material, lathe(POT_PROFILES[shape](radius, height), 36), [x, y, z]);
  ctx.kit.cylinder(ctx.m.rubber, { radius: radius * 0.86, height: 0.012, segments: 28 }, [x, y + height * 0.9, z]);
  return y + height * 0.9;
};

// A snake plant: stiff upright blades from a low planter.
export const addSnakePlant = (ctx, [x, z], { seed = 3, blades = 11, height = 0.9, pot = 0.15, material } = {}) => {
  const { kit, m } = ctx;
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const soil = addPot(ctx, [x, z], { radius: pot, height: pot * 1.6, shape: "belly", material: material ?? m.stoneware });
  for (let index = 0; index < blades; index += 1) {
    const tall = height * (0.55 + random() * 0.45);
    const width = 0.035 + random() * 0.025;
    const blade = new CylinderGeometry(0.001, width, tall, 3, 4);
    blade.scale(1, 1, 0.22);
    blade.translate(0, tall / 2, 0);
    const angle = random() * Math.PI * 2;
    const reach = random() * pot * 0.55;
    kit.add(m.leafDark, blade, [x + Math.cos(angle) * reach, soil - 0.01, z + Math.sin(angle) * reach], [
      (random() - 0.5) * 0.3,
      random() * Math.PI,
      (random() - 0.5) * 0.3,
    ]);
  }
};

/* ---------------------------------------------------------------- lamps */

// A floor lamp: brass column on a weighted foot, a linen drum shade lit from
// within. Returns where its bulb is.
export const addDrumLamp = (ctx, [x, z], { height = 1.5 } = {}) => {
  const { kit, m } = ctx;
  kit.add(m.brass, lathe([[0, 0], [0.15, 0], [0.155, 0.01], [0.12, 0.03], [0.02, 0.04], [0, 0.04]]), [x, 0, z]);
  kit.cylinder(m.brass, { radius: 0.01, height: height - 0.1, segments: 10 }, [x, 0.04 + (height - 0.1) / 2, z]);
  kit.cylinder(ctx.shade, { radius: 0.2, radiusTop: 0.19, height: 0.28, segments: 36, open: true }, [x, height, z]);
  kit.torus(m.brass, { radius: 0.2, tube: 0.004, segments: 36, tubeSegments: 6 }, [x, height - 0.14, z], [Math.PI / 2, 0, 0]);
  kit.sphere(m.bulb, { radius: 0.04, segments: 14 }, [x, height - 0.02, z]);
  return [x, height - 0.02, z];
};

// A banker's lamp: brass foot and arm, a cased green glass shade lit from
// inside. Returns where the light comes from.
export const addBankerLamp = (ctx, [x, y, z], yaw = 0, { glass }) => {
  const piece = ctx.kit.at([x, y, z], yaw);
  piece.add(ctx.m.brass, lathe([[0, 0], [0.085, 0], [0.09, 0.01], [0.06, 0.03], [0.012, 0.045], [0, 0.045]]), [0, 0, 0]);
  piece.cylinder(ctx.m.brass, { radius: 0.007, height: 0.3, segments: 8 }, [0, 0.19, 0]);
  piece.box(ctx.m.brass, [0.02, 0.012, 0.11], [0, 0.34, -0.04]);
  const shade = new CylinderGeometry(0.075, 0.075, 0.26, 24, 1, true, 0, Math.PI);
  shade.rotateZ(Math.PI / 2);
  shade.rotateX(-0.12);
  piece.add(glass, shade, [0, 0.355, -0.09]);
  [-1, 1].forEach((side) => {
    const cap = new CylinderGeometry(0.075, 0.075, 0.006, 24, 1, false, 0, Math.PI);
    cap.rotateZ(Math.PI / 2);
    piece.add(ctx.m.brass, cap, [side * 0.13, 0.355, -0.09]);
  });
  return piece.place([0, 0.33, -0.09]);
};

/* -------------------------------------------------------------- acoustics */

// A quadratic-residue diffuser: wells of walnut cut to the depths of n² mod p,
// the pattern that scatters sound evenly. Facing `facing` off its wall.
export const addDiffuser = (ctx, { center, facing = 0, columns = 7, rows = 7, cell = 0.09, depthUnit = 0.022 }) => {
  const piece = ctx.kit.at([center[0], center[1], center[2]], facing);
  const prime = 7;
  piece.box(ctx.m.darkWood, [columns * cell + 0.04, rows * cell + 0.04, 0.03], [0, 0, 0.015]);
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const depth = 0.02 + ((column * column + row * row) % prime) * depthUnit;
      piece.box(row % 2 ? ctx.m.walnut : ctx.m.oak, [cell - 0.008, cell - 0.008, depth], [
        (column - (columns - 1) / 2) * cell,
        (row - (rows - 1) / 2) * cell,
        0.03 + depth / 2,
      ]);
    }
  }
};

// A fabric-wrapped acoustic panel on stand-offs.
export const addAcousticPanel = (ctx, { center, facing = 0, size: [width, height], fabric = ctx.m.fabricCharcoal }) => {
  const piece = ctx.kit.at(center, facing);
  piece.box(fabric, [width, height, 0.06], [0, 0, 0.05], null, { bevel: 0.02 });
};

/* -------------------------------------------------------------- display */

// A museum vitrine: a walnut-skirted plinth with a frameless glass hood.
// Returns the height of the display deck.
export const addVitrine = (ctx, [x, z], { size = 0.6, height = 0.95, hood = 0.46 } = {}) => {
  const { kit, m } = ctx;
  kit.box(m.walnut, [size, 0.08, size], [x, 0.04, z], null, { bevel: 0.006 });
  kit.box(m.paper, [size - 0.02, height - 0.1, size - 0.02], [x, 0.08 + (height - 0.1) / 2, z], null, { bevel: 0.006 });
  kit.box(m.walnut, [size, 0.025, size], [x, height - 0.0125, z], null, { bevel: 0.004 });
  const inner = size - 0.06;
  const top = height + hood;
  kit.plane(m.glassClear, [inner, hood], [x, height + hood / 2, z - inner / 2]);
  kit.plane(m.glassClear, [inner, hood], [x, height + hood / 2, z + inner / 2], [0, Math.PI, 0]);
  kit.plane(m.glassClear, [inner, hood], [x - inner / 2, height + hood / 2, z], [0, Math.PI / 2, 0]);
  kit.plane(m.glassClear, [inner, hood], [x + inner / 2, height + hood / 2, z], [0, -Math.PI / 2, 0]);
  kit.plane(m.glassClear, [inner, inner], [x, top, z], [-Math.PI / 2, 0, 0]);
  // Hairline steel at the top edges, where real glass is bonded.
  [[0, -1], [0, 1]].forEach(([, side]) => kit.box(m.steel, [inner, 0.006, 0.006], [x, top, z + (side * inner) / 2]));
  [-1, 1].forEach((side) => kit.box(m.steel, [0.006, 0.006, inner], [x + (side * inner) / 2, top, z]));
  return height;
};

/* ------------------------------------------------------------------- rugs */

// A flat-woven jute rug with a bound edge, to layer a patterned one on.
export const addJuteRug = (ctx, [x, z], [width, depth]) => {
  ctx.kit.box(ctx.m.jute, [width, 0.008, depth], [x, 0.004, z], null, { bevel: 0 });
  for (const side of [-1, 1]) {
    ctx.kit.box(ctx.m.jute, [width, 0.01, 0.022], [x, 0.005, z + side * (depth / 2 - 0.011)], null, { bevel: 0 });
  }
};

export { extrudePlan, lathe, circleShape };

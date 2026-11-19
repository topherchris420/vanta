// A laminated shell carried by a swivel mechanism. The seat and back are one
// continuous moulding. Its upholstery follows the same section as the veneer.
import { BufferGeometry, Float32BufferAttribute, SplineCurve, Vector2 } from "three";

const outline = new SplineCurve([
  [0.44, -0.245], [0.424, -0.19], [0.425, -0.04], [0.448, 0.09],
  [0.496, 0.16], [0.59, 0.193], [0.73, 0.206], [0.89, 0.23],
  [1.04, 0.286], [1.155, 0.303],
].map(([y, z]) => new Vector2(y, z)));

function shell(padded) {
  const positions = [], uvs = [], indices = [];
  const across = 18, along = padded ? 96 : 36;
  const stride = across + 1, layer = stride * (along + 1);
  for (const face of [0, 1]) {
    for (let row = 0; row <= along; row++) {
      const t = row / along;
      const v = padded ? 0.012 + t * 0.976 : t;
      const p = outline.getPointAt(v);
      const tangent = outline.getTangentAt(v);
      const scallop = Math.pow(Math.abs(2 * t - 1), 14);
      const width = 0.247 - 0.022 * v + 0.021 * Math.sin(v * Math.PI * 1.65) - 0.02 * scallop;
      for (let col = 0; col <= across; col++) {
        const u = (col / across) * 2 - 1;
        const edge = Math.abs(u);
        const rolled = Math.sin(Math.PI * t) ** 0.48 * (1 - edge ** 6);
        const cupping = edge ** 2 * (0.034 + 0.016 * Math.sin(Math.PI * v));
        // The upper face is channel stitched. Its thin return meets the shell all the way round.
        const rib = (0.5 - 0.5 * Math.cos(t * Math.PI * 2 * 14)) ** 0.62;
        const depth = padded ? (face ? 0.002 : 0.008 + rolled * (0.021 + 0.011 * rib)) : (face ? -0.016 : 0);
        const x = u * (width - (padded ? 0.007 : 0));
        positions.push(x, p.x + tangent.y * (cupping + depth), p.y - tangent.x * (cupping + depth));
        uvs.push(x * 2.2 + 0.5, v * 2.2);
      }
    }
  }
  const quad = (a, b, c, d) => indices.push(a, b, d, b, c, d);
  for (let row = 0; row < along; row++) {
    const start = row * stride;
    for (let col = 0; col < across; col++) {
      const a = start + col;
      quad(a, a + stride, a + stride + 1, a + 1);
      quad(layer + a + 1, layer + a + stride + 1, layer + a + stride, layer + a);
    }
    quad(start, start + layer, start + stride + layer, start + stride);
    const right = start + across;
    quad(right + stride, right + stride + layer, right + layer, right);
  }
  for (let col = 0; col < across; col++) {
    quad(col + 1, layer + col + 1, layer + col, col);
    const end = along * stride + col;
    quad(end, layer + end, layer + end + 1, end + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addOfficeChair(ctx, [x, z], yaw = 0) {
  const { m } = ctx;
  const chair = ctx.kit.at([x, 0, z], yaw);
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    const foot = (r, y) => [r * Math.sin(angle), y, r * Math.cos(angle)];
    chair.tube(m.aluminium, [foot(0.025, 0.18), foot(0.12, 0.128), foot(0.28, 0.081)], { radius: 0.014, segments: 8, radial: 8 });
    chair.cylinder(m.steel, { radius: 0.008, height: 0.045, segments: 8 }, foot(0.28, 0.065));
    for (const side of [-1, 1]) {
      const [px, py, pz] = foot(0.28, 0.036);
      chair.cylinder(m.rubber, { radius: 0.034, height: 0.016, segments: 16 },
        [px + Math.cos(angle) * side * 0.011, py, pz - Math.sin(angle) * side * 0.011], [0, angle, Math.PI / 2]);
    }
  }
  chair.cylinder(m.steel, { radius: 0.034, height: 0.16, segments: 18 }, [0, 0.22, 0]);
  chair.cylinder(m.aluminium, { radius: 0.022, height: 0.11, segments: 18 }, [0, 0.345, 0]);
  chair.box(m.iron, [0.23, 0.055, 0.235], [0, 0.396, -0.003], null, { bevel: 0.013 });
  chair.add(m.walnut, shell(false), [0, 0, 0]);
  chair.add(m.seatHide, shell(true), [0, 0, 0]);
  for (const side of [-1, 1]) {
    const ax = side * 0.258;
    chair.tube(m.aluminium, [[side * 0.12, 0.408, -0.11], [ax, 0.4, -0.11], [ax, 0.458, -0.13],
      [ax, 0.618, -0.132], [ax, 0.66, -0.091], [ax, 0.666, 0.105], [ax, 0.625, 0.16],
      [side * 0.203, 0.595, 0.198]], { radius: 0.009, segments: 30, radial: 8 });
    chair.box(m.seatHide, [0.042, 0.021, 0.186], [ax, 0.676, 0.012], null, { bevel: 0.01 });
    chair.cylinder(m.aluminium, { radius: 0.014, height: 0.006, segments: 14 },
      [side * 0.176, 0.60, 0.202], [Math.PI / 2, 0, 0]);
  }
}

// Run with node scripts/bakeStudioDaylight.mjs after changing the room shell.
// Trace only the fixed architecture. Practical lamps, the direct sun,
// furniture contact and reflections are handled separately by the renderer.
import { writeFileSync } from "node:fs";
import { Box3, DataUtils, Ray, SphericalHarmonics3, Vector3 } from "three";
import layout from "../lib/studio/layout.js";
import daylight from "../lib/studio/daylight.js";

const { STUDIO, WALLS, OPENINGS } = layout;
const { WINDOWS, daylightGrid, sunDirection } = daylight;
const { bounds, height } = STUDIO;
const [nx, ny, nz] = daylightGrid.resolution;
const solids = [];
const plaster = [0.71, 0.67, 0.59];
const oak = [0.39, 0.25, 0.15];
function box(x, y, z, albedo = plaster) {
  solids.push({ bounds: new Box3(new Vector3(x[0], y[0], z[0]), new Vector3(x[1], y[1], z[1])), albedo });
}
box(bounds.x, [-0.2, 0], bounds.z, oak);
box(bounds.x, [height, height + 0.2], bounds.z);
WALLS.forEach((wall, index) => {
  const side = ["north", "south", "west", "east"][index];
  const openings = WINDOWS.filter((w) => w.wall === side);
  if (!openings.length) return box(wall.x, [0, height], wall.z);
  const alongX = side === "north" || side === "south";
  const span = alongX ? wall.x : wall.z;
  const pier = (a, b, y0, y1) => {
    if (b <= a || y1 <= y0) return;
    box(alongX ? [a, b] : wall.x, [y0, y1], alongX ? wall.z : [a, b]);
  };
  let cursor = span[0];
  for (const { span: [a,b], rise: [sill,head] } of openings) {
    pier(cursor, a, 0, height);
    pier(a, b, 0, sill);
    pier(a, b, head, height);
    cursor = b;
  }
  pier(cursor, span[1], 0, height);
});
for (const { axis, at, span } of OPENINGS) {
  const thickness = [at - 0.12, at + 0.12];
  box(axis === "z" ? thickness : span, [axis === "z" ? 2.75 : 2.45, height], axis === "z" ? span : thickness);
}

const rays = [];
const count = 512;
for (let i = 0; i < count; i++) {
  const y = 1 - 2 * (i + 0.5) / count;
  const r = Math.sqrt(1 - y*y);
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  const direction = new Vector3(r*Math.cos(angle), y, r*Math.sin(angle));
  const basis = [];
  SphericalHarmonics3.getBasisAt(direction, basis);
  rays.push({ direction, basis });
}

// Radiance above and below the horizon, before the display's film curve.
const sky = [1.9, 2.55, 3.25];
const ground = [0.68, 0.55, 0.4];
const sun = [4.6, 3.16, 1.75];
const sunDir = new Vector3(...sunDirection);
const ray = new Ray();
const hit = new Vector3();
function trace(origin, direction, closestPoint) {
  ray.set(origin, direction);
  let nearest = Infinity;
  let surface;
  for (const solid of solids) {
    if (!ray.intersectBox(solid.bounds, hit)) continue;
    const distance = hit.distanceToSquared(origin);
    if (distance < nearest) {
      nearest = distance;
      surface = solid;
      closestPoint?.copy(hit);
    }
  }
  return surface;
}

// Cache one-bounce lighting by wall patch. A patch sees the sun only through
// a real opening and its diffuse reflectance determines the colour it returns.
const patches = new Map();
function bounce(point, surface, direction) {
  const normal = new Vector3();
  for (const axis of ["x","y","z"]) {
    if (Math.abs(point[axis] - surface.bounds.min[axis]) < 1e-5) { normal[axis] = -1; break; }
    if (Math.abs(point[axis] - surface.bounds.max[axis]) < 1e-5) { normal[axis] = 1; break; }
  }
  if (normal.dot(direction) > 0) normal.negate();
  const key = [solids.indexOf(surface), ...point.toArray().map(v => Math.round(v*4)), ...normal.toArray()].join(",");
  if (patches.has(key)) return patches.get(key);
  const start = point.clone().addScaledVector(normal, 0.004);
  const energy = [0,0,0];
  const cosine = Math.max(0, normal.dot(sunDir));
  if (cosine && !trace(start, sunDir)) {
    for (let c = 0; c < 3; c++) energy[c] = sun[c] * cosine;
  }
  // Uniform sphere quadrature over the visible exterior hemisphere.
  for (let i = 0; i < rays.length; i += 7) {
    const d = rays[i].direction;
    const weight = normal.dot(d);
    if (weight <= 0 || trace(start, d)) continue;
    const light = d.y > 0 ? sky : ground;
    for (let c = 0; c < 3; c++) energy[c] += light[c] * weight * 4 * Math.PI * 7 / count;
  }
  const radiance = energy.map((value, c) => value * surface.albedo[c] / Math.PI);
  patches.set(key, radiance);
  return radiance;
}

const atlas = new Uint16Array(nx * ny * (nz + 2) * 7 * 4);
const point = new Vector3();
const inset = daylightGrid.inset;
const coord = (a, b, i, n) => a + inset + (b - a - 2*inset) * i / (n-1);
for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
  const origin = new Vector3(coord(...bounds.x,x,nx), coord(0,height,y,ny), coord(...bounds.z,z,nz));
  const coefficients = new Float64Array(27);
  for (const { direction, basis } of rays) {
    const surface = trace(origin, direction, point);
    const light = surface ? bounce(point, surface, direction) : direction.y > 0 ? sky : ground;
    for (let k = 0; k < 9; k++) for (let c = 0; c < 3; c++) coefficients[3*k+c] += light[c] * basis[k];
  }
  for (let k = 0; k < 27; k++) {
    const slice = Math.floor(k/4) * (nz+2) + z + 1;
    const index = ((slice * ny + y) * nx + x) * 4 + k%4;
    atlas[index] = DataUtils.toHalfFloat(coefficients[k] * (4*Math.PI/count));
    if (z === 0) atlas[index - 4*nx*ny] = atlas[index];
    if (z === nz-1) atlas[index + 4*nx*ny] = atlas[index];
  }
}
writeFileSync(new URL("../public/materials/studio/daylight.bin", import.meta.url), new Uint8Array(atlas.buffer));

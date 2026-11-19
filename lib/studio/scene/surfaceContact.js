// Share coplanar wall segments (including the jambs between windows) in one
// chart. Artwork, timber and plaster retain their original, metre-scale UVs.
import { Float32BufferAttribute } from "three";
import layoutModel from "../layout";

export function applySurfaceContact(meshes, surfaces, layout) {
  const { studio } = layout;
  const charts = new Map(), receivers = [];
  const axes = [[2,1], [0,2], [0,1]];
  for (const mesh of meshes) {
    const kind = mesh.material.userData.contactSurface;
    if (!kind) continue;
    const g = mesh.geometry;
    const pos = g.attributes.position, norm = g.attributes.normal;
    const get = (attr, i, axis) => attr.array[i * 3 + axis];
    const assignments = [];
    for (let i = 0; i < pos.count; i++) {
      let axis = 0;
      if (Math.abs(norm.getY(i)) > Math.abs(norm.getX(i))) axis = 1;
      if (Math.abs(norm.getZ(i)) > Math.abs(get(norm,i,axis))) axis = 2;
      const sign = Math.sign(get(norm,i,axis));
      if (kind === "wall" ? axis === 1 : axis !== 1 || sign !== (kind === "ceiling" ? -1 : 1)) continue;
      const coordinate = get(pos,i,axis);
      if (kind === "wall" && (coordinate < studio.bounds[axis === 0 ? "x" : "z"][0] - 0.03 ||
          coordinate > studio.bounds[axis === 0 ? "x" : "z"][1] + 0.03)) continue;
      // The bevel of a worktop belongs to the same chart as its flat top.
      const plane = Math.round(coordinate * 1000) / 1000;
      const surface = kind === "top" ? layoutModel.zoneAt(layout.zones, pos.getX(i), pos.getZ(i)).id : plane;
      const key = [kind, axis, sign, surface].join(":");
      if (!charts.has(key)) charts.set(key, { key, axis, sign, plane, kind, min: [Infinity,Infinity], max: [-Infinity,-Infinity] });
      const chart = charts.get(key);
      if (kind === "top") chart.plane = Math.max(chart.plane, coordinate);
      const u = get(pos,i,axes[axis][0]), v = get(pos,i,axes[axis][1]);
      chart.min[0] = Math.min(chart.min[0], u); chart.min[1] = Math.min(chart.min[1], v);
      chart.max[0] = Math.max(chart.max[0], u); chart.max[1] = Math.max(chart.max[1], v);
      assignments.push([i, chart, u, v]);
    }
    receivers.push({ mesh, assignments });
  }

  // The first texels stay white for concealed edges and unmapped faces.
  const size = 1024, padding = 3;
  const packed = [...charts.values()].filter(c => c.max[0]-c.min[0] > 0.03 && c.max[1]-c.min[1] > 0.03);
  // Pack by dimensions, never by mesh insertion order. Narrow/medium/high
  // render tiers all consume exactly the same offline atlas.
  for (let density = 30; density >= 4; density -= 1) {
    for (const c of packed) {
      const rate = c.kind === "top" ? Math.min(density * 3, 96) : density;
      c.w = Math.max(2, Math.ceil((c.max[0] - c.min[0]) * rate) + 1);
      c.h = Math.max(2, Math.ceil((c.max[1] - c.min[1]) * rate) + 1);
    }
    packed.sort((a,b) => b.h-a.h || b.w-a.w || (a.key < b.key ? -1 : 1));
    let x = padding, y = padding * 3, row = 0;
    for (const c of packed) {
      if (x + c.w + padding > size) { x = padding; y += row + 2 * padding; row = 0; }
      c.x = x; c.y = y;
      x += c.w + 2 * padding; row = Math.max(row,c.h);
    }
    if (y + row + padding < size) break;
  }
  const map = surfaces.occlusion("surface-contact");
  for (const { mesh, assignments } of receivers) {
    const coords = new Float32Array(mesh.geometry.attributes.position.count * 2).fill(1.5 / size);
    for (const [i,c,u,v] of assignments) {
      if (c.x === undefined) continue;
      coords[2*i] = (c.x + 0.5 + (u-c.min[0]) / (c.max[0]-c.min[0]) * (c.w-1)) / size;
      coords[2*i+1] = (c.y + 0.5 + (v-c.min[1]) / (c.max[1]-c.min[1]) * (c.h-1)) / size;
    }
    mesh.geometry.setAttribute("uv1", new Float32BufferAttribute(coords, 2));
    mesh.material.aoMap = map;
  }
  return { size, padding, charts: packed };
}

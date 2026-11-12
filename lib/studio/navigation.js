// Walking, colliding, and finding a way through the studio. Pure functions over
// the floor plan in layout.js: no DOM, no three.js, so the same code moves the
// camera in the browser and is checked in node.

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const easeInOutCubic = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// The signed shortest turn from one heading to another.
const shortestAngle = (from, to) => {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

// Yaw 0 faces north (-z); a positive yaw turns toward the west.
const yawToward = (fromX, fromZ, toX, toZ) => Math.atan2(fromX - toX, fromZ - toZ);

// Heading and tilt that point a camera at `look` from `eye`.
const poseFromView = (view) => {
  const [ex, ey, ez] = view.eye;
  const [lx, ly, lz] = view.look;
  const flat = Math.hypot(lx - ex, lz - ez);
  return {
    x: ex,
    y: ey,
    z: ez,
    yaw: yawToward(ex, ez, lx, lz),
    pitch: Math.atan2(ly - ey, Math.max(flat, 1e-6)),
  };
};

// Push a circle out of every box it overlaps. Two passes settle a corner where
// two boxes meet; a walker only ever touches a couple at a time.
const resolveCollisions = (x, z, radius, colliders) => {
  let px = x;
  let pz = z;
  for (let pass = 0; pass < 3; pass += 1) {
    let moved = false;
    for (const collider of colliders) {
      const nearestX = clamp(px, collider.x[0], collider.x[1]);
      const nearestZ = clamp(pz, collider.z[0], collider.z[1]);
      const dx = px - nearestX;
      const dz = pz - nearestZ;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= radius * radius) continue;

      if (distanceSq > 1e-10) {
        const distance = Math.sqrt(distanceSq);
        const push = radius - distance;
        px += (dx / distance) * push;
        pz += (dz / distance) * push;
      } else {
        // Centre is inside the box: leave by the nearest face.
        const exits = [
          { axis: "x", value: collider.x[0] - radius, cost: px - collider.x[0] },
          { axis: "x", value: collider.x[1] + radius, cost: collider.x[1] - px },
          { axis: "z", value: collider.z[0] - radius, cost: pz - collider.z[0] },
          { axis: "z", value: collider.z[1] + radius, cost: collider.z[1] - pz },
        ].sort((a, b) => a.cost - b.cost);
        if (exits[0].axis === "x") px = exits[0].value;
        else pz = exits[0].value;
      }
      moved = true;
    }
    if (!moved) break;
  }
  return { x: px, z: pz };
};

const isBlocked = (x, z, radius, colliders) =>
  colliders.some((collider) => {
    const dx = x - clamp(x, collider.x[0], collider.x[1]);
    const dz = z - clamp(z, collider.z[0], collider.z[1]);
    return dx * dx + dz * dz < radius * radius;
  });

const WALK = {
  speed: 2.5, // m/s, an unhurried indoor walk
  run: 4.3,
  acceleration: 16,
  friction: 11,
  turnSpeed: 1.9, // rad/s for keyboard turning
};

// One step of walking. `input` is intent in the walker's own frame: forward
// and strafe in -1..1, turn in -1..1. Velocity eases toward the intent, so a
// released key coasts to a stop instead of halting.
const stepWalker = (state, input, delta, colliders, options = {}) => {
  const radius = options.radius ?? 0.32;
  const dt = clamp(delta, 0, 0.1);
  const yaw = state.yaw + (input.turn || 0) * WALK.turnSpeed * dt;

  let forward = clamp(input.forward || 0, -1, 1);
  let strafe = clamp(input.strafe || 0, -1, 1);
  const magnitude = Math.hypot(forward, strafe);
  if (magnitude > 1) {
    forward /= magnitude;
    strafe /= magnitude;
  }

  const top = input.run ? WALK.run : WALK.speed;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  // Forward is (-sin, -cos); strafing right is (cos, -sin).
  const targetVx = (-sin * forward + cos * strafe) * top;
  const targetVz = (-cos * forward - sin * strafe) * top;

  const moving = magnitude > 0.01;
  const rate = moving ? WALK.acceleration : WALK.friction;
  const blend = 1 - Math.exp(-rate * dt);
  let vx = state.vx + (targetVx - state.vx) * blend;
  let vz = state.vz + (targetVz - state.vz) * blend;
  if (!moving && Math.hypot(vx, vz) < 0.02) {
    vx = 0;
    vz = 0;
  }

  const wantedX = state.x + vx * dt;
  const wantedZ = state.z + vz * dt;
  const resolved = resolveCollisions(wantedX, wantedZ, radius, colliders);

  // Sliding along a wall keeps the tangential speed and loses the rest.
  if (dt > 0) {
    vx = (resolved.x - state.x) / dt;
    vz = (resolved.z - state.z) / dt;
  }

  return { x: resolved.x, z: resolved.z, vx, vz, yaw };
};

// Does the straight line between two points cross a box? Used for sight lines
// (walls only) and for straightening paths.
const segmentHitsBox = (ax, az, bx, bz, collider, pad = 0) => {
  const minX = collider.x[0] - pad;
  const maxX = collider.x[1] + pad;
  const minZ = collider.z[0] - pad;
  const maxZ = collider.z[1] + pad;
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return (
    clip(-dx, ax - minX) &&
    clip(dx, maxX - ax) &&
    clip(-dz, az - minZ) &&
    clip(dz, maxZ - az) &&
    t0 <= t1
  );
};

const segmentBlocked = (ax, az, bx, bz, colliders, pad = 0) =>
  colliders.some((collider) => segmentHitsBox(ax, az, bx, bz, collider, pad));

// Can something at `a` be seen from `b`? Only walls block a sight line; a
// table does not hide the book on it.
const hasLineOfSight = (ax, az, bx, bz, colliders) =>
  !colliders.some(
    (collider) => collider.wall && segmentHitsBox(ax, az, bx, bz, collider, -0.02)
  );

/* ---------------------------------------------------------------- pathing */

const CELL = 0.25;

const createGrid = (bounds, colliders, clearance) => {
  const originX = bounds.x[0];
  const originZ = bounds.z[0];
  const columns = Math.round((bounds.x[1] - bounds.x[0]) / CELL) + 1;
  const rows = Math.round((bounds.z[1] - bounds.z[0]) / CELL) + 1;
  const blocked = new Uint8Array(columns * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = originX + column * CELL;
      const z = originZ + row * CELL;
      if (isBlocked(x, z, clearance, colliders)) blocked[row * columns + column] = 1;
    }
  }
  return { originX, originZ, columns, rows, blocked };
};

const gridCache = new WeakMap();
const gridFor = (bounds, colliders, clearance) => {
  let byClearance = gridCache.get(colliders);
  if (!byClearance) {
    byClearance = new Map();
    gridCache.set(colliders, byClearance);
  }
  if (!byClearance.has(clearance)) {
    byClearance.set(clearance, createGrid(bounds, colliders, clearance));
  }
  return byClearance.get(clearance);
};

// The free cell nearest a point, searched outward ring by ring.
const nearestFreeCell = (grid, x, z) => {
  const column = clamp(Math.round((x - grid.originX) / CELL), 0, grid.columns - 1);
  const row = clamp(Math.round((z - grid.originZ) / CELL), 0, grid.rows - 1);
  for (let ring = 0; ring < 12; ring += 1) {
    let best = -1;
    let bestDistance = Infinity;
    for (let dr = -ring; dr <= ring; dr += 1) {
      for (let dc = -ring; dc <= ring; dc += 1) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const r = row + dr;
        const c = column + dc;
        if (r < 0 || c < 0 || r >= grid.rows || c >= grid.columns) continue;
        const index = r * grid.columns + c;
        if (grid.blocked[index]) continue;
        const distance = Math.hypot(
          grid.originX + c * CELL - x,
          grid.originZ + r * CELL - z
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
};

// A small binary heap keyed on f-score.
const createHeap = () => {
  const items = [];
  const scores = [];
  const swap = (a, b) => {
    [items[a], items[b]] = [items[b], items[a]];
    [scores[a], scores[b]] = [scores[b], scores[a]];
  };
  return {
    get size() {
      return items.length;
    },
    push(item, score) {
      items.push(item);
      scores.push(score);
      let index = items.length - 1;
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (scores[parent] <= scores[index]) break;
        swap(parent, index);
        index = parent;
      }
    },
    pop() {
      const top = items[0];
      const lastItem = items.pop();
      const lastScore = scores.pop();
      if (items.length) {
        items[0] = lastItem;
        scores[0] = lastScore;
        let index = 0;
        for (;;) {
          const left = index * 2 + 1;
          const right = left + 1;
          let smallest = index;
          if (left < items.length && scores[left] < scores[smallest]) smallest = left;
          if (right < items.length && scores[right] < scores[smallest]) smallest = right;
          if (smallest === index) break;
          swap(smallest, index);
          index = smallest;
        }
      }
      return top;
    },
  };
};

const NEIGHBOURS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// A walkable route between two points on the floor, as a short list of
// corners. A* over a quarter-metre grid, then straightened wherever two
// corners can see each other. Returns null when no route exists.
const findPath = (from, to, layout, options = {}) => {
  const clearance = options.clearance ?? 0.46;
  const { colliders } = layout;
  const grid = gridFor(layout.studio.bounds, colliders, clearance);
  const start = nearestFreeCell(grid, from.x, from.z);
  const goal = nearestFreeCell(grid, to.x, to.z);
  if (start < 0 || goal < 0) return null;

  const total = grid.columns * grid.rows;
  const cost = new Float32Array(total).fill(Infinity);
  const parent = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const goalColumn = goal % grid.columns;
  const goalRow = (goal - goalColumn) / grid.columns;
  const heuristic = (index) => {
    const column = index % grid.columns;
    const row = (index - column) / grid.columns;
    const dc = Math.abs(column - goalColumn);
    const dr = Math.abs(row - goalRow);
    return Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr);
  };

  const open = createHeap();
  cost[start] = 0;
  open.push(start, heuristic(start));

  let found = false;
  while (open.size) {
    const current = open.pop();
    if (closed[current]) continue;
    closed[current] = 1;
    if (current === goal) {
      found = true;
      break;
    }
    const column = current % grid.columns;
    const row = (current - column) / grid.columns;
    for (const [dc, dr, step] of NEIGHBOURS) {
      const c = column + dc;
      const r = row + dr;
      if (c < 0 || r < 0 || c >= grid.columns || r >= grid.rows) continue;
      const next = r * grid.columns + c;
      if (grid.blocked[next] || closed[next]) continue;
      // No squeezing diagonally between two blocked cells.
      if (dc && dr) {
        if (grid.blocked[row * grid.columns + c] || grid.blocked[r * grid.columns + column]) continue;
      }
      const candidate = cost[current] + step;
      if (candidate < cost[next]) {
        cost[next] = candidate;
        parent[next] = current;
        open.push(next, candidate + heuristic(next));
      }
    }
  }
  if (!found) return null;

  const cells = [];
  for (let index = goal; index >= 0; index = parent[index]) cells.push(index);
  cells.reverse();
  const points = cells.map((index) => {
    const column = index % grid.columns;
    const row = (index - column) / grid.columns;
    return { x: grid.originX + column * CELL, z: grid.originZ + row * CELL };
  });
  // The real endpoints replace their snapped cells when they are standable.
  points[0] = { x: from.x, z: from.z };
  points[points.length - 1] = { x: to.x, z: to.z };

  // String-pull: keep a corner only when the corners around it cannot see
  // each other with room to spare.
  const pad = clearance - 0.06;
  const route = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let reach = anchor + 1;
    for (let probe = points.length - 1; probe > anchor + 1; probe -= 1) {
      if (
        !segmentBlocked(
          points[anchor].x, points[anchor].z,
          points[probe].x, points[probe].z,
          colliders, pad
        )
      ) {
        reach = probe;
        break;
      }
    }
    route.push(points[reach]);
    anchor = reach;
  }
  // Already there: still a route, of no length.
  if (route.length < 2) route.push({ x: to.x, z: to.z });
  return route;
};

const pathLength = (points) => {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].z - points[index - 1].z
    );
  }
  return length;
};

// The point a given distance along a route, with the direction of travel.
const pointAlong = (points, distance) => {
  let remaining = Math.max(distance, 0);
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= span || index === points.length - 1) {
      const t = span > 1e-9 ? clamp(remaining / span, 0, 1) : 1;
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        yaw: span > 1e-9 ? yawToward(a.x, a.z, b.x, b.z) : null,
      };
    }
    remaining -= span;
  }
  const last = points[points.length - 1];
  return { x: last.x, z: last.z, yaw: null };
};

// How long a glide along a route should take: quick, but never a lurch.
const glideDuration = (length) => clamp(0.55 + length / 4.4, 0.7, 3.4);

module.exports = {
  CELL,
  WALK,
  clamp,
  easeInOutCubic,
  findPath,
  glideDuration,
  hasLineOfSight,
  isBlocked,
  pathLength,
  pointAlong,
  poseFromView,
  resolveCollisions,
  segmentBlocked,
  segmentHitsBox,
  shortestAngle,
  stepWalker,
  yawToward,
};

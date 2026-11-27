// Open branch fans leave glimpses of the far shore between the near leaves.
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { lathe } from "./furniture";
import { createKit } from "./kit";
import { createRandom } from "./textures";

export function plantTerraceMaples(scene, materials) {
  const kit = createKit();
  const bark = new MeshStandardMaterial({ color: 0x634237, roughness: 0.93 });
  const glaze = new MeshStandardMaterial({ color: 0x52625c, roughness: 0.38 });
  const positions = [], colors = [], indices = [];
  const palette = [0xae4432, 0xce612e, 0xef963e, 0xcb7832, 0x996038, 0xeaba62].map(c => new Color(c));

  function tree(x, z, scale, seed) {
    const random = createRandom(seed);
    const world = (point) => [x + scale * point.x, scale * point.y, z + scale * point.z];
    kit.add(glaze, lathe([[0.01, 0], [0.28, 0], [0.39, 0.13], [0.47, 0.46], [0.48, 0.52], [0.445, 0.52], [0.43, 0.475]]),
      [x, -0.025, z], null, [scale, scale, scale]);
    kit.cylinder(bark, { radius: 0.44 * scale, height: 0.02, segments: 32 }, [x, 0.45 * scale, z]);

    function leaf(point, angle) {
      const base = positions.length / 3;
      const size = (0.081 + random() * 0.055);
      const lean = 0.25 + random() * 1.1;
      const tint = palette[Math.floor(random() * palette.length)];
      positions.push(...world(point));
      colors.push(tint.r, tint.g, tint.b);
      // Five pointed lobes fold down from a raised central vein.
      const rim = [[-0.18,-0.24],[-0.78,-0.19],[-0.44,0.1],[-0.88,0.49],[-0.34,0.38],
        [-0.06,1.05],[0.22,0.39],[0.79,0.62],[0.42,0.1],[0.73,-0.14],[0.15,-0.23]];
      for (const [u,v] of rim) {
        const across = size * u, along = size * v;
        const dx = across * Math.cos(angle) - along * Math.cos(lean) * Math.sin(angle);
        const dz = across * Math.sin(angle) + along * Math.cos(lean) * Math.cos(angle);
        positions.push(...world(new Vector3(point.x + dx, point.y - along * Math.sin(lean) - Math.abs(across) * 0.22, point.z + dz)));
        const light = 0.85 + v * 0.18;
        colors.push(tint.r * light, tint.g * light, tint.b * light);
      }
      for (let i = 0; i < rim.length; i++) indices.push(base, base + 1 + i, base + 1 + (i + 1) % rim.length);
    }

    function branch(start, yaw, length, rise, radius, depth) {
      const end = start.clone().add(new Vector3(Math.cos(yaw) * length, rise, Math.sin(yaw) * length));
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 0.09 * length;
      kit.tube(bark, [world(start), world(mid), world(end)], { radius: radius * scale, segments: 4, radial: 5 });
      if (depth > 0) {
        branch(end, yaw - 0.45 - random() * 0.65, length * 0.72, rise * (0.20 + random() * 0.75), radius * 0.64, depth - 1);
        branch(end, yaw + 0.47 + random() * 0.65, length * 0.64, rise * (0.3 + random() * 0.78), radius * 0.59, depth - 1);
      }
      if (depth <= 2) {
        for (let k = 0; k < 7; k++) {
          const point = start.clone().lerp(end, (k + 1) / 7);
          const angle = yaw + (k % 2 ? 1 : -1) * (0.65 + random() * 0.9);
          leaf(point, angle);
        }
      }
    }

    const foot = new Vector3(0, 0.46, 0);
    const crook = new Vector3(-0.13, 1.12, 0.08);
    const leader = new Vector3(0.07, 2.28, -0.04);
    kit.tube(bark, [world(foot), world(new Vector3(-0.04, 0.86, 0.08)), world(crook)], { radius: 0.06 * scale, segments: 7 });
    kit.tube(bark, [world(crook), world(crook.clone().lerp(leader, 0.5)), world(leader)], { radius: 0.035 * scale, segments: 5 });
    for (let i = 0; i < 7; i++) {
      const fraction = i / 6;
      const origin = crook.clone().lerp(leader, fraction);
      const reach = 0.56 - 0.26 * fraction + 0.1 * random();
      branch(origin, i * 2.4, reach, 0.42 + random() * 0.46, 0.035 - 0.012 * fraction, 4);
    }
  }

  tree(-11.74, -5.83, 1.06, 191);
  tree(2.05, -11.55, 0.94, 427);
  kit.flush(scene);
  const canopy = new BufferGeometry();
  canopy.setAttribute("position", new Float32BufferAttribute(positions, 3));
  canopy.setAttribute("color", new Float32BufferAttribute(colors, 3));
  canopy.setIndex(indices);
  canopy.computeVertexNormals();
  const leaves = new Mesh(canopy, new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.86 }));
  leaves.name = "Terrace maple leaves";
  leaves.castShadow = leaves.receiveShadow = true;
  scene.add(leaves);
}

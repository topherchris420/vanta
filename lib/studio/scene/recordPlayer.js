import {
  BoxGeometry, CatmullRomCurve3, CircleGeometry, CylinderGeometry, DataTexture,
  Group, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PlaneGeometry, RGBAFormat, RingGeometry, SpotLight,
  TubeGeometry, Vector3,
} from "three";
import turntable from "../turntable";
import { lathe } from "./furniture";
import { part } from "./kit";
import { createLabel } from "./textures";

const { DECK } = turntable;
const deckOrigin = [-3.055, 0.70, 6.42];
const yaw = Math.PI / 2;
const top = 0.080;
const playingSurface = 0.117;

// The tangent of an LP groove circles the spindle. The physical shader uses
// that direction to stretch the reflection of the room across the lacquer.
function groovedVinyl() {
  const size = 512;
  const bands = [0.25, 0.31, 0.372, 0.423, 0.474];
  const directions = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5, dy = (y + 0.5) / size - 0.5;
      const r = Math.hypot(dx, dy);
      const at = (y * size + x) * 4;
      directions[at] = 127.5 * (1 - dy / r);
      directions[at + 1] = 127.5 * (1 + dx / r);
      // Narrow spaces between bands give a different reflection at a grazing angle.
      const gap = bands.some(edge => Math.abs(r - edge) < 0.0019);
      directions[at + 2] = gap ? 52 : 215 + 30 * Math.sin(r * 2080) ** 2;
      directions[at + 3] = 255;
    }
  }
  const map = new DataTexture(directions, size, size, RGBAFormat);
  map.generateMipmaps = true;
  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapLinearFilter;
  map.needsUpdate = true;
  return new MeshPhysicalMaterial({
    color: 0x1c1c1c, roughness: 0.39, metalness: 0.16, ior: 1.55,
    anisotropy: 0.94, anisotropyMap: map, clearcoat: 0.22, clearcoatRoughness: 0.19,
  });
}

function recordLabel(ctx, music) {
  const texture = createLabel({
    width: 256, height: 256, fonts: ctx.fonts,
    draw(c, { width, fonts }) {
      c.fillStyle = "#d0c2a0"; c.fillRect(0, 0, width, width);
      c.fillStyle = "#264438"; c.fillRect(0, 159, width, 97);
      c.beginPath(); c.arc(128, 128, 114, 0, Math.PI * 2);
      c.strokeStyle = "#817953"; c.lineWidth = 2; c.stroke();
      c.textAlign = "center"; c.fillStyle = "#25342c";
      c.font = `600 21px ${fonts.display}`; c.fillText(music.title, 128, 89);
      c.font = `13px ${fonts.mono}`; c.fillText((music.credit || "").split(",")[0], 128, 112);
      c.fillStyle = "#f3e9d0"; c.fillText("33 ⅓", 128, 186);
    },
  });
  ctx.labels.push(texture);
  return new MeshStandardMaterial({ map: texture, roughness: 0.9 });
}

export function addRecordPlayer(ctx, music, cover) {
  const { m, kit } = ctx;
  const deck = kit.at(deckOrigin, yaw);
  const [cx, cz] = DECK.spindle;
  const [px, pz] = DECK.pivot;
  for (const x of [-0.20, 0.20]) for (const z of [-0.14, 0.14]) {
    deck.cylinder(m.rubber, { radius: 0.023, height: 0.021, segments: 16 }, [x, 0.011, z]);
  }
  deck.box(m.walnut, [0.494, 0.059, 0.377], [0, 0.050, 0], null, { bevel: 0.009 });
  deck.box(m.aluminium, [0.474, 0.004, 0.357], [0, top, 0], null, { bevel: 0.001 });
  deck.box(m.iron, [0.468, 0.002, 0.351], [0, top + 0.003, 0], null, { bevel: 0 });
  deck.add(m.aluminium, lathe([[0,0.084],[0.148,0.084],[0.155,0.091],[0.158,0.095],
    [0.158,0.101],[0.156,0.105],[0.156,0.11],[0.153,0.112],[0,0.112]], 96), [cx, 0, cz]);
  for (const h of [0.094, 0.102, 0.108]) {
    deck.torus(m.iron, { radius: 0.157, tube: 0.0007, segments: 96, tubeSegments: 4 }, [cx, h, cz], [Math.PI / 2, 0, 0]);
  }
  deck.cylinder(m.rubber, { radius: 0.152, height: 0.0035, segments: 96 }, [cx, 0.1135, cz]);
  const disc = new Group();
  disc.position.set(...deck.place([cx, playingSurface, cz]));
  const side = part(new CylinderGeometry(DECK.radius, DECK.radius, 0.002, 96), m.vinyl, [0,-0.0015,0]);
  const grooves = new Mesh(new RingGeometry(0.046, DECK.radius, 128), groovedVinyl());
  grooves.rotation.x = -Math.PI / 2;
  grooves.receiveShadow = true;
  disc.add(side, grooves);
  const label = new Mesh(new CircleGeometry(0.047, 64), recordLabel(ctx, music));
  label.rotation.x = -Math.PI / 2;
  label.position.y = 0.0004;
  disc.add(label);
  ctx.scene.add(disc);
  deck.add(m.aluminium, lathe([[0.0036,0.115],[0.0036,0.129],[0.002,0.131],[0,0.131]], 16), [cx, 0, cz]);

  // Gimbal, counterweight, bent arm tube and the stylus' actual point of contact.
  deck.add(m.aluminium, lathe([[0,0.084],[0.028,0.084],[0.028,0.090],[0.02,0.094],
    [0.018,0.12],[0.013,0.137],[0,0.139]], 32), [px, 0, pz]);
  const bearing = new Group();
  bearing.position.set(...deck.place([px, 0.153, pz]));
  bearing.rotation.y = yaw;
  const swivel = new Group();
  const arm = new Group();
  bearing.add(swivel); swivel.add(arm); ctx.scene.add(bearing);
  swivel.add(part(new BoxGeometry(0.043,0.012,0.021), m.iron, [0,-0.013,0]));
  for (const sign of [-1, 1]) {
    const cap = part(new CylinderGeometry(0.01,0.01,0.008,20), m.aluminium, [0.018 * sign,0,0]);
    cap.rotation.z = Math.PI / 2; swivel.add(cap);
  }
  const tube = new CatmullRomCurve3([[0,0,-0.052],[0,0,0],[0,0,0.089],
    [-0.012,-0.002,0.14],[-0.015,-0.003,0.17],[0,-0.004,0.204]].map(p=>new Vector3(...p)));
  arm.add(part(new TubeGeometry(tube, 28, 0.0031, 10, false), m.aluminium));
  const weight = part(new CylinderGeometry(0.015,0.015,0.026,32), m.aluminium, [0,0,-0.042]);
  weight.rotation.x = Math.PI / 2; arm.add(weight);
  const dial = part(new CylinderGeometry(0.0156,0.0156,0.007,32), m.rubber, [0,0,-0.03]);
  dial.rotation.x = Math.PI/2; arm.add(dial);
  arm.add(part(new BoxGeometry(0.017,0.005,0.031), m.iron, [0,-0.007,0.211]));
  arm.add(part(new BoxGeometry(0.012,0.012,0.019), m.brassDull, [0,-0.015,0.215]));
  arm.add(part(new BoxGeometry(0.009,0.008,0.012), m.rubber, [0,-0.025,0.22]));
  const needle = part(new CylinderGeometry(0.0011,0.0004,0.009,8), m.aluminium,
    [0,-0.0318,DECK.armLength - 0.0015]);
  needle.rotation.x = -0.33; arm.add(needle);
  swivel.rotation.y = DECK.restYaw;
  arm.rotation.x = DECK.raisedPitch;
  deck.cylinder(m.iron, { radius: 0.007, height: 0.071, segments: 14 }, [px + 0.003, 0.12, 0.041]);
  deck.box(m.rubber, [0.02,0.014,0.012], [px + 0.003,0.16,0.041]);

  // A selector, a brushed start button and a flush cue lever on the top plate.
  deck.cylinder(m.aluminium, { radius: 0.011, height: 0.007, segments: 24 }, [-0.209,0.086,0.145]);
  deck.box(m.ebony, [0.034,0.004,0.012], [0.182,0.085,0.134], null, { bevel: 0.001 });
  deck.box(m.aluminium, [0.008,0.008,0.015], [0.18,0.09,0.134], null, { bevel: 0.001 });
  for (const x of [-0.224,0.224]) for (const z of [-0.162,0.162]) {
    deck.cylinder(m.steel, { radius: 0.0035, height: 0.0015, segments: 10 }, [x,0.0848,z]);
  }
  // Keep the cover and jacket on the same inclined plane. Positive local z
  // is toward the viewer, including when the record is approached from the side.
  const jacket = new Group();
  jacket.position.set(-3.275, 0.86, 5.96);
  jacket.rotation.set(-0.16, yaw, -0.055, "YXZ");
  const size = 0.316;
  jacket.add(part(new BoxGeometry(size, size, 0.006), m.card));
  const print = new Mesh(new PlaneGeometry(size, size), new MeshStandardMaterial({
    map: ctx.loadImage(cover.src), roughness: 0.72,
  }));
  print.position.z = 0.0035; jacket.add(print); ctx.scene.add(jacket);

  // The existing light strip under the sleeve shelf grazes the machinery.
  const light = new SpotLight(0xffe6c7, 2.1, 1.65, 0.91, 0.94, 2);
  light.position.set(-3.12, 1.493, 6.53);
  light.target.position.set(...deck.place([0,0.08,0.03]));
  ctx.scene.add(light, light.target);
  return { disc, swivel, arm };
}

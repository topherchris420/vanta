// The original Pine Gap rig faces +Z; a studio walker at yaw zero faces -Z.
import { BoxGeometry, Euler, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { disposeTree } from "./kit";

const HEIGHT = 1.8542; // 6 ft 1 in
const BIND_HEIGHT = 1.9171886;
const UP = new Vector3(0, 0, 1);

function makeBook() {
  const book = new Group();
  const paper = new MeshStandardMaterial({ color: 0xe8d5af, roughness: 0.95 });
  const cloth = new MeshStandardMaterial({ color: 0x22554b, roughness: 0.82 });
  for (const side of [-1, 1]) {
    const half = new Group();
    half.rotation.y = -side * 0.25;
    const leaves = new Mesh(new BoxGeometry(0.15, 0.21, 0.016), paper);
    leaves.position.set(side * 0.075, 0, -0.01);
    const cover = new Mesh(new BoxGeometry(0.155, 0.218, 0.005), cloth);
    cover.position.x = side * 0.0775;
    half.add(leaves, cover);
    book.add(half);
  }
  return book;
}

export async function loadChrisw() {
  const { scene: figure } = await new GLTFLoader().loadAsync("/models/studio/chrisw.glb");
  figure.name = "Chrisw";
  const bone = (name) => figure.getObjectByName(name);
  const pelvis = bone("Pelvis"), spine = bone("Spine"), head = bone("Head");
  const hipY = pelvis.position.y;
  const legs = ["L", "R"].map((s) => [bone(s + "_Thigh"), bone(s + "_Calf"), bone(s + "_Foot")]);
  const arms = ["L", "R"].map((s, i) => {
    const rest = new Quaternion().setFromAxisAngle(UP, (i ? 1 : -1) * 1.43);
    return { upper: bone(s + "_UpperArm"), lower: bone(s + "_ForeArm"), hand: bone(s + "_Hand"),
      rest, inverse: rest.clone().invert() };
  });
  const book = makeBook();
  const group = new Group();
  group.name = "Chrisw studio avatar";
  group.add(figure, book);
  group.scale.setScalar(HEIGHT / BIND_HEIGHT);
  const skins = new Set();
  figure.traverse((part) => {
    if (!part.isSkinnedMesh) return;
    part.castShadow = part.receiveShadow = true;
    part.frustumCulled = false;
    skins.add(part.skeleton);
  });
  const rotation = new Quaternion(), euler = new Euler();
  const left = new Vector3(), right = new Vector3();
  let phase = 0, heading, stride = 0;
  return {
    group,
    pose({ x, z, yaw, pitch, vx, vz, dt, time, reading, reduced }) {
      const speed = Math.hypot(vx, vz);
      const direction = speed > 0.18 ? Math.atan2(vx, vz) : yaw + Math.PI;
      if (heading === undefined || reading || reduced) heading = direction;
      else heading += Math.atan2(Math.sin(direction - heading), Math.cos(direction - heading)) * (1 - Math.exp(-12 * dt));
      group.position.set(x, 0, z);
      group.rotation.y = heading;
      phase += Math.min(speed, 4.3) * dt * 4.8;
      stride += (Math.min(1, speed / 1.8) - stride) * (1 - Math.exp(-12 * dt));
      const effort = reduced ? 0 : stride;
      const breath = reduced ? 0 : Math.sin(time * 1.6);
      pelvis.position.y = hipY + effort * (0.014 * Math.cos(2 * phase) - 0.016);
      pelvis.rotation.y = 0.07 * effort * Math.sin(phase);
      spine.rotation.set((reading ? 0.1 : 0.035) + breath * 0.008, -pelvis.rotation.y * 1.6, 0);
      head.rotation.set(reading ? 0.44 + breath * 0.012 : -pitch * 0.56, reading ? breath * 0.035 : 0, 0);
      legs.forEach(([thigh, shin, foot], i) => {
        const wave = Math.sin(phase + i * Math.PI);
        const bend = effort * Math.max(0, Math.cos(phase + i * Math.PI)) * 0.78;
        thigh.rotation.x = -0.58 * wave * effort;
        shin.rotation.x = bend;
        foot.rotation.x = -bend * 0.65 + wave * effort * 0.2;
        const arm = arms[i], sign = i === 0 ? 1 : -1;
        const swing = reading ? -0.52 : wave * effort * 0.43;
        const elbow = reading ? -1.03 : -0.18 - effort * (0.12 - wave * 0.1);
        arm.upper.quaternion.setFromEuler(euler.set(swing, reading ? -sign * 0.28 : 0, 0)).multiply(arm.rest);
        rotation.setFromEuler(euler.set(elbow, 0, 0));
        arm.lower.quaternion.copy(arm.inverse).multiply(rotation).multiply(arm.rest);
      });
      book.visible = reading;
      if (reading) {
        group.worldToLocal(arms[0].hand.getWorldPosition(left));
        group.worldToLocal(arms[1].hand.getWorldPosition(right));
        book.position.copy(left).lerp(right, 0.5);
        book.position.y += 0.057;
        book.position.z += 0.045;
        book.rotation.x = 0.55;
      }
    },
    dispose() {
      group.removeFromParent();
      skins.forEach((skin) => skin.dispose());
      disposeTree(group);
    },
  };
}

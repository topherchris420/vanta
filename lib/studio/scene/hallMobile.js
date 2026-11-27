// Four balanced spars carry five enamel forms. Each joint turns about its own
// suspension wire, so the distance between a plate and its hook never changes.
import { ExtrudeGeometry, Group, MeshStandardMaterial, Path, Shape } from "three";
import { createKit } from "./kit";

export function hangHallMobile(scene, materials) {
  const crown = new Group();
  crown.name = "Five-note mobile";
  crown.position.set(-0.35, 3.98, -1.62);
  scene.add(crown);
  const swivels = [];
  function spar(parent, x, drop, left, right, yaw, rate) {
    const kit = createKit();
    kit.cylinder(materials.brassDull, { radius: 0.009, height: drop, segments: 8 }, [x, -drop / 2, 0]);
    kit.flush(parent);
    const joint = new Group();
    joint.position.set(x, -drop, 0);
    parent.add(joint);
    const rod = createKit();
    rod.tube(materials.brass, [[-left, 0, 0], [-left * 0.48, 0.025, 0], [0, 0, 0], [right * 0.55, -0.025, 0], [right, 0, 0]], { radius: 0.012, segments: 20 });
    rod.sphere(materials.brass, { radius: 0.028, segments: 10 }, [0, 0, 0]);
    rod.flush(joint);
    joint.rotation.y = yaw;
    swivels.push({ joint, yaw, rate });
    return joint;
  }

  const enamel = (color) => new MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.12, emissive: color, emissiveIntensity: 0.16 });
  function plate(parent, x, drop, width, height, tilt, color, form) {
    const kit = createKit();
    kit.cylinder(materials.brass, { radius: 0.008, height: drop, segments: 8 }, [x, -drop / 2, 0]);
    const outline = new Shape();
    outline.moveTo(0, 0);
    if (form === "crescent") {
      outline.bezierCurveTo(-0.84, -0.04, -0.87, -1.13, 0.42, -0.86);
      outline.bezierCurveTo(-0.18, -0.74, -0.28, -0.21, 0, 0);
    } else if (form === "reed") {
      outline.bezierCurveTo(0.13, -0.29, 0.43, -0.62, 0.32, -1.08);
      outline.bezierCurveTo(-0.32, -0.66, -0.26, -0.27, 0, 0);
    } else if (form === "sail") {
      outline.quadraticCurveTo(-0.16, -0.46, -0.57, -0.83);
      outline.quadraticCurveTo(-0.05, -0.96, 0.52, -0.64);
      outline.quadraticCurveTo(0.27, -0.23, 0, 0);
    } else {
      outline.bezierCurveTo(0.39, 0.01, 0.62, -0.37, 0.52, -0.68);
      outline.bezierCurveTo(0.40, -1.07, -0.35, -1.11, -0.50, -0.72);
      outline.bezierCurveTo(-0.62, -0.43, -0.37, -0.02, 0, 0);
      if (form === "eye") {
        const eye = new Path();
        eye.absellipse(0.06, -0.53, 0.23, 0.19, 0, Math.PI * 2, true, -0.25);
        outline.holes.push(eye);
      }
    }
    const body = new ExtrudeGeometry(outline, { depth: 0.013, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.007, bevelSegments: 2, curveSegments: 12 });
    kit.add(enamel(color), body, [x, -drop, 0], [0.12, 0, tilt], [width, height, 1]);
    kit.flush(parent);
  }

  const top = spar(crown, 0, 0.39, 0.84, 0.72, -0.2, 0.11);
  const west = spar(top, -0.84, 0.23, 0.44, 0.36, 0.72, 0.15);
  const east = spar(top, 0.72, 0.32, 0.54, 0.48, -0.42, 0.09);
  const low = spar(east, 0.48, 0.27, 0.27, 0.32, 0.95, 0.18);
  plate(west, -0.44, 0.09, 0.38, 0.38, -0.48, 0xc65a36, "crescent");
  plate(west, 0.36, 0.16, 0.30, 0.44, 0.24, 0xe1b867, "eye");
  plate(east, -0.54, 0.16, 0.37, 0.48, 0.48, 0x2e766f, "sail");
  plate(low, -0.27, 0.08, 0.27, 0.35, -0.35, 0xf0dbba, "reed");
  plate(low, 0.32, 0.12, 0.25, 0.32, 0.4, 0x465c72, "disc");

  return (time) => {
    for (const { joint, yaw, rate } of swivels) joint.rotation.y = yaw + 0.26 * Math.sin(time * rate);
  };
}

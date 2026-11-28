// A two-axis wall plotter. The nib and the printed line use the same paper coordinates.
import { BoxGeometry, CylinderGeometry, Group, LinearMipmapLinearFilter, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { composePrint, drawInk, PAPER, preparePaper } from "../chordPrint";
import { part } from "./kit";
import { createScreen } from "./screens";

export function buildChordPress({ kit, m, practice, scene }) {
  const origin = [-3.28, 1.83, -0.4];
  const yaw = Math.PI / 2;
  const mount = kit.at(origin, yaw);
  const width = 0.83;
  const height = width * PAPER.height / PAPER.width;
  mount.box(m.walnut, [1.03, 1.28, 0.12], [0, 0, 0]);
  mount.box(m.feltDark, [0.99, 1.24, 0.023], [0, 0, 0.064]);
  for (const side of [-1, 1]) {
    mount.cylinder(m.brassDull, { radius: 0.008, height: 1.14, segments: 12 }, [side * 0.46, 0, 0.115]);
    for (const end of [-1, 1]) {
      mount.box(m.iron, [0.048, 0.063, 0.065], [side * 0.46, end * 0.56, 0.096]);
      mount.box(m.brass, [0.019, 0.012, 0.006], [side * 0.46, end * 0.56, 0.133]);
    }
    mount.box(m.brassDull, [0.89, 0.011, 0.014], [0, side * 0.583, 0.079]);
  }

  const plotter = new Group();
  plotter.position.set(...origin);
  plotter.rotation.y = yaw;
  scene.add(plotter);
  const sheet = createScreen(PAPER.width, PAPER.height);
  sheet.texture.generateMipmaps = true;
  sheet.texture.minFilter = LinearMipmapLinearFilter;
  const paper = new Mesh(new PlaneGeometry(width, height), new MeshStandardMaterial({
    map: sheet.texture, emissiveMap: sheet.texture, emissive: 0xffffff, emissiveIntensity: 0.24, roughness: 0.96,
  }));
  paper.name = "Chord Press paper";
  paper.position.z = 0.078;
  plotter.add(paper);

  const carriage = new Group();
  const nib = new Group();
  nib.name = "Chord Press nib";
  carriage.add(part(new BoxGeometry(0.93, 0.004, 0.006), m.aluminium, [0, 0, 0.123]));
  for (const side of [-1, 1]) {
    carriage.add(part(new BoxGeometry(0.034, 0.055, 0.032), m.iron, [side * 0.46, 0, 0.128]));
  }
  const barrel = part(new CylinderGeometry(0.013, 0.016, 0.062, 12), m.brass, [0, 0, 0.131]);
  const tip = part(new CylinderGeometry(0.013, 0.001, 0.022, 12), m.ebony, [0, 0, 0.09]);
  barrel.rotation.x = tip.rotation.x = Math.PI / 2;
  nib.add(barrel, tip);
  carriage.add(nib);
  plotter.add(carriage);

  let study;
  let progress = 1;
  let elapsed = 0;
  const park = () => {
    nib.position.x = -0.44;
    carriage.position.y = 0.544;
  };
  const advance = (end) => {
    const point = drawInk(sheet.context, study, progress, end);
    if (point) {
      nib.position.x = width * (point[0] / PAPER.width - 0.5);
      carriage.position.y = height * (0.5 - point[1] / PAPER.height);
    }
    progress = end;
    if (end === 1) park();
    sheet.texture.needsUpdate = true;
  };
  return {
    start(ids, animate) {
      study = composePrint(practice.channels, ids);
      preparePaper(sheet.context, study);
      progress = elapsed = 0;
      park();
      if (animate) sheet.texture.needsUpdate = true;
      else advance(1);
    },
    step(dt, reducedMotion) {
      if (!study || progress === 1) return false;
      elapsed += dt;
      if (!reducedMotion && elapsed < 1 / 20) return false;
      advance(reducedMotion ? 1 : Math.min(1, progress + elapsed / (1.5 + 0.48 * study.voices.length)));
      elapsed = 0;
      return true;
    },
  };
}

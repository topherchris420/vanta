// One texture sheet for an entire case of books. The UVs distinguish the
// cloth boards, gilt spine and cut edges of the paper on a twelve-triangle book.
import { BoxGeometry, MeshStandardMaterial } from "three";
import { createCanvas, createRandom, finish } from "./textures";

const CLOTH = ["#674038", "#384a42", "#37434d", "#907246", "#62615a", "#b5aa92", "#363435", "#66534e"];
const CELL = 128;
const ROWS = 3;

export function createBindings(anisotropy) {
  const canvas = createCanvas(CELL * CLOTH.length, CELL * ROWS);
  const c = canvas.getContext("2d");
  const random = createRandom(915);
  CLOTH.forEach((color, i) => {
    c.save();
    c.translate(i * CELL, 0);
    // Spine and both outside boards.
    c.fillStyle = color;
    c.fillRect(0, 0, CELL, 2 * CELL);
    for (let t = 0; t < 3800; t++) {
      c.fillStyle = random() > 0.5 ? "rgba(255,241,208,.06)" : "rgba(31,23,17,.07)";
      c.fillRect(random() * CELL, random() * CELL * 2, 1, 2);
    }
    const crown = c.createLinearGradient(0, 0, CELL, 0);
    for (const [t, shade] of [[0,"#0006"],[0.16,"#0000"],[0.48,"#fff1"],[0.87,"#0000"],[1,"#0005"]]) crown.addColorStop(t, shade);
    c.fillStyle = crown;
    c.fillRect(0, 0, CELL, CELL);
    c.fillStyle = i % 3 === 0 ? "#b39d71" : "#d6c9aa";
    for (const y of (i % 2 ? [12, 15, 103] : [17, 20, 88, 111])) c.fillRect(9, y, CELL - 18, 1.1);
    if (i % 3 !== 2) {
      c.strokeStyle = c.fillStyle;
      c.lineWidth = 1.3;
      c.strokeRect(23, 32, CELL - 46, 27);
    }
    // Tight gutter at the hinge of the outside board.
    c.fillStyle = "rgba(0,0,0,.17)";
    c.fillRect(6, CELL + 1, 2, CELL - 2);
    c.fillRect(CELL - 8, CELL + 1, 2, CELL - 2);
    // Head, tail and fore-edge. Page lines run across the book's thickness.
    c.fillStyle = color;
    c.fillRect(0, 2 * CELL, CELL, CELL);
    c.fillStyle = ["#c9bda2","#d8cdb4","#c5b89a"][i % 3];
    c.fillRect(6, 2 * CELL + 2, CELL - 12, CELL - 4);
    for (let x = 7; x < CELL - 6; x += 1 + random() * 3) {
      c.fillStyle = `rgba(86,64,38,${0.06 + 0.18 * random()})`;
      c.fillRect(x, 2 * CELL + 2, 1, CELL - 4);
    }
    c.restore();
  });
  return new MeshStandardMaterial({ map: finish(canvas, { repeat: false, anisotropy }), roughness: 0.86 });
}

export function boundBook(width, height, depth, edition) {
  const geometry = new BoxGeometry(width, height, depth);
  const { uv, normal } = geometry.attributes;
  for (let i = 0; i < uv.count; i++) {
    const row = normal.getZ(i) > 0.5 ? 0 : Math.abs(normal.getX(i)) > 0.5 ? 1 : 2;
    const u = (2 + uv.getX(i) * (CELL - 4)) / CELL;
    const v = (2 + uv.getY(i) * (CELL - 4)) / CELL;
    uv.setXY(i, (edition + u) / CLOTH.length, (ROWS - 1 - row + v) / ROWS);
  }
  return geometry;
}

export const bindingCount = CLOTH.length;

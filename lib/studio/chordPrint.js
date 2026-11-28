// Coordinates are in paper units, independent of display and export resolution.
export const PAPER = { width: 800, height: 1000 };
const TAU = Math.PI * 2;
export const INKS = {
  music: "#8e402d", writing: "#14675e", instruments: "#aa7432",
  worlds: "#354a69", art: "#76465c",
};
const SAMPLES = 2304;

export function composePrint(channels, ids) {
  const voices = channels.filter(c => ids.includes(c.id)).sort((a, b) => a.frequency - b.frequency);
  const edition = channels.reduce((mask, c, i) => mask + (ids.includes(c.id) ? 2 ** i : 0), 0);
  // Transpose the frequencies into a register in which each note produces
  // a visible number of lobes. This is a graphic interpretation of the notes.
  const strokes = voices.map((voice, index) => {
    const lobes = Math.round(voice.frequency / 48);
    const ring = voices.length === 1 ? 0.58 : index / (voices.length - 1);
    const points = new Float32Array((SAMPLES + 1) * 2);
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      const angle = TAU * 15 * u;
      const phase = angle + index * 0.37;
      const fan = Math.cos(lobes * phase + 2.6 * u);
      const sweep = Math.sin((lobes - 1) * phase - 1.9 * u);
      const radius = 115 + 101 * ring + (49 + 24 * ring) * fan + 34 * sweep + 17 * u;
      points[2 * i] = 400 + radius * Math.cos(angle);
      points[2 * i + 1] = 487 + radius * Math.sin(angle);
    }
    return { ink: INKS[voice.id], points };
  });
  return { voices, strokes, edition: edition.toString(16).toUpperCase().padStart(2, "0") };
}

export function preparePaper(ctx, study) {
  const { width, height } = PAPER;
  const paper = ctx.createLinearGradient(0, 0, width, height);
  paper.addColorStop(0, "#fff6df");
  paper.addColorStop(0.49, "#f7ecd2");
  paper.addColorStop(1, "#eadebd");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#544b3a";
  ctx.lineWidth = 1;
  ctx.strokeRect(29, 29, width - 58, height - 58);
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.beginPath();
  ctx.moveTo(64, 145); ctx.lineTo(736, 145);
  ctx.moveTo(64, 837); ctx.lineTo(736, 837);
  ctx.stroke();
  ctx.fillStyle = "#343c33";
  ctx.textAlign = "left";
  ctx.font = "20px monospace";
  ctx.fillText("VANTA   /   STUDIO IMPRESSIONS", 64, 81);
  ctx.font = "italic 41px Georgia, serif";
  ctx.fillText("Study for " + ["silence", "one voice", "two voices", "three voices", "four voices", "five voices"][study.voices.length], 62, 126);
  ctx.font = "20px monospace";
  ctx.textAlign = "right";
  ctx.fillText("V–" + study.edition, 736, 120);
  ctx.strokeStyle = "#b2a17f";
  ctx.beginPath();
  for (let i = 0; i < 72; i++) {
    const a = TAU * i / 72;
    const r = i % 6 ? 313 : 308;
    ctx.moveTo(400 + r * Math.cos(a), 487 + r * Math.sin(a));
    ctx.lineTo(400 + 317 * Math.cos(a), 487 + 317 * Math.sin(a));
  }
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "34px Georgia, serif";
  ctx.fillText(study.voices.map(c => c.note).join("  ·  "), 64, 897);
  ctx.font = "18px monospace";
  ctx.fillText("CHRISTOPHER WOODYARD", 64, 945);
  ctx.textAlign = "right";
  ctx.fillText("THE CHORD PRESS", 735, 945);
  study.strokes.forEach(({ ink }, i) => {
    ctx.fillStyle = ink;
    ctx.fillRect(736 - (study.strokes.length - i) * 22, 872, 16, 21);
  });
}

// Append ink to the existing sheet. The last plotted point locates the nib.
export function drawInk(ctx, study, start, end) {
  const count = study.strokes.length;
  let tip = null;
  for (let i = 0; i < count; i++) {
    const first = Math.max(0, Math.floor((start * count - i) * SAMPLES));
    const last = Math.min(SAMPLES, Math.floor((end * count - i) * SAMPLES));
    if (last <= first) continue;
    const { ink, points } = study.strokes[i];
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[first * 2], points[first * 2 + 1]);
    for (let k = first + 1; k <= last; k++) ctx.lineTo(points[k * 2], points[k * 2 + 1]);
    ctx.stroke();
    tip = [points[last * 2], points[last * 2 + 1]];
  }
  return tip;
}

export function saveChordPrint(channels, ids) {
  const study = composePrint(channels, ids);
  const canvas = document.createElement("canvas");
  canvas.width = PAPER.width * 2;
  canvas.height = PAPER.height * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  preparePaper(ctx, study);
  drawInk(ctx, study, 0, 1);
  const link = document.createElement("a");
  link.download = "Vanta-Chord-Press-" + study.edition + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

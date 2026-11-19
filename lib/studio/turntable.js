// Local deck coordinates in metres. Zero yaw points toward the front edge.
const DECK = {
  spindle: [-0.066, 0.002],
  pivot: [0.156, -0.103],
  armLength: 0.224,
  radius: 0.15,
  leadIn: 0.141,
  runOut: 0.064,
  pitchPerTurn: 0.00014,
  restYaw: 0.025,
  raisedPitch: -0.075,
};

function grooveAt(seconds) {
  const revolutions = Math.max(0, Number.isFinite(seconds) ? seconds : 0) * (100 / 3) / 60;
  const radius = Math.max(DECK.runOut, DECK.leadIn - revolutions * DECK.pitchPerTurn);
  const dx = DECK.spindle[0] - DECK.pivot[0];
  const dz = DECK.spindle[1] - DECK.pivot[1];
  const distance = Math.hypot(dx, dz);
  const cosine = (distance ** 2 + DECK.armLength ** 2 - radius ** 2) / (2 * distance * DECK.armLength);
  return {
    yaw: Math.atan2(dx, dz) + Math.acos(Math.max(-1, Math.min(1, cosine))),
    rotation: -(revolutions % 1) * Math.PI * 2,
  };
}

module.exports = { DECK, grooveAt };

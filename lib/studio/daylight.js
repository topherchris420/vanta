// Shared by the live scene and the offline daylight bake.
const panoramaYaw = -Math.PI / 10;
const sunAzimuth = Math.PI / 2 - 2 * Math.PI * 0.5996 + panoramaYaw;
const sunElevation = 8.44 * Math.PI / 180;
const sunDirection = [
  Math.sin(sunAzimuth) * Math.cos(sunElevation),
  Math.sin(sunElevation),
  Math.cos(sunAzimuth) * Math.cos(sunElevation),
];

const WINDOWS = [
  { wall: "north", span: [-3.3, -1.25], rise: [0, 3.86] },
  { wall: "north", span: [1.25, 3.3], rise: [0, 3.86] },
  { wall: "west", span: [-6.55, -5.05], rise: [0, 3.86] },
  { wall: "west", span: [-3.45, -1.7], rise: [0, 3.86] },
  { wall: "west", span: [3.1, 5.9], rise: [0.95, 3.7] },
];

const daylightGrid = { resolution: [21, 5, 19], inset: 0.18 };
module.exports = { WINDOWS, daylightGrid, panoramaYaw, sunDirection };

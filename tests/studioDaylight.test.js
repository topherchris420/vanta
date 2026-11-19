const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { DataUtils } = require("three");
const { daylightGrid } = require("../lib/studio/daylight");
const { STUDIO } = require("../lib/studio/layout");

test("the shipped daylight field is finite, padded for filtering, and brighter at the west glazing", () => {
  const data = readFileSync(path.join(__dirname, "../public/materials/studio/daylight.bin"));
  const [nx, ny, nz] = daylightGrid.resolution;
  const sliceBytes = nx * ny * 4 * 2;
  assert.equal(data.length, 7 * (nz + 2) * sliceBytes);
  for (let i = 0; i < data.length; i += 2) {
    assert.ok(Number.isFinite(DataUtils.fromHalfFloat(data.readUInt16LE(i))));
  }
  const slice = (n) => data.subarray(n * sliceBytes, (n + 1) * sliceBytes);
  for (let slab = 0; slab < 7; slab++) {
    const first = slab * (nz + 2);
    assert.deepEqual(slice(first), slice(first + 1));
    assert.deepEqual(slice(first + nz), slice(first + nz + 1));
  }

  const gridIndex = (value, lo, hi, count) =>
    Math.round((value - lo - daylightGrid.inset) * (count - 1) / (hi - lo - 2 * daylightGrid.inset));
  const ambientRed = (worldX, worldZ) => {
    const x = gridIndex(worldX, ...STUDIO.bounds.x, nx);
    const y = gridIndex(2, 0, STUDIO.height, ny);
    const z = gridIndex(worldZ, ...STUDIO.bounds.z, nz);
    return DataUtils.fromHalfFloat(data.readUInt16LE((z + 1) * sliceBytes + (y * nx + x) * 8));
  };
  assert.ok(ambientRed(-9.2, -5.7) > 2 * ambientRed(0, 0));
  assert.ok(ambientRed(0, 0) > ambientRed(8.7, -5.7));
});

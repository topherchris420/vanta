// The fixed shell's diffuse daylight is sampled in world space, so a chair
// close to the glass receives different light on its back and on its seat.
import { Data3DTexture, HalfFloatType, LinearFilter, RGBAFormat } from "three";
import { LightProbeGrid } from "three/examples/jsm/lighting/LightProbeGrid.js";
import daylight from "../daylight";

export function createDaylightVolume(studio, surfaces, onReady) {
  const { resolution, inset } = daylight.daylightGrid;
  const [nx, ny, nz] = resolution;
  const { x, z } = studio.bounds;
  const grid = new LightProbeGrid(x[1] - x[0] - 2*inset, studio.height - 2*inset, z[1] - z[0] - 2*inset, nx, ny, nz);
  grid.position.set((x[0]+x[1])/2, studio.height/2, (z[0]+z[1])/2);
  grid.updateBoundingBox();

  // Three packs nine RGB spherical harmonics into seven padded RGBA slabs.
  const layers = (nz + 2) * 7;
  const length = nx * ny * layers * 4;
  const texture = new Data3DTexture(new Uint16Array(length), nx, ny, layers);
  texture.type = HalfFloatType;
  texture.format = RGBAFormat;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  grid.texture = texture;
  surfaces.binary("daylight.bin", (buffer) => {
    if (buffer.byteLength !== length * 2) return;
    texture.image.data = new Uint16Array(buffer);
    texture.needsUpdate = true;
    onReady();
  });
  return grid;
}

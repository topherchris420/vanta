// Keep the room drawable while its local photographic maps decode. Images
// share one texture per surface channel, including across material variants.
import { CanvasTexture, FileLoader, ImageLoader, LoadingManager, RepeatWrapping, SRGBColorSpace } from "three";

export function createSurfaceLibrary(anisotropy, { onChange, onReady }) {
  const manager = new LoadingManager();
  const loader = new ImageLoader(manager);
  const textures = new Map();
  let disposed = false;
  manager.onLoad = () => { if (!disposed) onReady(); };

  function load(name, fallback, { color = false, tile = true } = {}) {
    if (textures.has(name)) return textures.get(name);
    const swatch = document.createElement("canvas");
    swatch.width = swatch.height = 1;
    const context = swatch.getContext("2d");
    context.fillStyle = fallback;
    context.fillRect(0, 0, 1, 1);
    const texture = new CanvasTexture(swatch);
    texture.name = name;
    if (color) texture.colorSpace = SRGBColorSpace;
    if (tile) texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = anisotropy;
    textures.set(name, texture);
    loader.load(`/materials/studio/${name}.webp`, (image) => {
      if (disposed) return;
      texture.dispose();
      texture.image = image;
      texture.needsUpdate = true;
      onChange();
    });
    return texture;
  }

  return {
    color: (name, fallback, tile = true) => load(name, fallback, { color: true, tile }),
    normal: (name) => load(name, "#8080ff"),
    roughness: (name) => load(name, "#b0b0b0"),
    binary(name, onLoad) {
      new FileLoader(manager).setResponseType("arraybuffer").load(`/materials/studio/${name}`, (data) => {
        if (!disposed) { onLoad(data); onChange(); }
      });
    },
    dispose() {
      disposed = true;
      textures.forEach((texture) => texture.dispose());
      textures.clear();
    },
  };
}

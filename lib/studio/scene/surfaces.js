// Keep the room drawable while its local photographic maps decode. Images
// share one texture per surface channel, including across material variants.
import { CanvasTexture, FileLoader, ImageLoader, LoadingManager, RepeatWrapping, SRGBColorSpace } from "three";

export function createSurfaceLibrary(anisotropy, { onChange, onReady }) {
  const manager = new LoadingManager();
  const loader = new ImageLoader(manager);
  const textures = new Map();
  const images = new Map();
  let disposed = false;
  manager.onLoad = () => { if (!disposed) onReady(); };

  function load(name, fallback, { color = false, tile = true, channel = 0 } = {}) {
    const key = `${name}:${channel}`;
    if (textures.has(key)) return textures.get(key);
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
    texture.channel = channel;
    textures.set(key, texture);
    const record = images.get(name);
    if (record) {
      record.textures.push(texture);
      if (record.image) {
        texture.image = record.image;
        texture.needsUpdate = true;
      }
    } else {
      const entry = { textures: [texture], image: null };
      images.set(name, entry);
      loader.load(`/materials/studio/${name}.webp`, (image) => {
        if (disposed) return;
        entry.image = image;
        for (const variant of entry.textures) {
          variant.dispose();
          variant.image = image;
          variant.needsUpdate = true;
        }
        onChange();
      });
    }
    return texture;
  }

  return {
    color: (name, fallback, tile = true) => load(name, fallback, { color: true, tile }),
    normal: (name, channel = 0) => load(name, "#8080ff", { channel }),
    occlusion: (name) => load(name, "#ffffff", { channel: 1, tile: false }),
    height: (name) => load(name, "#808080", { tile: false }),
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
      images.clear();
    },
  };
}

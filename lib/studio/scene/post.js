// The last stage of the picture: contact shadows, glow, and the film curve.
//
// Rendered into a multisampled floating-point buffer, the scene then gets
// ground-truth ambient occlusion (so things sit in the room instead of on
// it), bloom on whatever is brighter than paper (lamps, LED strips, screens,
// the archive), and one tone-mapping pass for everything. The Light tier skips
// all of it and renders straight to the screen.
import { HalfFloatType, Vector2, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const BLOOM = { strength: 0.3, radius: 0.6, threshold: 1.0 };

// Light is not a surface. Anything drawn additively or through alpha (shafts,
// glows, glass, the archive's platter and lensing) must not occlude.
const occludes = (object) => {
  if (object.userData.noOcclusion) return false;
  if (object.isSprite) return false;
  if (!object.isMesh) return true;
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  return !(material && (material.transparent || material.userData?.noOcclusion));
};

export const createPost = ({ renderer, scene, camera, tier }) => {
  if (tier.post === "none") return null;

  const size = renderer.getDrawingBufferSize(new Vector2());
  const target = new WebGLRenderTarget(size.x, size.y, {
    type: HalfFloatType,
    samples: tier.samples,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  let occlusion = null;
  if (tier.post === "full") {
    occlusion = new GTAOPass(scene, camera, size.x, size.y);
    occlusion.blendIntensity = 0.9;
    occlusion.updateGtaoMaterial({
      radius: 0.55,
      distanceExponent: 1.3,
      thickness: 1.2,
      scale: 1.15,
      samples: 12,
      distanceFallOff: 1,
    });
    occlusion.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 10, rings: 2, samples: 12 });
    const hide = occlusion._overrideVisibility.bind(occlusion);
    occlusion._overrideVisibility = () => {
      hide();
      scene.traverse((object) => {
        if (object.visible && (object.isMesh || object.isSprite) && !occludes(object)) {
          object.visible = false;
          occlusion._visibilityCache.push(object);
        }
      });
    };
    composer.addPass(occlusion);
  }

  const bloom = new UnrealBloomPass(new Vector2(size.x, size.y), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    composer,
    render: () => composer.render(),
    setSize(width, height, pixelRatio) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
    },
    dispose() {
      occlusion?.dispose();
      bloom.dispose();
      composer.dispose();
      target.dispose();
    },
  };
};

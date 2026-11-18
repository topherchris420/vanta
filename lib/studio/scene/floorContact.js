// Photograph the undersides of the actual furniture once. A low leg blocks
// more ambient light than a high tabletop. The floor and rugs sample the
// same softened contact field in world space, including on the Light tier.
import {
  Color, DoubleSide, Float32BufferAttribute, OrthographicCamera,
  ShaderMaterial, Vector2, Vector3, WebGLRenderTarget,
} from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

export function bakeFloorContact(renderer, scene, bounds, resolution) {
  const width = bounds.x[1] - bounds.x[0];
  const depth = bounds.z[1] - bounds.z[0];
  const camera = new OrthographicCamera(-width / 2, width / 2, depth / 2, -depth / 2, 0.001, 1.5);
  camera.position.set((bounds.x[0] + bounds.x[1]) / 2, 0.018, (bounds.z[0] + bounds.z[1]) / 2);
  camera.up.set(0, 0, 1);
  camera.lookAt(camera.position.x, 1, camera.position.z);

  const heightMaterial = new ShaderMaterial({
    side: DoubleSide,
    vertexShader: `
      varying float height;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        height = world.y;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      varying float height;
      void main() {
        float visibility = 1.0 - 0.85 * exp(-2.8 * max(height, 0.0));
        gl_FragColor = vec4(vec3(visibility), 1.0);
      }`,
  });
  const target = new WebGLRenderTarget(resolution, resolution);
  const scratch = new WebGLRenderTarget(resolution, resolution, { depthBuffer: false });
  const blur = new ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { source: { value: target.texture }, stepUv: { value: new Vector2() } },
    vertexShader: 'varying vec2 p; void main() { p = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      varying vec2 p;
      uniform sampler2D source;
      uniform vec2 stepUv;
      void main() {
        vec4 c = texture2D(source, p) * 0.22703;
        c += (texture2D(source, p + 1.38462 * stepUv) + texture2D(source, p - 1.38462 * stepUv)) * 0.31622;
        c += (texture2D(source, p + 3.23077 * stepUv) + texture2D(source, p - 3.23077 * stepUv)) * 0.07027;
        gl_FragColor = c;
      }`,
  });
  const quad = new FullScreenQuad(blur);
  const receivers = [];
  const hidden = [];
  const previousTarget = renderer.getRenderTarget();
  const previousMaterial = scene.overrideMaterial;
  const background = scene.background;
  const clearColor = renderer.getClearColor(new Color());
  const clearAlpha = renderer.getClearAlpha();
  const shadows = renderer.shadowMap.enabled;
  try {
    scene.updateMatrixWorld(true);
    scene.traverse((object) => {
      if (object.material?.userData?.floorContact) receivers.push(object);
      if (!object.visible || !(object.isMesh || object.isSprite || object.isLine || object.isPoints)) return;
      if (!object.castShadow || object.material?.transparent || object.material?.userData?.floorContact) {
        hidden.push(object);
        object.visible = false;
      }
    });
    renderer.shadowMap.enabled = false;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0xffffff, 1);
    scene.background = null;
    scene.overrideMaterial = heightMaterial;
    renderer.render(scene, camera);
    renderer.setRenderTarget(scratch);
    blur.uniforms.stepUv.value.set(0.055 / width, 0);
    quad.render(renderer);
    renderer.setRenderTarget(target);
    blur.uniforms.source.value = scratch.texture;
    blur.uniforms.stepUv.value.set(0, 0.055 / depth);
    quad.render(renderer);

    target.texture.channel = 1;
    const point = new Vector3();
    for (const receiver of receivers) {
      const { position } = receiver.geometry.attributes;
      const coords = new Float32Array(position.count * 2);
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(receiver.matrixWorld);
        coords[2 * i] = (point.x - bounds.x[0]) / width;
        coords[2 * i + 1] = (point.z - bounds.z[0]) / depth;
      }
      receiver.geometry.setAttribute("uv1", new Float32BufferAttribute(coords, 2));
      receiver.material.aoMap = target.texture;
    }
    return target;
  } catch (error) {
    target.dispose();
    throw error;
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.shadowMap.enabled = shadows;
    scene.overrideMaterial = previousMaterial;
    scene.background = background;
    hidden.forEach((object) => { object.visible = true; });
    heightMaterial.dispose();
    blur.dispose();
    quad.dispose();
    scratch.dispose();
  }
}

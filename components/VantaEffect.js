import { useEffect, useRef } from "react";
import { Camera, Scene, PlaneGeometry, Vector2, ShaderMaterial, Mesh, WebGLRenderer } from "three";

// Simple debounce utility to limit the rate of execution
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.05;

    float r = length(uv);
    float rippleA = sin(24.0 * r - t * 6.0);
    float rippleB = sin(36.0 * r - t * 7.5 + 0.8);
    float rippleC = sin(48.0 * r - t * 9.0 + 1.6);

    float rings = 0.42 + 0.22 * rippleA + 0.18 * rippleB + 0.14 * rippleC;
    float glow = 0.065 / max(0.012, abs(fract((r - t * 0.12) * 8.0) - 0.5));
    float vignette = smoothstep(1.25, 0.15, r);

    vec3 deep = vec3(0.01, 0.03, 0.12);
    vec3 cyan = vec3(0.08, 0.68, 0.95);
    vec3 magenta = vec3(0.70, 0.28, 0.95);

    vec3 gradient = mix(cyan, magenta, 0.5 + 0.5 * sin(t * 0.6 + r * 10.0));
    vec3 color = mix(deep, gradient, rings * vignette + glow * 0.25);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const VantaEffect = ({ className }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const camera = new Camera();
    camera.position.z = 1;

    const scene = new Scene();
    const geometry = new PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new Vector2() },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };

    // Debounce the resize event to improve performance
    const debouncedResize = debounce(onWindowResize, 200);

    onWindowResize();
    window.addEventListener("resize", debouncedResize);

    let animationId = 0;

    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    };

    sceneRef.current = { renderer, geometry, material, animationId };
    animate();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.cancelAnimationFrame(animationId);

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};

export default VantaEffect;

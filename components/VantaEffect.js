import { useEffect, useRef } from "react";
import {
  Camera,
  Scene,
  PlaneGeometry,
  Vector2,
  ShaderMaterial,
  Mesh,
  WebGLRenderer,
} from "three";

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
  precision mediump float;
  uniform vec2 resolution;
  uniform float time;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.04;
    float r = length(uv);

    float wave1 = sin(34.0 * r - t * 8.0);
    float wave2 = sin(52.0 * r - t * 10.0 + 1.4);
    float wave3 = sin(72.0 * r - t * 12.0 + 2.2);

    float rings = 0.55 + 0.28 * wave1 + 0.22 * wave2 + 0.15 * wave3;

    float pulse = 0.5 + 0.5 * sin(t * 2.6 - r * 30.0);
    float halo = 0.15 / max(0.025, abs(fract((r - t * 0.22) * 14.0) - 0.5));
    float fade = smoothstep(1.4, 0.0, r);

    vec3 deepBlue = vec3(0.02, 0.05, 0.16);
    vec3 cyan = vec3(0.12, 0.86, 1.00);
    vec3 violet = vec3(0.70, 0.38, 1.00);
    vec3 pink = vec3(1.00, 0.42, 0.78);

    vec3 sweep = mix(cyan, violet, 0.5 + 0.5 * sin(t * 0.9 + r * 12.0));
    vec3 sweep2 = mix(sweep, pink, 0.5 + 0.5 * cos(t * 0.7 - r * 9.0));

    float intensity = clamp(rings * 0.72 + pulse * 0.35 + halo * 0.45, 0.0, 1.2);
    vec3 color = mix(deepBlue, sweep2, intensity) * fade + sweep2 * 0.06;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const VantaEffect = ({ className, ...props }) => {
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

    let renderer;

    try {
      // Disable antialiasing for performance as we render a full-screen quad
      renderer = new WebGLRenderer({ antialias: false, alpha: false });
    } catch (error) {
      console.warn("Unable to initialize the animated WebGL background.", error);
      geometry.dispose();
      material.dispose();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);

    container.appendChild(renderer.domElement);

    // Reduced motion support
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let isReduced = mediaQuery?.matches ?? false;

    const handleMotionChange = (e) => {
      isReduced = e.matches;
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", handleMotionChange);
    } else if (mediaQuery?.addListener) {
      mediaQuery.addListener(handleMotionChange);
    }

    let animationId = 0;
    let hasRenderError = false;

    const safeRender = () => {
      if (hasRenderError) {
        return;
      }

      try {
        renderer.render(scene, camera);
      } catch (error) {
        hasRenderError = true;
        console.warn("Unable to render the animated WebGL background.", error);

        if (animationId) {
          window.cancelAnimationFrame(animationId);
        }
      }
    };

    const onWindowResize = () => {
      if (hasRenderError) {
        return;
      }

      try {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height, false);
        uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
      } catch (error) {
        hasRenderError = true;
        console.warn("Unable to resize the animated WebGL background.", error);
        return;
      }

      // Ensure we render at least once when resizing, even if animation is paused
      if (isReduced) {
        safeRender();
      }
    };

    // Debounce the resize event to improve performance
    const debouncedResize = debounce(onWindowResize, 200);

    onWindowResize();
    window.addEventListener("resize", debouncedResize);

    const animate = () => {
      if (hasRenderError) {
        return;
      }

      animationId = window.requestAnimationFrame(animate);
      if (!isReduced) {
        uniforms.time.value += 0.05;
        safeRender();
      }
    };

    sceneRef.current = { renderer, geometry, material, animationId };
    animate();

    return () => {
      window.removeEventListener("resize", debouncedResize);

      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMotionChange);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleMotionChange);
      }

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

  return <div ref={containerRef} className={className} {...props} />;
};

export default VantaEffect;

import { useEffect, useRef } from "react";
import {
  Camera,
  Scene,
  PlaneGeometry,
  Vector2,
  Color,
  ShaderMaterial,
  Mesh,
  WebGLRenderer,
} from "three";
import signalExperience from "../lib/signalExperience";

const { resolveRenderMode, resolveWebGLPixelRatio } = signalExperience;

const debounce = (func, wait) => {
  let timeout;
  const executedFunction = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  executedFunction.cancel = () => clearTimeout(timeout);
  return executedFunction;
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
  uniform float resonance;
  uniform vec3 resonanceColor;

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

    vec3 signalBlack = vec3(0.0235, 0.0431, 0.0353);
    vec3 signalMint = vec3(0.5490, 0.9412, 0.7765);
    vec3 calibrationGold = vec3(0.8941, 0.7216, 0.3647);
    vec3 signalColor = mix(signalMint, calibrationGold, 0.16 + pulse * 0.12);
    float intensity = clamp(rings * 0.52 + pulse * 0.22 + halo * 0.24, 0.0, 1.0);
    vec3 color = mix(signalBlack, signalColor, intensity * fade);

    float resonanceRing = smoothstep(0.09, 0.0, abs(r - (1.0 - resonance) * 1.1));
    color += resonanceColor * resonanceRing * resonance * 0.46;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const VantaEffect = ({ className, ...props }) => {
  const containerRef = useRef(null);

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
      resonance: { value: 0 },
      resonanceColor: { value: new Color("#8cf0c6") },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    let animationId = 0;
    let hasRenderError = false;
    let visible = !document.hidden;
    let renderer;

    const renderMode = () =>
      resolveRenderMode({
        webglAvailable: !hasRenderError,
        reducedMotion: mediaQuery.matches,
        isMobile: mobileQuery.matches,
        visible,
      });

    const stopLoop = () => {
      if (animationId) window.cancelAnimationFrame(animationId);
      animationId = 0;
    };

    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: false });
    } catch (error) {
      hasRenderError = true;
      container.dataset.webgl = "fallback";
      geometry.dispose();
      material.dispose();
      console.warn("Unable to initialize the animated WebGL background.", error);
      return undefined;
    }

    renderer.setPixelRatio(
      resolveWebGLPixelRatio(window.devicePixelRatio, mobileQuery.matches)
    );
    renderer.setClearColor(0x060b09, 1);
    container.dataset.webgl = "active";
    container.appendChild(renderer.domElement);

    const safeRender = () => {
      if (hasRenderError) {
        return;
      }

      try {
        renderer.render(scene, camera);
      } catch (error) {
        hasRenderError = true;
        container.dataset.webgl = "fallback";
        stopLoop();
        console.warn("Unable to render the animated WebGL background.", error);
      }
    };

    const onWindowResize = () => {
      if (hasRenderError) {
        return;
      }

      try {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        renderer.setSize(width, height, false);
        uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
      } catch (error) {
        hasRenderError = true;
        container.dataset.webgl = "fallback";
        stopLoop();
        console.warn("Unable to resize the animated WebGL background.", error);
        return;
      }

      safeRender();
    };

    const debouncedResize = debounce(onWindowResize, 200);

    const frame = () => {
      if (renderMode() !== "continuous") {
        stopLoop();
        return;
      }

      uniforms.time.value += 0.05;
      if (uniforms.resonance.value > 0.001) {
        uniforms.resonance.value *= 0.9;
      } else {
        uniforms.resonance.value = 0;
      }
      safeRender();

      if (renderMode() === "continuous") {
        animationId = window.requestAnimationFrame(frame);
      }
    };

    const syncLoop = () => {
      const mode = renderMode();
      if (mode === "continuous" && !animationId) {
        animationId = window.requestAnimationFrame(frame);
      } else if (mode !== "continuous") {
        stopLoop();
        if (mode === "static") safeRender();
      }
    };

    const handleResonance = (event) => {
      const intensity = event?.detail?.intensity;
      uniforms.resonance.value = Number.isFinite(intensity)
        ? Math.max(0, Math.min(intensity, 1))
        : 1;
      if (event?.detail?.color) {
        uniforms.resonanceColor.value.set(event.detail.color);
      }
      if (renderMode() === "static") safeRender();
    };

    const onVisibilityChange = () => {
      visible = !document.hidden;
      syncLoop();
    };

    const onRuntimeChange = () => {
      if (hasRenderError) return;
      renderer.setPixelRatio(
        resolveWebGLPixelRatio(window.devicePixelRatio, mobileQuery.matches)
      );
      onWindowResize();
      syncLoop();
    };

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("vanta:resonance", handleResonance);
    document.addEventListener("visibilitychange", onVisibilityChange);
    mediaQuery.addEventListener("change", onRuntimeChange);
    mobileQuery.addEventListener("change", onRuntimeChange);
    onWindowResize();
    syncLoop();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("vanta:resonance", handleResonance);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mediaQuery.removeEventListener("change", onRuntimeChange);
      mobileQuery.removeEventListener("change", onRuntimeChange);
      debouncedResize.cancel();
      stopLoop();

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} {...props} />;
};

export default VantaEffect;

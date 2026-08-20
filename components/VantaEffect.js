import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  PerspectiveCamera,
  Scene,
  PlaneGeometry,
  Vector2,
  Color,
  ShaderMaterial,
  Mesh,
  WebGLRenderer,
} from "three";
import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

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
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// The page-wide field the hero's archive sits inside: the same concentric
// signal, but bent around a slowly drifting mass. The distortion is what makes
// the background feel like space rather than a screensaver, so it stays quiet
// enough to read text over.
const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float resonance;
  uniform vec3 resonanceColor;
  uniform float hover;
  uniform float warp;
  varying vec2 vUv;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

    // Gravitational lensing warp into singularity
    float warpFactor = clamp(warp, 0.0, 1.0);
    float warpScale = 1.0 - warpFactor * 0.88;
    uv = uv / max(0.001, warpScale);

    // Accretion disk rotation acceleration on hover
    float t = time * (0.04 + hover * 0.035);

    // A drifting mass. Sample coordinates are pulled toward it, so the rings
    // stretch and shear as it passes instead of staying perfect circles.
    vec2 mass = vec2(sin(t * 0.51) * 0.46, cos(t * 0.37) * 0.28);
    vec2 offset = uv - mass;
    float lensRadius = length(offset) + 0.0001;
    vec2 bent = uv - (offset / lensRadius) * (0.055 / (lensRadius * lensRadius + 0.06));

    float r = length(bent);

    float wave1 = sin(34.0 * r - t * 8.0);
    float wave2 = sin(52.0 * r - t * 10.0 + 1.4);
    float wave3 = sin(72.0 * r - t * 12.0 + 2.2);

    float rings = 0.55 + 0.28 * wave1 + 0.22 * wave2 + 0.15 * wave3;

    float pulse = 0.5 + 0.5 * sin(t * 2.6 - r * 30.0);
    float halo = 0.15 / max(0.025, abs(fract((r - t * 0.22) * 14.0) - 0.5));
    float fade = smoothstep(1.4, 0.0, r);

    // The archive's encoding, faint, drifting with the bent field. Kept small
    // and dim: this sits behind body copy, so a lit cell must never read as a
    // compression artefact.
    vec2 grid = bent * 46.0;
    float bit = hash21(floor(grid));
    float written = step(0.972, fract(bit * 23.7 + t * (0.4 + bit * 1.3)));
    vec2 cell = abs(fract(grid) - 0.5);
    float rule = smoothstep(0.5, 0.44, max(cell.x, cell.y));

    // A faint Einstein ring, so the page rhymes with the hero without
    // competing with it.
    float photon = exp(-pow((lensRadius - 0.11) / 0.012, 2.0));

    vec3 signalBlack = vec3(0.0235, 0.0431, 0.0353);
    vec3 signalMint = vec3(0.5490, 0.9412, 0.7765);
    vec3 calibrationGold = vec3(0.8941, 0.7216, 0.3647);
    vec3 signalColor = mix(signalMint, calibrationGold, 0.16 + pulse * 0.12);
    
    // 15-25% bloom & intensity boost on hover
    float intensityBoost = 1.0 + hover * 0.22;
    float intensity = clamp(rings * 0.52 + pulse * 0.22 + halo * 0.24, 0.0, 1.0) * intensityBoost;
    
    // Accretion disk core glow
    float coreGlow = smoothstep(0.45, 0.05, r) * hover * 0.3;
    vec3 color = mix(signalBlack, signalColor, intensity * fade) + signalMint * coreGlow;

    color += signalMint * rule * 0.03 * fade;
    color += mix(signalMint, vec3(1.0), 0.6) * written * rule * 0.16 * fade;
    color += mix(signalMint, vec3(1.0), 0.5) * photon * 0.45;

    float resonanceRing = smoothstep(0.09, 0.0, abs(r - (1.0 - resonance) * 1.1));
    color += resonanceColor * resonanceRing * resonance * 0.46;

    // Singularity blackout during transition
    if (warpFactor > 0.0) {
      color = mix(color, signalBlack, clamp(warpFactor * 1.25, 0.0, 1.0));
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const VantaEffect = ({ className, ...props }) => {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef(false);

  const triggerPortalTransition = useCallback(() => {
    if (transitionRef.current) return;
    transitionRef.current = true;
    setIsTransitioning(true);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = mediaQuery.matches ? 200 : 900;

    window.dispatchEvent(
      new CustomEvent("vanta:portal-warp", {
        detail: { active: true, duration },
      })
    );

    setTimeout(() => {
      router.push("/research");
    }, duration);
  }, [router]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 1.8;

    const scene = new Scene();
    const geometry = new PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new Vector2() },
      resonance: { value: 0 },
      resonanceColor: { value: new Color("#8cf0c6") },
      hover: { value: 0.0 },
      warp: { value: 0.0 },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let currentHover = 0.0;
    let targetHover = 0.0;
    let currentWarp = 0.0;
    let targetWarp = 0.0;

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
        uniforms.resolution.value.set(
          renderer.domElement.width,
          renderer.domElement.height
        );
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
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

    const handlePortalWarp = (event) => {
      if (event?.detail?.active) {
        targetWarp = 1.0;
        targetHover = 1.0;
        setIsTransitioning(true);
      }
    };

    const frame = () => {
      if (renderMode() !== "continuous" && !transitionRef.current) {
        stopLoop();
        return;
      }

      uniforms.time.value += 0.05;

      // Smooth hover interpolation
      currentHover += (targetHover - currentHover) * 0.12;
      uniforms.hover.value = currentHover;

      // Smooth warp interpolation
      if (targetWarp > 0) {
        currentWarp += (1.0 - currentWarp) * 0.08;
        uniforms.warp.value = currentWarp;
        // Cinematic camera zoom into singularity
        camera.position.z = Math.max(0.1, 1.8 - currentWarp * 1.5);
      }

      if (uniforms.resonance.value > 0.001) {
        uniforms.resonance.value *= 0.9;
      } else {
        uniforms.resonance.value = 0;
      }

      safeRender();

      if (renderMode() === "continuous" || transitionRef.current) {
        animationId = window.requestAnimationFrame(frame);
      }
    };

    const syncLoop = () => {
      const mode = renderMode();
      if ((mode === "continuous" || transitionRef.current) && !animationId) {
        animationId = window.requestAnimationFrame(frame);
      } else if (mode !== "continuous" && !transitionRef.current) {
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
    window.addEventListener("vanta:portal-warp", handlePortalWarp);
    document.addEventListener("visibilitychange", onVisibilityChange);
    mediaQuery.addEventListener("change", onRuntimeChange);
    mobileQuery.addEventListener("change", onRuntimeChange);
    onWindowResize();
    syncLoop();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("vanta:resonance", handleResonance);
      window.removeEventListener("vanta:portal-warp", handlePortalWarp);
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

  return (
    <>
      <div ref={containerRef} className={className} {...props} />

      {/* Accessible Keyboard Portal Gateway */}
      <button
        type="button"
        className={styles.accessiblePortalTrigger}
        onClick={triggerPortalTransition}
        aria-label="Open Vanta Research Explorer"
      >
        <span className={styles.accessiblePortalIcon}>✦</span>
        <span>Cross Event Horizon &rarr; Research Explorer</span>
      </button>

      {/* Cinematic Warp Blackout Overlay */}
      {isTransitioning && (
        <div className={styles.eventHorizonTransitionOverlay} aria-hidden="true" />
      )}
    </>
  );
};

export default VantaEffect;

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { SRGBColorSpace, WebGLRenderer } from "three";
import styles from "../styles/Home.module.css";
import displayPedestalModels from "../lib/displayPedestalModels.json";
import signalExperience from "../lib/signalExperience";
import { createEventHorizonArchive } from "../lib/eventHorizonArchive";
import {
  isMobileDevice,
  prefersReducedMotion,
  supportsWebGL,
} from "../lib/runtimeCapabilities";

const { resolveArchiveDetail, resolvePedestalMode, resolveWebGLPixelRatio } =
  signalExperience;

// The frame a static visitor is given. Far enough into the drift that the
// platter, the lensed arcs, and a full length of infall are all in shot.
const STATIC_FRAME_SECONDS = 9.4;
const MAX_FRAME_DELTA = 1 / 24;

const DisplayPedestal = ({ className = "", onResonance = () => {} }) => {
  const router = useRouter();
  const hostRef = useRef(null);
  const sceneApiRef = useRef(null);
  const modelIndexRef = useRef(0);
  const [modelIndex, setModelIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hudPos, setHudPos] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef(false);
  const activeModel = displayPedestalModels[modelIndex];

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

  const swapModel = useCallback(
    (event) => {
      if (event) event.stopPropagation();
      const nextIndex =
        (modelIndexRef.current + 1) % displayPedestalModels.length;
      const nextModel = displayPedestalModels[nextIndex];
      modelIndexRef.current = nextIndex;
      setModelIndex(nextIndex);
      onResonance({
        channelId: "hero-model-" + nextIndex,
        color: nextModel.primary,
        frequency: [261.63, 329.63, 392, 440][nextIndex],
        intensity: 1,
      });
    },
    [onResonance]
  );

  const selectModel = useCallback(
    (index, event) => {
      if (event) event.stopPropagation();
      const nextModel = displayPedestalModels[index];
      if (!nextModel) return;
      modelIndexRef.current = index;
      setModelIndex(index);
      onResonance({
        channelId: "hero-model-" + index,
        color: nextModel.primary,
        frequency: [261.63, 329.63, 392, 440][index],
        intensity: 1,
      });
    },
    [onResonance]
  );

  useEffect(() => {
    modelIndexRef.current = modelIndex;
    sceneApiRef.current?.setModel(displayPedestalModels[modelIndex]);
  }, [modelIndex]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    // Capability check BEFORE WebGL context allocation
    const isMobile = isMobileDevice();
    const reducedMotion = prefersReducedMotion();
    const webglSupported = supportsWebGL();

    if (isMobile || reducedMotion || !webglSupported) {
      host.dataset.webgl = "fallback";
      return undefined;
    }

    const mobileQuery = window.matchMedia
      ? window.matchMedia("(max-width: 720px)")
      : { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
    const motionQuery = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener: () => {}, removeEventListener: () => {} };

    let renderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      host.dataset.webgl = "fallback";
      console.warn("Unable to initialize the event horizon archive.", error);
      return undefined;
    }

    const pixelRatio = () =>
      resolveWebGLPixelRatio(window.devicePixelRatio, mobileQuery.matches);

    renderer.setPixelRatio(pixelRatio());
    renderer.outputColorSpace = SRGBColorSpace;
    host.dataset.webgl = "active";
    host.appendChild(renderer.domElement);

    const archive = createEventHorizonArchive({
      detail: resolveArchiveDetail({
        isMobile: mobileQuery.matches,
        reducedMotion: motionQuery.matches,
      }),
      model: displayPedestalModels[modelIndexRef.current],
    });

    let frame = 0;
    let lastFrameTime = 0;
    let isInView = !("IntersectionObserver" in window);
    let visible = !document.hidden;
    let webglAvailable = true;

    const renderMode = () =>
      resolvePedestalMode({
        webglAvailable,
        reducedMotion: motionQuery.matches,
        inViewport: isInView,
        visible,
      });

    const stopLoop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastFrameTime = 0;
    };

    const safeRender = () => {
      if (!webglAvailable) return;
      try {
        renderer.render(archive.scene, archive.camera);
      } catch (error) {
        webglAvailable = false;
        host.dataset.webgl = "fallback";
        stopLoop();
        console.warn("Unable to render the event horizon archive.", error);
      }
    };

    // Reduced motion gets one composed frame rather than a frozen first frame,
    // so the still is the same picture the drift settles into.
    archive.settle(STATIC_FRAME_SECONDS);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      archive.resize(width, height);
      renderer.setSize(width, height, false);
      archive.setPixelRatio(renderer.getPixelRatio());
      if (renderMode() !== "continuous") safeRender();
    };

    const frameLoop = (now) => {
      if (renderMode() !== "continuous") {
        stopLoop();
        return;
      }

      // Clamped, so a backgrounded tab returning does not jump the drift.
      const delta = lastFrameTime
        ? Math.min((now - lastFrameTime) / 1000, MAX_FRAME_DELTA)
        : 1 / 60;
      lastFrameTime = now;

      archive.update(delta);
      safeRender();

      if (renderMode() === "continuous") {
        frame = window.requestAnimationFrame(frameLoop);
      }
    };

    const syncLoop = () => {
      const mode = renderMode();
      if (mode === "continuous" && !frame) {
        frame = window.requestAnimationFrame(frameLoop);
      } else if (mode !== "continuous") {
        stopLoop();
        if (mode === "static") safeRender();
      }
    };

    const handlePortalWarp = (event) => {
      if (event?.detail?.active) {
        archive.ingestPulse();
      }
    };

    sceneApiRef.current = {
      setModel: (model) => {
        archive.setIndexModel(model);
        archive.ingestPulse();
        if (renderMode() !== "continuous") {
          // Let the new index finish materialising before the still is taken.
          archive.settle(1.2);
          safeRender();
        }
      },
      setHover: (value) => {
        archive.setHover(value);
        if (renderMode() !== "continuous") safeRender();
      },
      setPointer: (x, y) => {
        archive.setPointer(x, y);
      },
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onMotionChange = () => syncLoop();

    const onVisibilityChange = () => {
      visible = !document.hidden;
      syncLoop();
    };

    const onMobileChange = () => {
      renderer.setPixelRatio(pixelRatio());
      resize();
      syncLoop();
    };

    const visibilityObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              isInView = entry?.isIntersecting ?? true;
              syncLoop();
            },
            { threshold: 0.05 }
          )
        : null;

    window.addEventListener("vanta:portal-warp", handlePortalWarp);
    motionQuery.addEventListener("change", onMotionChange);
    mobileQuery.addEventListener("change", onMobileChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityObserver?.observe(host);
    syncLoop();

    return () => {
      stopLoop();
      window.removeEventListener("vanta:portal-warp", handlePortalWarp);
      motionQuery.removeEventListener("change", onMotionChange);
      mobileQuery.removeEventListener("change", onMobileChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      visibilityObserver?.disconnect();
      resizeObserver.disconnect();
      sceneApiRef.current = null;
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      archive.dispose();
      renderer.dispose();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerPortalTransition();
    }
  };

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    sceneApiRef.current?.setPointer(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      ((event.clientY - bounds.top) / bounds.height) * 2 - 1
    );
    setHudPos({ x: event.clientX, y: event.clientY });
  };

  return (
    <div
      className={`${styles.displayPedestal} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label="Cross Event Horizon to Research Explorer"
      onClick={triggerPortalTransition}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        sceneApiRef.current?.setHover(true);
        setIsHovered(true);
      }}
      onPointerLeave={() => {
        sceneApiRef.current?.setHover(false);
        sceneApiRef.current?.setPointer(0, 0);
        setIsHovered(false);
      }}
      onFocus={() => {
        sceneApiRef.current?.setHover(true);
        setIsHovered(true);
      }}
      onBlur={() => {
        sceneApiRef.current?.setHover(false);
        setIsHovered(false);
      }}
    >
      <div ref={hostRef} className={styles.displayPedestalCanvas} aria-hidden="true" />
      <div className={styles.displayPedestalHud} aria-hidden="true">
        <button
          type="button"
          className={styles.displayPedestalModelBtn}
          onClick={swapModel}
          aria-label={`Current model: ${activeModel.label}. Click to switch model.`}
        >
          {activeModel.label}
        </button>
        <span className={styles.displayPedestalSwatches}>
          {displayPedestalModels.map((model, index) => (
            <button
              type="button"
              key={model.label}
              className={`${styles.displayPedestalSwatch} ${
                index === modelIndex ? styles.displayPedestalSwatchActive : ""
              }`}
              style={{ "--swatch": model.primary }}
              onClick={(e) => selectModel(index, e)}
              aria-label={`Select model ${model.label}`}
            />
          ))}
        </span>
      </div>

      {/* Interactive Black Hole Hover HUD Tooltip */}
      {isHovered && !isTransitioning && (
        <div
          className={styles.eventHorizonTooltip}
          style={{
            left: hudPos.x,
            top: hudPos.y - 48,
          }}
          aria-hidden="true"
        >
          <div className={styles.eventHorizonBadge}>SINGULARITY PORTAL</div>
          <div className={styles.eventHorizonLabel}>CROSS THE EVENT HORIZON</div>
          <div className={styles.eventHorizonSub}>Click to Enter Research Explorer</div>
        </div>
      )}
    </div>
  );
};

export default DisplayPedestal;

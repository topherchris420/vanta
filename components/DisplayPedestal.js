import { useCallback, useEffect, useRef, useState } from "react";
import { SRGBColorSpace, WebGLRenderer } from "three";
import styles from "../styles/Home.module.css";
import displayPedestalModels from "../lib/displayPedestalModels.json";
import signalExperience from "../lib/signalExperience";
import { createEventHorizonArchive } from "../lib/eventHorizonArchive";

const { resolveArchiveDetail, resolvePedestalMode, resolveWebGLPixelRatio } =
  signalExperience;

// The frame a static visitor is given. Far enough into the drift that the
// platter, the lensed arcs, and a full length of infall are all in shot.
const STATIC_FRAME_SECONDS = 9.4;
const MAX_FRAME_DELTA = 1 / 24;

const DisplayPedestal = ({ className = "", onResonance = () => {} }) => {
  const hostRef = useRef(null);
  const sceneApiRef = useRef(null);
  const modelIndexRef = useRef(0);
  const [modelIndex, setModelIndex] = useState(0);
  const activeModel = displayPedestalModels[modelIndex];

  const swapModel = useCallback(() => {
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
  }, [onResonance]);

  useEffect(() => {
    modelIndexRef.current = modelIndex;
    sceneApiRef.current?.setModel(displayPedestalModels[modelIndex]);
  }, [modelIndex]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

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

    motionQuery.addEventListener("change", onMotionChange);
    mobileQuery.addEventListener("change", onMobileChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityObserver?.observe(host);
    syncLoop();

    return () => {
      stopLoop();
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
      swapModel();
    }
  };

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    sceneApiRef.current?.setPointer(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      ((event.clientY - bounds.top) / bounds.height) * 2 - 1
    );
  };

  return (
    <div
      className={`${styles.displayPedestal} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={`Swap the archived index model. Current model: ${activeModel.label}`}
      onClick={swapModel}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        sceneApiRef.current?.setHover(true);
      }}
      onPointerLeave={() => {
        sceneApiRef.current?.setHover(false);
        sceneApiRef.current?.setPointer(0, 0);
      }}
      onFocus={() => {
        sceneApiRef.current?.setHover(true);
      }}
      onBlur={() => {
        sceneApiRef.current?.setHover(false);
      }}
    >
      <div ref={hostRef} className={styles.displayPedestalCanvas} aria-hidden="true" />
      <div className={styles.displayPedestalHud} aria-hidden="true">
        <span className={styles.displayPedestalModel}>{activeModel.label}</span>
        <span className={styles.displayPedestalSwatches}>
          {displayPedestalModels.map((model, index) => (
            <span
              key={model.label}
              className={`${styles.displayPedestalSwatch} ${
                index === modelIndex ? styles.displayPedestalSwatchActive : ""
              }`}
              style={{ "--swatch": model.primary }}
            />
          ))}
        </span>
      </div>
    </div>
  );
};

export default DisplayPedestal;

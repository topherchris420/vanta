/**
 * Shared runtime capability detection module for mobile-runtime hardening.
 * Safely guards browser-only APIs and enforces progressive enhancement strategies.
 */

const isClient = () => typeof window !== "undefined" && typeof document !== "undefined";

const isMobileDevice = () => {
  if (!isClient()) return false;
  try {
    const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
    if (mobileQuery && mobileQuery.matches) return true;

    const nav = window.navigator;
    if (nav) {
      if (nav.maxTouchPoints && nav.maxTouchPoints > 0 && mobileQuery?.matches) return true;
      const ua = nav.userAgent || "";
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return true;
      }
    }
  } catch {
    // Return safe default if capability test fails
  }
  return false;
};

const prefersReducedMotion = () => {
  if (!isClient()) return false;
  try {
    const motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    return Boolean(motionQuery && motionQuery.matches);
  } catch {
    return false;
  }
};

const hasFinePointer = () => {
  if (!isClient()) return false;
  try {
    const pointerQuery = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;
    return Boolean(pointerQuery && pointerQuery.matches);
  } catch {
    return false;
  }
};

let cachedWebGLSupport = null;

const supportsWebGL = () => {
  if (!isClient()) return false;
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;

  try {
    const canvas = document.createElement("canvas");
    if (!canvas) {
      cachedWebGLSupport = false;
      return false;
    }
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    cachedWebGLSupport = Boolean(gl && typeof gl.getParameter === "function");

    // Clean up extension contexts if created
    if (gl && typeof gl.getExtension === "function") {
      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
    }
  } catch {
    cachedWebGLSupport = false;
  }

  return cachedWebGLSupport;
};

// Reset cache for testing environments
const resetWebGLCache = () => {
  cachedWebGLSupport = null;
};

const shouldUseWebGL = (overrideState = {}) => {
  const isMobile = overrideState.isMobile !== undefined ? overrideState.isMobile : isMobileDevice();
  const reducedMotion = overrideState.reducedMotion !== undefined ? overrideState.reducedMotion : prefersReducedMotion();
  const webglAvailable = overrideState.webglAvailable !== undefined ? overrideState.webglAvailable : supportsWebGL();

  if (isMobile || reducedMotion || !webglAvailable) {
    return false;
  }

  return true;
};

const getSafePixelRatio = (devicePixelRatio, isMobile = isMobileDevice()) => {
  const normalized =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;

  return Math.min(normalized, isMobile ? 1.5 : 2);
};

module.exports = {
  isClient,
  isMobileDevice,
  prefersReducedMotion,
  hasFinePointer,
  supportsWebGL,
  shouldUseWebGL,
  getSafePixelRatio,
  resetWebGLCache,
};

const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

test("shared runtime policies are exported for the render loop", () => {
  assert.equal(typeof signal.resolveWebGLPixelRatio, "function");
  assert.equal(typeof signal.resolvePedestalMode, "function");
  assert.equal(typeof signal.resolveCursorEnabled, "function");
});

test("render and pedestal policies cover runtime state transitions literally", () => {
  const renderMode = (overrides) => signal.resolveRenderMode({
    webglAvailable: true,
    reducedMotion: false,
    isMobile: false,
    visible: true,
    ...overrides,
  });
  const pedestalMode = (overrides) => signal.resolvePedestalMode({
    webglAvailable: true,
    reducedMotion: false,
    inViewport: true,
    visible: true,
    ...overrides,
  });

  assert.equal(renderMode({}), "continuous");
  assert.equal(renderMode({ visible: false }), "paused");
  assert.equal(renderMode({ visible: true }), "continuous");
  assert.equal(renderMode({ reducedMotion: true }), "static");
  assert.equal(renderMode({ reducedMotion: false }), "continuous");
  assert.equal(renderMode({ isMobile: true }), "static");
  assert.equal(renderMode({ isMobile: false }), "continuous");
  assert.equal(renderMode({ webglAvailable: false }), "css-fallback");

  assert.equal(pedestalMode({}), "continuous");
  assert.equal(pedestalMode({ visible: false }), "paused");
  assert.equal(pedestalMode({ visible: true }), "continuous");
  assert.equal(pedestalMode({ inViewport: false }), "paused");
  assert.equal(pedestalMode({ inViewport: true }), "continuous");
  assert.equal(pedestalMode({ reducedMotion: true }), "static");
  assert.equal(pedestalMode({ reducedMotion: false }), "continuous");
  assert.equal(pedestalMode({ webglAvailable: false }), "css-fallback");
});

test("webgl pixel ratio policy caps desktop and mobile ratios and normalizes invalid values", () => {
  assert.equal(signal.resolveWebGLPixelRatio(1, false), 1);
  assert.equal(signal.resolveWebGLPixelRatio(2.6, false), 2);
  assert.equal(signal.resolveWebGLPixelRatio(2.6, true), 1.5);
  assert.equal(signal.resolveWebGLPixelRatio(0, false), 1);
  assert.equal(signal.resolveWebGLPixelRatio(-1, true), 1);
  assert.equal(signal.resolveWebGLPixelRatio(Number.NaN, false), 1);
  assert.equal(signal.resolveWebGLPixelRatio(undefined, true), 1);
});

test("cursor policy only enables visible fine-pointer documents without reduced motion", () => {
  const enabled = (overrides) => signal.resolveCursorEnabled({
    finePointer: true,
    reducedMotion: false,
    visible: true,
    ...overrides,
  });

  assert.equal(enabled({}), true);
  assert.equal(enabled({ visible: false }), false);
  assert.equal(enabled({ visible: true }), true);
  assert.equal(enabled({ reducedMotion: true }), false);
  assert.equal(enabled({ reducedMotion: false }), true);
  assert.equal(enabled({ finePointer: false }), false);
});

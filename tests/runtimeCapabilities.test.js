const assert = require("node:assert/strict");
const test = require("node:test");
const runtime = require("../lib/runtimeCapabilities");
const signal = require("../lib/signalExperience");

test("runtime capabilities - isMobileDevice detection", () => {
  assert.equal(typeof runtime.isMobileDevice, "function");
  // In Node.js environment without window, should safely return false
  assert.equal(runtime.isMobileDevice(), false);
});

test("runtime capabilities - prefersReducedMotion detection", () => {
  assert.equal(typeof runtime.prefersReducedMotion, "function");
  assert.equal(runtime.prefersReducedMotion(), false);
});

test("runtime capabilities - supportsWebGL detection without throwing", () => {
  assert.equal(typeof runtime.supportsWebGL, "function");
  // Should safely execute without throwing in non-browser env
  assert.doesNotThrow(() => {
    runtime.supportsWebGL();
  });
});

test("runtime capabilities - shouldUseWebGL policy", () => {
  assert.equal(runtime.shouldUseWebGL({ isMobile: true, reducedMotion: false, webglAvailable: true }), false);
  assert.equal(runtime.shouldUseWebGL({ isMobile: false, reducedMotion: true, webglAvailable: true }), false);
  assert.equal(runtime.shouldUseWebGL({ isMobile: false, reducedMotion: false, webglAvailable: false }), false);
  assert.equal(runtime.shouldUseWebGL({ isMobile: false, reducedMotion: false, webglAvailable: true }), true);
});

test("runtime capabilities - getSafePixelRatio bounds", () => {
  assert.equal(runtime.getSafePixelRatio(3, false), 2);
  assert.equal(runtime.getSafePixelRatio(3, true), 1.5);
  assert.equal(runtime.getSafePixelRatio(1, false), 1);
  assert.equal(runtime.getSafePixelRatio(undefined, false), 1);
});

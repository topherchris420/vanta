## 2026-02-18 - WebGL Animation Loop Optimization
**Learning:** Continuous `requestAnimationFrame` loops in React components can consume significant GPU/CPU resources even when not necessary (e.g., user prefers reduced motion). However, simply pausing the loop can lead to stale or blank canvases on resize.
**Action:** Implement `prefers-reduced-motion` checks to pause animation loops, but always attach a resize listener that forces a single frame render to ensure the canvas remains correct.

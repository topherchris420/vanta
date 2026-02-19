## 2026-02-14 - Redundant Library Loading
**Learning:** Manually injecting library scripts (like Three.js) via CDN while also importing the library as a dependency leads to double loading, version conflicts, and wasted bandwidth.
**Action:** Always check if a library is already bundled before adding a CDN script. Use the bundled version whenever possible.

## 2026-02-19 - WebGL Animation Efficiency
**Learning:** In WebGL animation loops (using `requestAnimationFrame`), simply pausing the state update (e.g., `time`) when reduced motion is preferred is insufficient; the `renderer.render()` call must also be skipped to save GPU resources.
**Action:** Implement conditional rendering in animation loops: only call `renderer.render()` when animation is active or on resize events to update static views.

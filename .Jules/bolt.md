## 2026-02-14 - Redundant Library Loading
**Learning:** Manually injecting library scripts (like Three.js) via CDN while also importing the library as a dependency leads to double loading, version conflicts, and wasted bandwidth.
**Action:** Always check if a library is already bundled before adding a CDN script. Use the bundled version whenever possible.

## 2026-02-19 - WebGL Animation Efficiency
**Learning:** In WebGL animation loops (using `requestAnimationFrame`), simply pausing the state update (e.g., `time`) when reduced motion is preferred is insufficient; the `renderer.render()` call must also be skipped to save GPU resources.
**Action:** Implement conditional rendering in animation loops: only call `renderer.render()` when animation is active or on resize events to update static views.

## 2026-02-20 - Responsive Image Sizing with next/image
**Learning:** When using `next/image` inside a container with `max-width`, always mirror that constraint in the `sizes` attribute (e.g., `(max-width: 768px) 100vw, 640px`) to prevent downloading unnecessarily large images on wide viewports.
**Action:** Audit all `next/image` components for `sizes` attributes, especially those in constrained containers or with `priority` enabled, to improve LCP.

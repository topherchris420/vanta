## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-10-18 - WebGL Performance for Reduced Motion
**Learning:** Simply pausing animation time updates in WebGL loops still consumes GPU resources.
**Action:** Completely stop the `requestAnimationFrame` loop when `prefers-reduced-motion` is active, rendering only on resize or state change.

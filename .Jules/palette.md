## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-02-18 - Glassmorphism Consistency
**Learning:** The project uses `backdrop-filter: blur(8px)` with specific `rgba` backgrounds for UI containers.
**Action:** Apply this pattern to new floating elements (like scroll-to-top) to maintain visual consistency.

## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

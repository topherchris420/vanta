## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-02-18 - CSS Transitions Motion
**Learning:** CSS `transition` and `transform` properties can cause motion sickness if not gated behind a reduced motion query.
**Action:** Always wrap motion-inducing CSS rules in `@media (prefers-reduced-motion: no-preference)` or override them in `@media (prefers-reduced-motion: reduce)`.

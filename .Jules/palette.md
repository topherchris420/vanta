## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-02-17 - Component Prop Spreading for Accessibility
**Learning:** Custom visual components (like WebGL wrappers) that don't spread props prevent `aria-hidden` from working, causing accessibility issues.
**Action:** Always ensure custom components spread `...props` to their root element so accessibility attributes can be passed down.

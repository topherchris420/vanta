## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-02-18 - Glassmorphism Consistency
**Learning:** The project uses `backdrop-filter: blur(8px)` with specific `rgba` backgrounds for UI containers.
**Action:** Apply this pattern to new floating elements (like scroll-to-top) to maintain visual consistency.

## 2026-02-18 - Floating UI Interaction
**Learning:** Floating UI controls like the "Scroll to Top" button lack explicit context within the document flow, making interaction feedback critical. Users can miss these controls or feel unsure if they are clickable without clear hover and focus states.
**Action:** Ensure all floating or detached UI elements have explicit, visible hover and focus-visible styling (like border color changes and subtle transforms) to improve discoverability and tactile feel.

## 2026-02-17 - WebGL Reduced Motion
**Learning:** Custom WebGL implementations using `requestAnimationFrame` do not automatically respect `prefers-reduced-motion` settings, potentially causing vestibular issues.
**Action:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in custom animation loops to pause or simplify effects.

## 2026-02-18 - Glassmorphism Consistency
**Learning:** The project uses `backdrop-filter: blur(8px)` with specific `rgba` backgrounds for UI containers.
**Action:** Apply this pattern to new floating elements (like scroll-to-top) to maintain visual consistency.

## 2026-08-30 - Invisible Focus Traps with Opacity
**Learning:** Using `opacity: 0` and `pointer-events: none` to visually hide interactive elements (like floating buttons) prevents mouse interaction but still allows keyboard navigation to focus the invisible element.
**Action:** When dynamically hiding interactive elements without removing them from the DOM, explicitly manage their focusability using `tabIndex={isVisible ? 0 : -1}` and `aria-hidden={!isVisible}`.

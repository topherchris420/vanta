## 2024-05-22 - Unused Dependency Pattern
**Learning:** The project lists `vanta` as a dependency but implements the effect manually using `three.js` in `VantaEffect.js`. This creates confusion and bloat.
**Action:** Always check imports before assuming a package is used.

## 2024-05-22 - Next.js Image Optimization
**Learning:** `next/image` components with `priority` must have a `sizes` attribute to ensure the browser downloads the correct image size, otherwise it defaults to 100vw or similar, hurting LCP.
**Action:** Audit all `next/image` usages for `sizes` attribute.

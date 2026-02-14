## 2026-02-14 - Redundant Library Loading
**Learning:** Manually injecting library scripts (like Three.js) via CDN while also importing the library as a dependency leads to double loading, version conflicts, and wasted bandwidth.
**Action:** Always check if a library is already bundled before adding a CDN script. Use the bundled version whenever possible.

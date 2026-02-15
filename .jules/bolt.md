## 2026-02-14 - Redundant Library Loading
**Learning:** Manually injecting library scripts (like Three.js) via CDN while also importing the library as a dependency leads to double loading, version conflicts, and wasted bandwidth.
**Action:** Always check if a library is already bundled before adding a CDN script. Use the bundled version whenever possible.

## 2026-02-14 - Unpinned Dependencies Risk
**Learning:** When `package.json` specifies versions as "latest", running any package manager command (like removing a dependency) will trigger upgrades for all "latest" dependencies, potentially causing unintended breaking changes.
**Action:** Check `package.json` for "latest" tags before modifying dependencies. If present, be aware that lockfile changes will be massive and include framework upgrades.

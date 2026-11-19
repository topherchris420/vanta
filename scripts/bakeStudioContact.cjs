// With the current /studio build running, pass its origin (see docs/studio.md).
// This developer-only bake uses the scene's own inspect API and static meshes.
const { chromium } = require("playwright-core");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function bake(origin) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "studio-contact-"));
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    });
    const page = await browser.newPage({ viewport: { width: 480, height: 360 }, reducedMotion: "reduce", isMobile: true });
    await page.goto(new URL("/studio?inspect", origin).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__vantaStudio?.debug().contactSurfaces, null, { timeout: 120000 });
    const { charts, count } = await page.evaluate(() => {
      const api = window.__vantaStudio;
      api.setCovered(true);
      const d = api.debug();
      return { charts: d.contactSurfaces, count: d.scene.children.length };
    });
    fs.writeFileSync(path.join(folder, "charts.json"), JSON.stringify(charts));
    const binary = fs.openSync(path.join(folder, "triangles.bin"), "w");
    try {
      for (let i = 0; i < count; i++) {
        const packed = await page.evaluate(index => {
          const object = window.__vantaStudio.debug().scene.children[index];
          if (!object.userData.studioStatic || !object.castShadow) return null;
          // The kit already puts these vertices in world coordinates.
          const g = object.geometry;
          const p = g.attributes.position;
          const indices = g.index;
          const points = new Float32Array((indices?.count ?? p.count) * 3);
          for (let j = 0; j < points.length/3; j++) {
            const k = indices ? indices.getX(j) : j;
            points[3*j] = p.getX(k); points[3*j+1] = p.getY(k); points[3*j+2] = p.getZ(k);
          }
          const bytes = new Uint8Array(points.buffer);
          let s = "";
          for (let k=0; k<bytes.length; k+=16384) s += String.fromCharCode(...bytes.subarray(k,k+16384));
          return btoa(s);
        }, i);
        if (packed) fs.writeSync(binary, Buffer.from(packed, "base64"));
      }
    } finally { fs.closeSync(binary); }
    await browser.close(); browser = null;
    const out = path.resolve(__dirname, "../public/materials/studio/surface-contact.webp");
    const result = spawnSync("blender", ["-b", "-noaudio", "--python-exit-code", "1", "--python",
      path.join(__dirname,"bakeStudioContact.py"), "--", folder, out], { stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error("The studio surface bake failed.");
  } finally {
    await browser?.close();
    fs.rmSync(folder, { recursive: true, force: true });
  }
}
bake(process.argv[2] || "http://localhost:3000").catch(error => { console.error(error); process.exitCode = 1; });

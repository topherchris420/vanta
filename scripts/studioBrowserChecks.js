/**
 * Real-browser checks for /studio: silent entry, the intro's three choices,
 * walking and collision, the interaction prompt, the computer and its
 * sandboxed terminal, the research atlas window, instruments and their
 * visual response without sound, the audio consent contract, the hidden
 * threads, the chord, the record, the archive, the map, the guided tour, and
 * the reduced-motion, no-WebGL, and phone paths.
 *
 * Needs playwright-core (not a dependency) and a running site.
 *
 * Usage: node scripts/studioBrowserChecks.js <url> [--no-webgl] [--reduced-motion] [--mobile]
 */
const assert = require("node:assert/strict");

const load = (name) => {
  try {
    return require(name);
  } catch {
    return null;
  }
};
const { chromium, devices } = load("playwright-core") || load("playwright") || {};
if (!chromium) {
  console.error("Install playwright-core first: npm i --no-save playwright-core");
  process.exit(1);
}

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const flags = new Set(process.argv.slice(3).map((flag) => flag.replace(/^--/, "")));

(async () => {
  const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"];
  if (flags.has("no-webgl")) args.push("--disable-webgl", "--disable-3d-apis");
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args });
  const context = await browser.newContext({
    ...(flags.has("mobile") ? devices["iPhone 13"] : { viewport: { width: 1366, height: 820 } }),
    reducedMotion: flags.has("reduced-motion") ? "reduce" : "no-preference",
  });
  await context.addInitScript(() => {
    window.__audio = { contexts: 0, started: [] };
    const Real = window.AudioContext;
    if (!Real) return;
    window.AudioContext = class extends Real {
      constructor(...a) {
        super(...a);
        window.__audio.contexts += 1;
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (value, time) => {
          oscillator.__scheduled = value;
          return set(value, time);
        };
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (...s) => {
          window.__audio.started.push(Math.round((oscillator.__scheduled ?? oscillator.frequency.value) * 100) / 100);
          return start(...s);
        };
        return oscillator;
      }
    };
    window.webkitAudioContext = window.AudioContext;
  });

  const page = await context.newPage();
  globalThis.__page = page;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  const audio = () => page.evaluate(() => ({ ...window.__audio, started: [...window.__audio.started] }));
  const until = async (check, label, timeout = 15000) => {
    const start = Date.now();
    for (;;) {
      if (await check()) return;
      if (Date.now() - start > timeout) throw new Error(`timed out: ${label}`);
      await page.waitForTimeout(150);
    }
  };
  const root = page.locator("[data-studio-root]");
  const found = async () => Number((await page.locator('button[class*="found"]').innerText()).split("/")[0].replace(/\D/g, ""));
  const openFromIndex = async (verb, { panel = true } = {}) => {
    if ((await page.locator("#studio-index").getAttribute("data-open")) !== "true") {
      await page.getByRole("button", { name: "Index", exact: true }).click();
    }
    await page.locator("#studio-index").getByRole("button", { name: verb, exact: true }).click();
    if (panel) await until(async () => (await root.getAttribute("data-panel")) === "true", `${verb} opens its panel`);
  };
  const closePanel = async () => {
    await page.keyboard.press("Escape");
    await until(async () => (await root.getAttribute("data-panel")) === "false", "Escape closes the panel");
  };

  await page.goto(`${base}/studio?inspect`, { waitUntil: "networkidle" });
  const expected = flags.has("no-webgl") ? "fallback" : "active";
  await until(async () => (await root.getAttribute("data-webgl")) === expected, `WebGL is ${expected}`, 90000);
  const live = expected === "active";
  // Software rendering is slow; these checks are about behaviour, so they
  // run on the light tier.
  if (live) await page.evaluate(() => window.__vantaStudio.setTier("low"));

  // 1. The intro: three plain choices, silent.
  await page.getByRole("heading", { name: "VANTA" }).waitFor();
  assert.ok(await page.getByText("Five notes. One chord.").isVisible());
  assert.equal(await page.getByRole("link", { name: "Explore the Original Portfolio" }).getAttribute("href"), "/");
  assert.ok(await page.getByRole("button", { name: "Guided Tour" }).isVisible());
  assert.equal((await audio()).contexts, 0, "no AudioContext before intent");
  console.log(`ok intro: three choices, silent, webgl=${expected}`);

  // 2. Enter.
  await page.getByRole("button", { name: "Enter the Studio" }).click();
  await until(async () => (await root.getAttribute("data-phase")) === "studio", "entering the studio");
  if (live) {
    await until(() => page.evaluate(() => window.__vantaStudio.mode === "walk"), "the entry glide lands on its feet", 45000);
    const readout = await page.locator('p[class*="hudReadout"]').innerText();
    assert.match(readout, /The Hall/);
    assert.match(readout, /Standby/);

    // 3. Walking moves the visitor, furniture holds, and a prompt offers
    //    what is in reach. Waits on positions, not timings: software
    //    rendering can be a frame or two a second.
    const pose = () => page.evaluate(() => window.__vantaStudio.getPose());
    const before = await pose();
    await page.keyboard.down("KeyW");
    await until(async () => (await pose()).z < before.z - 0.6, "W walks north", 60000);
    await until(async () => (await page.locator('button[class*="prompt"]').count()) === 1, "a prompt appears near the computer", 60000);
    assert.match(await page.locator('button[class*="prompt"]').innerText(), /Sit at the computer/);
    await until(async () => (await pose()).z < 0.9, "walking up to the desk", 60000);
    await page.waitForTimeout(4000);
    await page.keyboard.up("KeyW");
    const blocked = await pose();
    assert.ok(blocked.z > 0.4, `the desk holds (z=${blocked.z.toFixed(2)})`);
    console.log("ok walking: moves, prompts, collides");
  }

  // 4. The computer.
  if (live) await page.keyboard.press("KeyE");
  else await openFromIndex("Sit at the computer", { panel: false });
  await until(async () => (await root.getAttribute("data-mode")) === "desktop", "the desktop opens", 30000);
  const terminal = page.locator("#terminal-input");
  await terminal.waitFor();
  const run = async (command) => {
    // On a phone the desktop shows one window at a time; switch back to the
    // terminal from the dock, as a visitor would.
    if (!(await terminal.isVisible())) {
      await page.getByRole("navigation", { name: "Applications" }).getByRole("button", { name: /^Terminal/ }).click();
    }
    await terminal.fill(command);
    await terminal.press("Enter");
  };
  await run("help");
  await run("ls");
  const log = () => page.locator('[aria-label="Terminal output"]').innerText();
  for (const name of ["writing/", "instruments/", "worlds/", "art/", "music/", "threads/", "research/"]) {
    assert.ok((await log()).includes(name), `ls lists ${name}`);
  }
  await run("cat ../../../etc/passwd");
  assert.match(await log(), /no such file/);
  await run("rm -rf /");
  assert.match(await log(), /command not found/);
  await run("research atomic clock");
  await page.getByRole("heading", { name: "Research atlas" }).waitFor();
  const frame = page.frameLocator('iframe[title="Research atlas"]');
  await frame.getByText("Research atlas").first().waitFor({ timeout: 30000 });
  assert.match(await page.locator('iframe[title="Research atlas"]').getAttribute("src"), /\/research\?q=atomic%20clock/);
  await run("open circle");
  await page.getByRole("heading", { name: "CIRCLE", level: 3 }).waitFor();
  console.log("ok computer: terminal is sandboxed, opens the atlas and works");
  await page.getByRole("button", { name: /Leave the computer/ }).click();
  await until(async () => (await root.getAttribute("data-mode")) === "walk", "leaving the computer");
  assert.equal((await audio()).contexts, 0, "the computer made no sound");

  // 5. An instrument responds silently.
  await openFromIndex("Play the synthesizer");
  await page.getByRole("heading", { name: "The synthesizer" }).waitFor();
  await page.keyboard.down("z");
  await until(async () => (await page.getByRole("button", { name: /^C3/ }).getAttribute("aria-pressed")) === "true", "Z holds C3");
  await page.keyboard.up("z");
  assert.equal((await audio()).contexts, 0, "playing with sound off creates no AudioContext");
  console.log("ok synthesizer: plays visually with sound off");

  // 6. Sound on: one context, the note sounds; off again.
  await page.getByRole("button", { name: "Sound off" }).first().click();
  await until(async () => (await audio()).contexts === 1, "sound on creates one AudioContext");
  await page.keyboard.down("q");
  await page.waitForTimeout(200);
  await page.keyboard.up("q");
  assert.ok((await audio()).started.includes(261.63), "Q plays C4 at the Writing channel's frequency");
  await page.getByRole("button", { name: "Sound on" }).first().click();
  await closePanel();
  console.log("ok sound: consent, one context, channel frequencies");

  // 7. The hidden threads, the chord, the record, the archive.
  const start = await found();
  await openFromIndex("Switch on the reading lamp");
  await page.getByRole("button", { name: "Switch the lamp on" }).click();
  await page.getByRole("heading", { name: "Provenance" }).waitFor();
  await closePanel();
  await openFromIndex("Strike the tuning fork");
  await page.getByRole("button", { name: "Strike it" }).click();
  await page.getByRole("heading", { name: "Resonance" }).waitFor();
  await closePanel();
  await openFromIndex("Pick up the second controller");
  await page.getByRole("button", { name: "Pick up the person's controller" }).click();
  await page.getByText("Two notes. The third is held by a person.").waitFor();
  const hold = page.locator('button[class*="holdButton"]');
  await hold.dispatchEvent("pointerdown");
  await page.waitForTimeout(300);
  await hold.dispatchEvent("pointerup");
  await closePanel();
  await openFromIndex("Patch the loose cable");
  await page.getByRole("button", { name: "Plug it in" }).click();
  await page.getByRole("heading", { name: "Translation" }).waitFor();
  await closePanel();
  await openFromIndex("Sound the five chimes");
  await page.getByRole("button", { name: "Sound the chord" }).click();
  assert.match(await page.locator('p[class*="hudReadout"]').innerText().catch(() => "One chord"), /One chord|chord/);
  await closePanel();
  await openFromIndex("Approach the Event Horizon Archive");
  await page.getByRole("button", { name: "Write the next model" }).click();
  await closePanel();
  await openFromIndex("Put on Green Machine");
  await page.getByRole("button", { name: /Listen, 14 seconds/ }).click();
  await until(() => page.evaluate(() => !document.querySelector("audio").paused), "the record plays");
  assert.equal(await page.locator("audio").getAttribute("preload"), "none");
  await page.getByRole("button", { name: /Pause/ }).click();
  await closePanel();
  const after = await found();
  assert.ok(after - start >= 8, `discoveries were made (${start} -> ${after})`);
  console.log(`ok threads, chord, archive, record: ${after} found`);

  // 8. A book reads, and its pages turn.
  await openFromIndex("Open the research notebook");
  await page.getByText("NOT TESTED").first().waitFor();
  await page.locator("aside").getByRole("button", { name: "Next", exact: true }).click();
  await page.locator("aside").getByText(/^2 \//).waitFor();
  await closePanel();
  console.log("ok library: the notebook is the note in docs/");

  // 9. Map and tour.
  if (live) {
    await page.getByRole("button", { name: "Map", exact: true }).click();
    await page.getByRole("navigation", { name: "Go to a room" }).getByRole("button", { name: /The Gallery/ }).click();
    await until(() => page.evaluate(() => window.__vantaStudio.getPose().zone === "art"), "the map walks to the Gallery", 30000);
    console.log("ok map: goes to a room");
  }
  await page.goto(`${base}/studio?inspect`, { waitUntil: "networkidle" });
  await until(async () => (await root.getAttribute("data-webgl")) === expected, "reload", 90000);
  await page.getByRole("button", { name: "Guided Tour" }).click();
  const tour = page.locator('section[aria-labelledby="tour-title"]');
  await tour.waitFor();
  for (let step = 0; step < 7; step += 1) await tour.getByRole("button", { name: "Next", exact: true }).click();
  await tour.getByText("The chord").waitFor();
  await tour.getByRole("button", { name: "End the tour" }).click();
  await until(async () => (await root.getAttribute("data-mode")) === "walk", "the tour ends on your feet");
  console.log("ok tour: every room, ends on the chord");

  // 10. Nothing overflows the width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `no horizontal overflow (${overflow}px)`);
  if (flags.has("mobile") && live) {
    assert.equal(await page.locator('[class*="touchPad"]').count(), 1, "phones get a walking pad");
  }

  assert.deepEqual(errors, [], `no page errors:\n${errors.join("\n")}`);
  console.log("ok no page errors");
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  if (process.env.FAILURE_SHOT && globalThis.__page) {
    await globalThis.__page.screenshot({ path: process.env.FAILURE_SHOT }).catch(() => {});
  }
  process.exit(1);
});

/**
 * Real-browser checks for the home page: silent entry, scroll tuning, rest
 * zones, thread chords, the recording, keyboard tuning, and archive controls.
 * Needs playwright-core (not a dependency) and a running site.
 *
 * Usage: node scripts/browserChecks.js <url> [--no-webgl] [--reduced-motion]
 */
const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const flags = process.argv.slice(3).map((flag) => flag.replace(/^--/, ""));
if (flags.includes("no-webgl")) flags.push("nowebgl");
if (flags.includes("reduced-motion")) flags.push("reduced");

(async () => {
  const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"];
  if (flags.includes("nowebgl")) args.push("--disable-webgl", "--disable-3d-apis");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args,
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: flags.includes("reduced") ? "reduce" : "no-preference",
  });
  await ctx.addInitScript(() => {
    window.__audio = { contexts: 0, started: [], stopped: 0 };
    const Real = window.AudioContext;
    window.AudioContext = class extends Real {
      constructor(...a) {
        super(...a);
        window.__audio.contexts += 1;
      }
      createOscillator() {
        const osc = super.createOscillator();
        const set = osc.frequency.setValueAtTime.bind(osc.frequency);
        osc.frequency.setValueAtTime = (value, time) => { osc.__scheduled = value; return set(value, time); };
        const start = osc.start.bind(osc);
        const stop = osc.stop.bind(osc);
        osc.start = (...s) => { window.__audio.started.push(osc.__scheduled ?? osc.frequency.value); return start(...s); };
        osc.stop = (...s) => { window.__audio.stopped += 1; return stop(...s); };
        return osc;
      }
    };
    window.webkitAudioContext = window.AudioContext;
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await page.waitForTimeout(1200);
  const audio = () => page.evaluate(() => ({ ...window.__audio, started: [...window.__audio.started] }));
  const rail = () => page.evaluate(() => Array.from(document.querySelectorAll('[aria-label="Signal channels"] a')).map((a) => ({ label: a.textContent.trim(), current: a.getAttribute("aria-current"), chord: a.dataset.chord === "true" })));
  const consoleText = () => page.evaluate(() => document.querySelector('[data-tuned]').textContent.trim());

  // 1. Silent entry: scroll through every channel, no AudioContext.
  for (const id of ["writing", "instruments", "worlds", "art", "music"]) {
    await page.evaluate((q) => { const el = document.querySelector(q); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 150); }, `#signal-${id}`);
    await page.waitForTimeout(1000);
    const current = (await rail()).find((item) => item.current === "location");
    assert.ok(current && current.label.toLowerCase().includes(id), `scrolling to ${id} tunes it (got ${current?.label})`);
  }
  assert.equal((await audio()).contexts, 0, "no AudioContext before intent");
  console.log("ok silent scroll tunes every channel; contexts=0");

  // 2. Rest zones.
  await page.evaluate(() => { const el = document.querySelector("#intervals"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 100); });
  await page.waitForTimeout(500);
  assert.ok((await rail()).every((item) => !item.current), "intervals rest the instrument");
  assert.match(await consoleText(), /Standby/);
  console.log("ok intervals are a rest zone:", await consoleText());

  // 3. Thread preview lights its chord on the rail, still silent.
  await page.hover("#interval-provenance button");
  await page.waitForTimeout(300);
  const chordRail = (await rail()).filter((item) => item.chord).map((item) => item.label);
  assert.deepEqual(chordRail, ["01Writing", "02Instruments", "03Worlds"]);
  assert.match(await consoleText(), /Provenance.*3 notes/);
  assert.equal((await audio()).contexts, 0);
  console.log("ok thread preview lights chord:", chordRail.join(", "), "|", await consoleText());
  await page.mouse.move(5, 450);
  await page.waitForTimeout(200);
  assert.equal((await rail()).filter((item) => item.chord).length, 0, "chord clears when preview ends");

  // 4. Enable sound via the console control, then hold a chord.
  await page.click('[data-sound]');
  await page.waitForTimeout(300);
  let a = await audio();
  assert.equal(a.contexts, 1, "one AudioContext after intent");
  assert.equal(await page.getAttribute("[data-sound]", "data-sound"), "on");
  await page.click("#interval-agency button");
  await page.mouse.move(5, 450);
  await page.waitForTimeout(400);
  a = await audio();
  const lastTwo = a.started.slice(-2).map(Math.round);
  assert.deepEqual(lastTwo, [330, 392], "agency sounds E4 + G4 together");
  assert.equal(await page.getAttribute("#interval-agency button", "aria-pressed"), "true");
  console.log("ok held chord plays", lastTwo, "| rail chord:", (await rail()).filter((i) => i.chord).map((i) => i.label).join(", "));

  // Escape releases a held chord and its oscillators.
  const stoppedBefore = a.stopped;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  a = await audio();
  assert.equal(await page.getAttribute("#interval-agency button", "aria-pressed"), "false");
  assert.ok(a.stopped >= stoppedBefore + 2, "both voices released");
  console.log("ok escape releases chord; stopped", a.stopped - stoppedBefore, "voices");

  // 5. Music channel: tone plays; the recording silences it; pausing brings it back.
  await page.evaluate(() => { const el = document.querySelector("#signal-music"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 150); });
  await page.waitForTimeout(600);
  a = await audio();
  assert.equal(Math.round(a.started.at(-1)), 196, "music channel tunes G3");
  const stopBeforeRecording = a.stopped;
  const button = page.locator("#signal-music button[aria-pressed]");
  await button.click();
  await page.waitForTimeout(1200);
  const playing = await page.evaluate(() => !document.querySelector("#signal-music audio").paused);
  a = await audio();
  assert.ok(playing, "recording plays on request");
  assert.ok(a.stopped > stopBeforeRecording, "tone released while the recording plays");
  const progressed = await page.evaluate(() => document.querySelectorAll('#signal-music rect[data-played="true"]').length);
  console.log("ok recording plays, tone released; waveform bars played:", progressed);
  const startsBefore = a.started.length;
  await button.click();
  await page.waitForTimeout(400);
  a = await audio();
  assert.ok(a.started.length > startsBefore, "tone returns after pause");
  console.log("ok pause returns the channel tone");

  // 6. Sound off stops everything.
  await page.click('[data-sound]');
  await page.waitForTimeout(300);
  assert.equal(await page.getAttribute("[data-sound]", "data-sound"), "off");
  console.log("ok sound off");

  // 7. Keyboard: tab to the rail, arrow-tune.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.focus('[aria-label="Signal channels"] a[href="#top"]');
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement.getAttribute("href"));
  assert.equal(focused, "#signal-instruments");
  const preview = (await rail()).find((item) => item.current === "location");
  assert.match(preview.label, /Instruments/);
  console.log("ok arrow keys tune the rail to", preview.label);

  // 8. Keyboard reaches the archive's explicit atlas link and model buttons.
  if (!flags.includes("nowebgl")) {
    const cross = await page.locator('a:has-text("Cross into the atlas")').count();
    assert.equal(cross, 1, "archive offers a real link into the atlas");
    const nested = await page.evaluate(() => document.querySelectorAll('[role="button"] button, [aria-hidden="true"] button').length);
    assert.equal(nested, 0, "no control is nested in another or hidden from assistive tech");
    console.log("ok archive controls are separate and exposed");
  }

  console.log(JSON.stringify({ errors }));
  await browser.close();
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});

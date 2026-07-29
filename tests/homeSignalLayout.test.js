const assert = require("node:assert/strict");
const { once } = require("node:events");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

const HOST = "127.0.0.1";
const ROOT = path.resolve(__dirname, "..");
const NEXT_BIN = require.resolve("next/dist/bin/next");

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const findAvailablePort = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, HOST, () => {
      const { port } = probe.address();
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });

const startNextServer = (port) => {
  const output = [];
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "dev", "--hostname", HOST, "--port", String(port)],
    {
      cwd: ROOT,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );

  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  return { child, output };
};

const waitForRenderedHome = async (url, child, output) => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(
        `Next dev server exited with ${child.exitCode}.\n${output.join("")}`
      );
    }

    try {
      const response = await fetch(url);
      if (response.status) return response;
    } catch {
      // The server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Next dev server did not respond.\n${output.join("")}`);
};

const stopNextServer = async (child) => {
  if (child.exitCode !== null) return;

  const exited = once(child, "exit");
  child.kill();
  await Promise.race([exited, delay(3000)]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "exit"), delay(1000)]);
  }
};

test(
  "rendered home is a silent five-channel Resonant Instrument",
  { timeout: 60000 },
  async (t) => {
    const port = await findAvailablePort();
    const { child, output } = startNextServer(port);
    t.after(() => stopNextServer(child));

    const response = await waitForRenderedHome(
      `http://${HOST}:${port}/`,
      child,
      output
    );
    const html = await response.text();

    assert.equal(response.status, 200);
    ["Five mediums.", "One signal.", "Enter the instrument", "Explore without sound"]
      .forEach((copy) => assert.ok(html.includes(copy), `missing rendered copy: ${copy}`));

    assert.ok(html.includes('aria-label="Signal channels"'));
    assert.match(html, /<section[^>]*id="top"[^>]*aria-labelledby="signal-title"/);
    assert.doesNotMatch(html, /<div[^>]*id="top"/);
    assert.equal((html.match(/data-signal-channel="/g) ?? []).length, 5);
    ["books", "apps", "art", "frequency", "music"].forEach((id) =>
      assert.ok(html.includes(`data-signal-channel="${id}"`))
    );

    [
      "https://a.co/d/078d1kaa",
      "https://woodyard.streamlit.app/",
      "https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics",
      "https://github.com/topherchris420/james_library",
      "https://oncyber.io/stanfordgsb",
      "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
      "https://woodyard.dappling.network",
      "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7",
      "https://chriswoodyard.bandcamp.com/",
      "https://chriswoodyard.bandcamp.com/track/creators-innovators",
      "https://mitpress.vercel.app/",
      "mailto:christopher@vers3dynamics.com",
      "https://huggingface.co/ciaochris",
      "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
      "https://arpa-h.vercel.app/",
    ].forEach((url) => assert.ok(html.includes(url), `missing rendered URL: ${url}`));

    [
      "A studio of one, tuned to many frequencies.",
      "Off the grid",
      "Knicks in 5",
      "Hi, I",
      "Open to collaborations",
    ].forEach((copy) =>
      assert.ok(!html.includes(copy), `retired copy still rendered: ${copy}`)
    );

    assert.ok(html.includes('aria-pressed="false"'));
    assert.ok(html.includes("Sound off"));
    assert.ok(!html.includes("Sound on"));
    assert.ok(html.includes('data-sound="off"'));
    assert.ok(!html.includes('data-sound="on"'));

    // The console boots untuned on the hero, and no channel claims the signal
    // until the visitor scrolls or previews one.
    assert.ok(html.includes('data-tuned="false"'));
    assert.ok(!html.includes('data-tuned="true"'));
    assert.ok(html.includes("Standby"));
    assert.equal((html.match(/STANDBY/g) ?? []).length, 5);
    assert.ok(!html.includes("SIGNAL ACTIVE"));
    assert.ok(html.includes("Scroll to tune"));

    // The rail is keyboard-tunable and says so to assistive technology.
    assert.ok(html.includes('aria-describedby="frequency-rail-hint"'));
    assert.ok(html.includes("Use the arrow keys to tune between channels."));

    // Every unbreakable headline publishes the width budget its column must
    // respect, so no display type is ever clipped.
    assert.ok(html.includes("--title-em:10.44"));
    assert.ok(html.includes("--title-em:11.6"));

    const notFoundResponse = await fetch(
      `http://${HOST}:${port}/missing-signal-test-route`
    );
    const notFoundHtml = await notFoundResponse.text();
    const notFoundMain = notFoundHtml.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";

    assert.equal(notFoundResponse.status, 404);
    assert.ok(notFoundHtml.includes('href="#main-content"'));
    assert.match(notFoundMain, /<main[^>]*id="main-content"/);
    assert.ok(notFoundMain.includes(">404<"));
    assert.ok(notFoundMain.includes("Back to the signal"));
    assert.equal((notFoundMain.match(/<a\b/g) ?? []).length, 1);
    assert.ok(notFoundMain.includes('href="/"'));
    assert.ok(!notFoundMain.includes('href="/#work"'));
  }
);

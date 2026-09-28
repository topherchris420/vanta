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
    const practice = require("../data/practice");
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
    const channelIds = practice.channels.map((channel) => channel.id);
    assert.deepEqual(channelIds, ["writing", "instruments", "worlds", "art", "music"]);

    const workIndex = html.match(/<nav[^>]*aria-label="Choose an instrument"[\s\S]*?<\/nav>/)?.[0] ?? "";
    assert.ok(workIndex, "visitors can scan all five instruments before exploring");
    for (const id of channelIds) {
      assert.ok(workIndex.includes(`href="#signal-${id}"`), `index reaches ${id}`);
    }
    assert.match(html, /href="\/research"[^>]*>\s*Research/);
    ["Five notes.", "One chord.", "Enter the instrument", "Explore without sound", "captain of my soul"]
      .forEach((copy) => assert.ok(html.includes(copy), `missing rendered copy: ${copy}`));

    // A stranger learns what Christopher makes before any metaphor.
    const hero = html.match(/<section[^>]*id="top"[\s\S]*?<\/section>/)?.[0] ?? "";
    ["Poems", "speculative physics", "research instruments", "Simulated worlds", "Indigo People"]
      .forEach((copy) => assert.ok(hero.includes(copy), `hero does not say: ${copy}`));

    assert.ok(html.includes('aria-label="Signal channels"'));
    assert.match(html, /<section[^>]*id="top"[^>]*aria-labelledby="signal-title"/);
    assert.doesNotMatch(html, /<div[^>]*id="top"/);
    channelIds.forEach((id) =>
      assert.equal((html.match(new RegExp(`data-signal-channel="${id}"`, "g")) ?? []).length, 1)
    );
    assert.equal((html.match(/data-signal-channel="hero"/g) ?? []).length, 1);
    assert.equal((html.match(/data-signal-channel="rest"/g) ?? []).length, 3);

    // Every work renders with an anchor, its question, and every receipt.
    practice.works.forEach((work) => {
      assert.ok(html.includes(`id="work-${work.id}"`), `missing work ${work.id}`);
      work.evidence.forEach((link) =>
        assert.ok(html.includes(link.href.replace(/&/g, "&amp;")), `missing receipt ${link.href}`)
      );
    });
    [
      "https://mitpress.vercel.app/",
      "mailto:christopher@vers3dynamics.com",
      "https://huggingface.co/ciaochris",
      "https://github.com/topherchris420",
      "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976",
      "https://vers3dynamics.com/",
    ].forEach((url) => assert.ok(html.includes(url), `missing rendered URL: ${url}`));

    // Real artifacts, not decoration: served locally, sized, lazy.
    ["/work/circle-polygraph.webp", "/work/pine-gap-agent-run.webp", "/work/green-machine-cover.webp", "/work/cymatics-circular-bloom.webp"]
      .forEach((src) => assert.match(html, new RegExp(`<img[^>]*src="${src}"[^>]*>`)));
    (html.match(/<img[^>]*>/g) ?? []).forEach((img) => {
      assert.match(img, /width="\d+"/);
      assert.match(img, /height="\d+"/);
      assert.match(img, /loading="lazy"/);
      assert.match(img, /alt="[^"]{20,}"/);
    });
    // The recording waits to be asked.
    assert.match(html, /<audio[^>]*preload="none"/);
    assert.doesNotMatch(html, /<audio[^>]*autoplay/i);

    // Intervals are tunable, and all start released.
    assert.ok(html.includes("Same question, another instrument."));
    assert.equal((html.match(/<li[^>]*id="interval-/g) ?? []).length, practice.threads.length);
    assert.ok(html.includes(practice.epigraph.href.replace(/&/g, "&amp;")));

    // Now is a curated pointer at a work, not a feed.
    assert.match(html, new RegExp(`href="#work-${practice.now.work}"`));

    [
      "A studio of one, tuned to many frequencies.",
      "Off the grid",
      "Knicks in 5",
      "Hi, I",
      "Open to collaborations",
      "Latest build",
      "Lop Nur Twin game",
      "Explore AI/ML Projects",
      "Read Inspiration Source",
      "consciousness engine",
      "SINGULARITY PORTAL",
    ].forEach((copy) =>
      assert.ok(!html.includes(copy), `retired copy still rendered: ${copy}`)
    );

    // Metadata puts the person first; the lab is an affiliation.
    assert.match(html, /<title[^>]*>Christopher Woodyard — Vanta<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/mitpress\.vercel\.app\/"/);
    assert.match(html, /<meta property="og:site_name" content="Vanta"/);
    const jsonLd = JSON.parse(
      html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]
    );
    const personNode = jsonLd["@graph"].find((node) => node["@type"] === "Person");
    assert.equal(personNode.name, "Christopher Woodyard");
    assert.equal(personNode.jobTitle, undefined, "a job title is not the person");
    assert.equal(personNode.affiliation.name, "Vers3Dynamics");
    assert.ok(personNode.sameAs.includes("https://github.com/topherchris420"));

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
    assert.ok(!html.includes('data-chord="true"'));
    assert.ok(html.includes("Scroll to tune"));

    // The rail is keyboard-tunable and says so to assistive technology.
    assert.ok(html.includes('aria-describedby="frequency-rail-hint"'));
    assert.ok(html.includes("Use the arrow keys to tune between channels."));

    // Every unbreakable headline publishes the width budget its column must
    // respect, so no display type is ever clipped.
    assert.ok(html.includes("--title-em:12.76"), "Instruments publishes its width");
    assert.ok(html.includes("--title-em:11.6"), "the footer publishes its width");

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

    const researchResponse = await fetch(
      `http://${HOST}:${port}/research`
    );
    const researchHtml = await researchResponse.text();
    assert.equal(researchResponse.status, 200);
    assert.ok(researchHtml.includes("Research atlas"));
    assert.ok(researchHtml.includes("Local catalog"));
    assert.ok(researchHtml.includes("Portfolio"));
    assert.ok(researchHtml.includes("Catalog entry"));
    assert.ok(researchHtml.includes("Quantum Information"));
    assert.ok(researchHtml.includes("not an endorsement or a verification"));
  }
);

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const practice = require("../data/practice");
const catalog = require("../data/research/curatedKnowledge.json");
const { buildStudioContent } = require("../lib/studio/content");

const ROOT = path.resolve(__dirname, "..");
const content = buildStudioContent({
  practice,
  documents: catalog.documents,
  notes: { mathResearch: fs.readFileSync(path.join(ROOT, "docs", "MATH_RESEARCH.md"), "utf8") },
});

test("live experiences are exactly the works marked Live, linked as the work links itself", () => {
  const live = practice.works.filter((work) => work.status.includes("Live"));
  assert.deepEqual(content.live.map((entry) => entry.id), live.map((work) => work.id));
  content.live.forEach((entry) => {
    const work = practice.works.find((candidate) => candidate.id === entry.id);
    assert.ok(work.evidence.some((link) => link.href === entry.href), `${entry.id} launches one of its own receipts`);
    assert.deepEqual(entry.status, work.status, "status is carried, never upgraded");
  });
  assert.ok(!content.live.some((entry) => entry.id === "circle"), "a prototype is not offered as a live experience");
});

test("every image in the studio is one the portfolio already holds", () => {
  const sources = new Set();
  practice.channels.forEach(({ artifact }) => {
    if (artifact.kind === "gallery") artifact.panels.forEach((panel) => sources.add(panel.src));
    if (artifact.kind === "figure") sources.add(artifact.src);
  });
  assert.deepEqual(new Set(content.artworks.map((art) => art.src)), sources);
  content.artworks.forEach((art) => {
    assert.ok(fs.existsSync(path.join(ROOT, "public", art.src)), `${art.src} is served locally`);
    assert.ok(art.alt.length > 20, `${art.src} keeps its description`);
  });
});

test("threads carry the chord the home page plays for them", () => {
  const signal = require("../lib/signalExperience");
  const model = require("../lib/practice");
  content.threads.forEach((thread) => {
    const source = practice.threads.find((entry) => entry.id === thread.id);
    assert.deepEqual(thread.frequencies, model.threadChord(source, practice.works, practice.channels));
    assert.equal(thread.notes.length, thread.channelIds.length);
    assert.ok(thread.hiddenIn, `${thread.id} is hidden somewhere in the studio`);
  });
  assert.deepEqual(content.coda, signal.createCoda(practice.channels));
  assert.equal(content.coda.chordName, "C major");
});

test("every work can be found from the computer, and the catalog count is real", () => {
  practice.works.forEach((work) => assert.ok(content.objectForWork[work.id], `${work.id} has an object`));
  assert.equal(content.recordCount, catalog.documents.length);
  assert.equal(content.tour.length, practice.channels.length + 3);
});

test("the studio never invents content or reaches for the network", () => {
  const sceneDir = path.join(ROOT, "lib", "studio", "scene");
  const files = [
    ...fs.readdirSync(sceneDir).map((name) => path.join(sceneDir, name)),
    ...["layout.js", "navigation.js", "quality.js", "instruments.js", "library.js", "terminal.js", "content.js"].map((name) =>
      path.join(ROOT, "lib", "studio", name)
    ),
  ];
  files.forEach((file) => {
    const source = fs.readFileSync(file, "utf8");
    const name = path.relative(ROOT, file);
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|WebSocket/, `${name} makes no requests`);
    assert.doesNotMatch(source, /AudioContext/, `${name} never touches audio`);
    assert.doesNotMatch(source, /\beval\(|new Function\(/, `${name} never evaluates code`);
    assert.doesNotMatch(source, /https?:\/\/(?!github\.com\/topherchris420\/vanta)/, `${name} hard-codes no outside URL`);
  });
  // Images come only from the practice model's own artifacts.
  const rooms = fs.readFileSync(path.join(sceneDir, "rooms.js"), "utf8");
  assert.doesNotMatch(rooms, /loadImage\(\s*["'`]/, "no image path is written into the scene by hand");
});

test("only the sound switch can create an AudioContext", () => {
  const hook = fs.readFileSync(path.join(ROOT, "hooks", "useStudioAudio.js"), "utf8");
  assert.equal((hook.match(/new AudioCtx\(/g) ?? []).length, 1, "one place constructs a context");
  assert.equal((hook.match(/ensureContext\(\)/g) ?? []).length, 1, "and only enableSound asks for it");
  assert.match(hook, /const enableSound = useCallback\(async \(\) => \{\s*const context = ensureContext\(\);/);
  const page = fs.readFileSync(path.join(ROOT, "pages", "studio.js"), "utf8");
  assert.doesNotMatch(page, /autoplay|autoPlay/);
  assert.doesNotMatch(page, /enableSound\(\)/, "the page never switches sound on by itself");
  const recording = fs.readFileSync(path.join(ROOT, "hooks", "useRecording.js"), "utf8");
  assert.match(recording, /preload="none"/);
});

test("the studio mounts the home page's own Event Horizon Archive", () => {
  const archive = fs.readFileSync(path.join(ROOT, "lib", "eventHorizonArchive.js"), "utf8");
  assert.match(archive, /embedded = false/);
  assert.match(archive, /if \(!embedded\) root\.add\(createStarfield/);
  const scene = fs.readFileSync(path.join(ROOT, "lib", "studio", "scene", "index.js"), "utf8");
  assert.match(scene, /createEventHorizonArchive\(\{[\s\S]*embedded: true/);
  assert.match(scene, /ARCHIVE_DETAIL\[tier\.archiveDetail\]/, "and builds it at the same detail tiers");
});

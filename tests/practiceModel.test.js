const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const practice = require("../data/practice");
const {
  STATUSES,
  threadChannels,
  threadChord,
  threadsForWork,
  validatePractice,
} = require("../lib/practice");

const clone = () => JSON.parse(JSON.stringify(practice));

test("the canonical practice model is internally consistent", () => {
  assert.equal(validatePractice(practice), true);
  assert.equal(practice.channels.length, 5);
  assert.deepEqual(
    practice.channels.map((channel) => channel.title),
    ["Writing", "Instruments", "Worlds", "Art", "Music"]
  );
});

test("every work leads with receipts and a factual status", () => {
  practice.works.forEach((work) => {
    assert.ok(work.evidence.length >= 1, `${work.id} has no receipt`);
    work.evidence.forEach((link) => {
      assert.equal(new URL(link.href).protocol, "https:", `${work.id} links over http`);
    });
    const hrefs = work.evidence.map((link) => link.href);
    assert.equal(new Set(hrefs).size, hrefs.length, `${work.id} repeats a receipt`);
    work.status.forEach((status) => assert.ok(STATUSES.includes(status)));
  });
});

test("status words describe what happened, never how good it is", () => {
  const judgements = /best|featured|groundbreaking|advanced|award|flagship|top/i;
  STATUSES.forEach((status) => assert.doesNotMatch(status, judgements));
});

test("every artifact the page shows is a real file served from public/", () => {
  practice.channels.forEach((channel) => {
    const { artifact } = channel;
    const files =
      artifact.kind === "gallery"
        ? artifact.panels.map((panel) => panel.src)
        : artifact.src
          ? [artifact.src]
          : [];
    files.forEach((src) => {
      const file = path.join(__dirname, "..", "public", src);
      assert.ok(fs.existsSync(file), `${channel.id} artifact missing: ${src}`);
      assert.ok(fs.statSync(file).size < 400 * 1024, `${src} is heavier than the page can justify`);
    });
    if (artifact.kind === "figure" || artifact.kind === "gallery") {
      (artifact.panels || [artifact]).forEach((panel) => {
        assert.ok(panel.alt.length > 20, `${channel.id} image needs a real description`);
        assert.ok(panel.width > 0 && panel.height > 0, "images reserve their space");
      });
    }
    if (artifact.kind === "recording") {
      assert.ok(artifact.peaks.every((peak) => peak >= 0 && peak <= 1));
      assert.ok(artifact.duration > 0 && artifact.duration <= 30, "an excerpt, not a jukebox");
    }
  });
});

test("threads are intervals: each spans channels and sounds as a chord", () => {
  const { threads, works, channels } = practice;
  threads.forEach((thread) => {
    const spanned = threadChannels(thread, works, channels);
    assert.ok(spanned.length >= 2, `${thread.id} connects fewer than two channels`);
    const chord = threadChord(thread, works, channels);
    assert.equal(chord.length, spanned.length);
  });
  const all = new Set(threads.flatMap((thread) => threadChannels(thread, works, channels)));
  assert.equal(all.size, 5, "together the intervals touch every note");
  const chords = threads.map((thread) => threadChord(thread, works, channels).join());
  assert.equal(new Set(chords).size, chords.length, "no two threads sound the same chord");
  assert.ok(threadsForWork("circle", threads).length >= 2);
});

test("cross-channel echoes point at other channels", () => {
  practice.works
    .filter((work) => work.alsoIn)
    .forEach((work) => assert.ok(!work.alsoIn.includes(work.channel)));
  const music = practice.works.find((work) => work.id === "green-machine");
  assert.ok(music.alsoIn.includes("worlds"), "the album is the radio in Pine Gap");
});

test("now is chosen by hand and points at a work on the page", () => {
  const work = practice.works.find((candidate) => candidate.id === practice.now.work);
  assert.ok(work);
  assert.match(practice.now.asOf, /^\d{4}-\d{2}$/);
});

test("validation refuses a claim without a receipt", () => {
  const broken = clone();
  broken.works[0].evidence = [];
  assert.throws(() => validatePractice(broken), /receipt/);
});

test("validation refuses a subjective badge", () => {
  const broken = clone();
  broken.works[0].status = ["Featured"];
  assert.throws(() => validatePractice(broken), /unknown status/);
});

test("validation refuses a work its channel does not list", () => {
  const broken = clone();
  broken.works[0].channel = "music";
  assert.throws(() => validatePractice(broken), /lists|listed/);
});

test("validation refuses a thread that stays inside one channel", () => {
  const broken = clone();
  broken.threads[0].works = ["life-of-a-line", "location-papers"];
  assert.throws(() => validatePractice(broken), /two channels/);
});

test("validation refuses an artifact hosted somewhere else", () => {
  const broken = clone();
  broken.channels[1].artifact.src = "https://example.com/polygraph.png";
  assert.throws(() => validatePractice(broken), /served from this site/);
});

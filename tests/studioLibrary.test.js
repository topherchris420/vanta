const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const practice = require("../data/practice");
const catalog = require("../data/research/curatedKnowledge.json");
const library = require("../lib/studio/library");
const layoutModel = require("../lib/studio/layout");

const mathResearch = fs.readFileSync(
  path.join(__dirname, "..", "docs", "MATH_RESEARCH.md"),
  "utf8"
);
const volumes = library.buildLibrary({
  practice,
  documents: catalog.documents,
  notes: { mathResearch },
});

const allText = (value) =>
  JSON.stringify(value).replace(/\\"/g, '"');

test("markdown is parsed into the few block types the reader draws", () => {
  const blocks = library.parseMarkdown(
    [
      "# Title",
      "",
      "A paragraph with **bold**, *italic*, `code` and a [link](https://example.org/a).",
      "wrapped onto a second line.",
      "",
      "- one",
      "- two with",
      "  a continuation",
      "",
      "1. first",
      "2. second",
      "",
      "```sh",
      "npm test",
      "```",
      "",
      "> quoted",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "---",
    ].join("\n")
  );
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["h", "p", "list", "list", "code", "quote", "table", "rule"]
  );
  assert.equal(blocks[0].level, 1);
  assert.deepEqual(
    blocks[1].spans.map((span) => span.t),
    ["text", "strong", "text", "em", "text", "code", "text", "link", "text"]
  );
  assert.equal(blocks[1].spans[7].href, "https://example.org/a");
  assert.ok(library.plainText(blocks[1].spans).endsWith("wrapped onto a second line."));
  assert.equal(blocks[2].ordered, false);
  assert.equal(library.plainText(blocks[2].items[1]), "two with a continuation");
  assert.equal(blocks[3].ordered, true);
  assert.equal(blocks[4].text, "npm test");
  assert.equal(blocks[6].rows.length, 2, "the divider row is dropped");
});

test("links that could run script are demoted to plain text", () => {
  const spans = library.parseInline(
    "[safe](https://example.org) [site](/research) [bad](javascript:alert(1)) [worse](data:text/html,x) [odd](//evil.example)"
  );
  assert.deepEqual(
    spans.filter((span) => span.t === "link").map((span) => span.href),
    ["https://example.org", "/research"]
  );
  assert.ok(!JSON.stringify(spans).includes("javascript:"));
});

test("pages turn at second-level headings", () => {
  const pages = library.paginate(
    library.parseMarkdown("# Book\n\nIntro.\n\n## One\n\nA.\n\n### Sub\n\nB.\n\n## Two\n\nC.")
  );
  assert.deepEqual(pages.map((page) => page.title), ["Book", "One", "Two"]);
  assert.equal(pages[1].blocks.length, 4, "third-level headings stay on their page");
});

test("every book on the reading table has a volume, and every volume is on the table", () => {
  const layout = layoutModel.buildStudioLayout(practice);
  const shelved = layout.objects
    .filter((object) => object.kind === "book")
    .map((object) => object.ref.volume);
  assert.deepEqual([...shelved].sort(), volumes.map((volume) => volume.id).sort());
  volumes.forEach((volume) => {
    assert.ok(volume.pages.length >= 1);
    assert.ok(volume.provenance.length > 20, `${volume.id} states what it is`);
    assert.match(volume.source.href, /^(https:\/\/|\/)/, `${volume.id} points at its original`);
    volume.pages.forEach((page) => assert.ok(page.blocks.length, "no blank pages"));
  });
});

test("the research notebook is the note in docs/, word for word", () => {
  const notebook = volumes.find((volume) => volume.id === "math-research");
  const text = allText(notebook.pages);
  [
    "Does shared mathematical vocabulary cause unsupported provenance links in the research atlas?",
    "State: proposed, not tested.",
    "Required negative control:",
    "NOT TESTED",
  ].forEach((sentence) => assert.ok(text.includes(sentence), `notebook keeps: ${sentence}`));
  assert.match(notebook.provenance, /Not tested/);
  assert.ok(notebook.pages.length >= 5, "one page per section of the note");
});

test("the library never invents writing", () => {
  // Life of a Line's poems are not in the repository, so the book says so.
  const book = volumes.find((volume) => volume.id === "life-of-a-line");
  const work = practice.works.find((entry) => entry.id === "life-of-a-line");
  assert.ok(allText(book.pages).includes(work.body));
  assert.match(book.provenance, /not reproduced here/);
  assert.equal(book.pages.length, 2, "a title page and a pointer to the paperback, nothing else");
  assert.equal(book.source.href, work.evidence[0].href);

  // Every catalog page is a real record by Christopher, with its own abstract.
  const byTitle = new Map(catalog.documents.map((record) => [record.title, record]));
  const preprints = volumes.find((volume) => volume.id === "preprints");
  preprints.pages.slice(1).forEach((page) => {
    const record = byTitle.get(page.title);
    assert.ok(record, `${page.title} is a catalog record`);
    assert.ok(record.authors.includes("Christopher Woodyard"));
    assert.ok(allText(page.blocks).includes(JSON.stringify(record.abstract).slice(1, -1).replace(/\\"/g, '"')));
    assert.ok(allText(page.blocks).includes(record.url));
  });
  assert.match(preprints.provenance, /None is peer reviewed/);
  assert.match(preprints.provenance, /Inclusion is not verification/);

  const location = volumes.find((volume) => volume.id === "location-papers");
  assert.match(location.provenance, /Not peer reviewed/);
  assert.ok(allText(location.pages).includes("Location is a property of the object."));
  assert.ok(allText(location.pages).includes("https://doi.org/10.5281/zenodo.18285322"));

  const epigraph = volumes.find((volume) => volume.id === "resonant-intelligence");
  assert.ok(allText(epigraph.pages).includes(practice.epigraph.text));
  assert.equal(epigraph.source.href, practice.epigraph.href);
});

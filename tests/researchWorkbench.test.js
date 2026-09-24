const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_SESSION,
  parseSession,
  serializeSession,
  parseReadingList,
  createReadingListExport,
} = require("../lib/research/workbench");
const SearchEngine = require("../lib/research/searchEngine");
const data = require("../data/research/curatedKnowledge.json");
const engine = new SearchEngine(data);
const nodes = new Set(engine.getFullGraph().nodes.map((node) => node.id));
const ids = new Set(engine.getAllDocuments().map((doc) => doc.id));

test("shared research links round-trip Unicode, filters, ordering, view, and a selected record", () => {
  const session = {
    ...DEFAULT_SESSION,
    q: "EEG & sound / α",
    discipline: "Biosignal Processing",
    era: "Cold War Era (1947–1975)",
    links: "showInferred",
    sort: "title-asc",
    view: "map",
    node: [...nodes][0],
  };
  const url = serializeSession(session, nodes);
  assert.deepEqual(parseSession(url.split("?")[1], nodes), session);
  assert.equal(serializeSession(DEFAULT_SESSION, nodes), "/research");
});

test("malformed and unknown URL state cannot become active controls or selected nodes", () => {
  const state = parseSession(
    "?q=" +
      "x".repeat(500) +
      "&discipline=Bad&links=Bad&sort=Bad&node=unknown&view=Bad&tracking=secret",
    nodes,
  );
  assert.equal(state.q.length, 300);
  assert.deepEqual({ ...state, q: "" }, DEFAULT_SESSION);
  assert.ok(!serializeSession(state, nodes).includes("tracking"));
});

test("reading lists recover from invalid storage and ignore stale, duplicate, and non-string IDs", () => {
  const id = [...ids][0];
  for (const raw of [null, "", "{", "{}", "null"])
    assert.deepEqual(parseReadingList(raw, ids), []);
  assert.deepEqual(
    parseReadingList(JSON.stringify([id, id, "removed", {}, 4]), ids),
    [id],
  );
});

test("reading-list exports preserve source metadata, list order, and an explicit provenance boundary", () => {
  const chosen = [...ids].slice(0, 2).reverse();
  const result = createReadingListExport(
    [...chosen, chosen[0], "unknown"],
    engine.getAllDocuments(),
  );
  assert.deepEqual(
    result.records.map((record) => record.id),
    chosen,
  );
  assert.match(result.provenance, /not been independently verified/);
  assert.ok(
    result.records.every((record) => record.url && record.authors.length),
  );
  assert.deepEqual(
    result,
    createReadingListExport(chosen, engine.getAllDocuments()),
  );
});

test("zero-match queries and restrictive filters produce empty graphs, never the full corpus", () => {
  for (const options of [
    {},
    { provenanceFilter: "verifiedOnly" },
    { provenanceFilter: "showInferred" },
  ]) {
    const result = engine.search("zzzznomatchzzzz", options);
    assert.equal(result.results.length, 0);
    assert.deepEqual(result.graph, { nodes: [], edges: [] });
  }
  assert.deepEqual(engine.search("", { tag: "missing discipline" }).graph, {
    nodes: [],
    edges: [],
  });
});

test("saved-record graph contains the requested records and their connected neighborhood", () => {
  const id = [...ids][0];
  const result = engine.search("", { documentIds: [id] });
  assert.deepEqual(
    result.results.map((entry) => entry.document.id),
    [id],
  );
  assert.ok(result.graph.nodes.some((node) => node.id === id));
  const graphIds = new Set(result.graph.nodes.map((node) => node.id));
  assert.ok(
    result.graph.edges.every(
      (edge) => graphIds.has(edge.source) && graphIds.has(edge.target),
    ),
  );
  assert.deepEqual(engine.search("", { documentIds: [] }).graph, {
    nodes: [],
    edges: [],
  });
});

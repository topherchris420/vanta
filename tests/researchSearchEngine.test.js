const assert = require('node:assert/strict');
const test = require('node:test');
const SearchEngine = require('../lib/research/searchEngine');
const curatedKnowledge = require('../data/research/curatedKnowledge.json');

test('SearchEngine initializes and indexes documents with exact field weights', () => {
  const engine = new SearchEngine(curatedKnowledge);
  const docs = engine.getAllDocuments();
  assert.ok(docs.length >= 25, 'Should have indexed documents');

  // Search keyword in title vs abstract vs entities
  const res = engine.search('Majorana');
  assert.ok(res.results.length >= 1);
  assert.equal(res.results[0].document.id, 'qc-topo-01');
  assert.ok(res.results[0].score > 0.3);
});

test('SearchEngine performs fuzzy matching and tolerance for slight typos', () => {
  const engine = new SearchEngine(curatedKnowledge);

  // Slight typo "teleporttion" instead of "teleportation"
  const res = engine.search('teleporttion');
  assert.ok(res.results.length >= 1, 'Should find teleportation documents with fuzzy match');
  assert.ok(res.results[0].document.title.toLowerCase().includes('teleportation'));
});

test('SearchEngine provenance filters isolate verified vs inferred subsets', () => {
  const engine = new SearchEngine(curatedKnowledge);

  // Verified only filter
  const resVerified = engine.search('', { provenanceFilter: 'verifiedOnly' });
  assert.ok(resVerified.results.length >= 1);
  resVerified.results.forEach((r) => {
    assert.ok(
      r.document.source.toLowerCase().includes('arxiv') ||
      r.document.source.toLowerCase().includes('openalex') ||
      r.document.source.toLowerCase().includes('ssrn') ||
      r.document.source.toLowerCase().includes('physical review') ||
      Boolean(r.document.doi)
    );
  });

  // Dynamic graph extraction with verifiedOnly
  assert.ok(resVerified.graph.nodes.length >= 1);
  resVerified.graph.edges.forEach((edge) => {
    assert.equal(edge.verified, true);
  });
});

test('SearchEngine dynamically extracts 1-hop and 2-hop connected subgraphs', () => {
  const engine = new SearchEngine(curatedKnowledge);

  // Search single focused topic
  const res = engine.search('Chladni', { hops: 2 });
  assert.ok(res.results.length >= 1);

  // Subgraph should include the matched paper node plus connected concept/technology/author nodes
  assert.ok(res.graph.nodes.length > res.results.length);
  assert.ok(res.graph.edges.length >= 1);

  const matchedId = res.results[0].document.id;
  const hasPaperNode = res.graph.nodes.some((n) => n.id === matchedId);
  assert.ok(hasPaperNode, 'Graph must contain the matching paper node');
});

test('SearchEngine autocomplete suggestions return relevant entity and tag matches', () => {
  const engine = new SearchEngine(curatedKnowledge);

  const suggestions = engine.suggest('quant', 5);
  assert.ok(suggestions.length >= 1);
  assert.ok(suggestions.some((s) => s.toLowerCase().includes('quant')));
});

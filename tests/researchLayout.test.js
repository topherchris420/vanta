const assert = require('node:assert/strict');
const test = require('node:test');
const { defaultProvider } = require('../lib/research/providers');
const { buildGraphFromDocuments, getNodeNeighborhood } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData } = require('../lib/research/types');
const rawCuratedKnowledge = require('../data/research/curatedKnowledge.json');

test('research page end-to-end data pipeline integrity', async () => {
  const { documents } = normalizeKnowledgeData(rawCuratedKnowledge);
  // 1. Provider loads all documents
  const allDocs = defaultProvider.getAllDocuments();
  assert.equal(allDocs.length, documents.length);

  // 2. Search query yields scored results
  const searchRes = await defaultProvider.search('Quantum', { sortBy: 'relevance' });
  assert.ok(searchRes.results.length >= 1);
  assert.ok(searchRes.total >= 1);

  // 3. Graph generation handles filtered and full dataset
  const graphFull = buildGraphFromDocuments(allDocs);
  assert.ok(graphFull.nodes.length > 50, 'Graph should have rich multi-type nodes');
  assert.ok(graphFull.edges.length > 30, 'Graph should have relational edges');

  // Verify node type distributions
  const types = new Set(graphFull.nodes.map((n) => n.type));
  assert.ok(types.has('Paper'));
  assert.ok(types.has('Concept') || types.has('Technology'));
  assert.ok(types.has('Author'));

  // 4. Neighborhood extraction
  const firstPaper = graphFull.nodes.find((n) => n.type === 'Paper');
  assert.ok(firstPaper);
  const neighborhood = getNodeNeighborhood(graphFull, firstPaper.id);
  assert.ok(neighborhood.nodes.length >= 1);
});

test('curated knowledge covers all required scientific disciplines with valid URLs', () => {
  const { documents } = normalizeKnowledgeData(rawCuratedKnowledge);
  const { DISCIPLINES } = require('../lib/research/workbench');

  // Every discipline the filter offers leads at least one real record, and
  // every record files under an offered discipline.
  DISCIPLINES.filter((disc) => disc !== 'All').forEach((disc) => {
    const matches = documents.filter((d) => d.tags[0] === disc);
    assert.ok(matches.length >= 1, `No record files under ${disc}`);
  });
  documents.forEach((d) => {
    assert.ok(DISCIPLINES.includes(d.tags[0]), `${d.id} files under unknown discipline ${d.tags[0]}`);
    assert.doesNotThrow(() => new URL(d.url), `${d.id} has an invalid URL`);
  });
});

test('Research.module.css exposes proper 3D graph container layout styles for desktop viewports', () => {
  const fs = require('fs');
  const path = require('path');
  const cssPath = path.join(__dirname, '../styles/Research.module.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Verify desktop main layout uses a two-column split layout for search panel and 3D graph container
  assert.ok(css.includes('.main {'), 'CSS must define .main layout container');
  assert.ok(css.includes('grid-template-columns: minmax(360px, 460px) 1fr;'), 'CSS desktop layout must split search panel and 3D graph');
  assert.ok(css.includes('.graphContainer {'), 'CSS must define .graphContainer layout block');
});

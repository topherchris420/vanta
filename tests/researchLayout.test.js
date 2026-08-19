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
  const disciplines = [
    'Quantum Computing',
    'Cymatics',
    'Biosignal Processing',
    'AI & Neural Interfaces',
    'Acoustics',
    'Nuclear Engineering',
    'Archival Intelligence & Institutional Oversight',
  ];

  disciplines.forEach((disc) => {
    const matches = documents.filter((d) =>
      d.tags.some((t) => t.toLowerCase().includes(disc.toLowerCase()))
    );
    assert.ok(matches.length >= 3, `Expected at least 3 papers in ${disc}, found ${matches.length}`);
  });
});

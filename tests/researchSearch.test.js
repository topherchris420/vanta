const assert = require('node:assert/strict');
const test = require('node:test');
const { LocalProvider } = require('../lib/research/providers');
const { normalizeKnowledgeData } = require('../lib/research/types');
const rawCuratedKnowledge = require('../data/research/curatedKnowledge.json');

test('LocalProvider performs fast TF-IDF and fuzzy search', async () => {
  const provider = new LocalProvider(rawCuratedKnowledge);
  const { documents } = normalizeKnowledgeData(rawCuratedKnowledge);

  // A distinctive title term ranks its record first
  const resClock = await provider.search('Atomic Clock');
  assert.ok(resClock.results.length >= 1, 'Should find the clock-bound preprint');
  assert.equal(resClock.results[0].document.id, 'zenodo-bounding-gamma');
  assert.ok(resClock.results[0].score > 0);

  const resBlueBook = await provider.search('Blue Book');
  assert.ok(resBlueBook.results.length >= 1);
  assert.equal(resBlueBook.results[0].document.id, 'arch-bluebook-07');

  // Search by author "Woodyard" finds his preprints and repositories
  const resAuthor = await provider.search('Woodyard');
  assert.ok(resAuthor.results.length >= 20);

  // Search with empty query returns all documents
  const resAll = await provider.search('');
  assert.equal(resAll.results.length, documents.length);
});

test('LocalProvider supports discipline filtering and sorting', async () => {
  const provider = new LocalProvider(rawCuratedKnowledge);

  // Filter by discipline tag
  const resPhysics = await provider.search('', { tag: 'Speculative Physics' });
  assert.ok(resPhysics.results.length >= 4);
  resPhysics.results.forEach((r) => {
    assert.ok(r.document.tags.includes('Speculative Physics'));
  });

  // Sort by date descending
  const resDateDesc = await provider.search('', { sortBy: 'date-desc' });
  for (let i = 0; i < resDateDesc.results.length - 1; i++) {
    assert.ok(resDateDesc.results[i].document.date >= resDateDesc.results[i + 1].document.date);
  }
});

test('LocalProvider generates autocomplete query suggestions', async () => {
  const provider = new LocalProvider(rawCuratedKnowledge);

  const suggestions = await provider.suggest('quan', 5);
  assert.ok(suggestions.length >= 1);
  assert.ok(suggestions.some((s) => s.toLowerCase().includes('quan')));
});

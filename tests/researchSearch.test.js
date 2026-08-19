const assert = require('node:assert/strict');
const test = require('node:test');
const { LocalProvider } = require('../lib/research/providers');
const curatedKnowledge = require('../data/research/curatedKnowledge.json');

test('LocalProvider performs fast TF-IDF and fuzzy search', async () => {
  const provider = new LocalProvider(curatedKnowledge);

  // Search keyword "Majorana"
  const resMajorana = await provider.search('Majorana');
  assert.ok(resMajorana.results.length >= 1, 'Should find Majorana paper');
  assert.equal(resMajorana.results[0].document.id, 'qc-topo-01');
  assert.ok(resMajorana.results[0].score > 0);

  // Search keyword "Chladni"
  const resChladni = await provider.search('Chladni');
  assert.ok(resChladni.results.length >= 1);
  assert.equal(resChladni.results[0].document.id, 'cym-chladni-01');

  // Search by author "Woodyard"
  const resAuthor = await provider.search('Woodyard');
  assert.ok(resAuthor.results.length >= 20);

  // Search with empty query returns all documents
  const resAll = await provider.search('');
  assert.equal(resAll.results.length, curatedKnowledge.length);
});

test('LocalProvider supports discipline filtering and sorting', async () => {
  const provider = new LocalProvider(curatedKnowledge);

  // Filter by tag "Nuclear Engineering"
  const resNuc = await provider.search('', { tag: 'Nuclear Engineering' });
  assert.ok(resNuc.results.length >= 4);
  resNuc.results.forEach((r) => {
    assert.ok(r.document.tags.includes('Nuclear Engineering'));
  });

  // Sort by date descending
  const resDateDesc = await provider.search('', { sortBy: 'date-desc' });
  for (let i = 0; i < resDateDesc.results.length - 1; i++) {
    assert.ok(resDateDesc.results[i].document.date >= resDateDesc.results[i + 1].document.date);
  }
});

test('LocalProvider generates autocomplete query suggestions', async () => {
  const provider = new LocalProvider(curatedKnowledge);

  const suggestions = await provider.suggest('quan', 5);
  assert.ok(suggestions.length >= 1);
  assert.ok(suggestions.some((s) => s.toLowerCase().includes('quan')));
});

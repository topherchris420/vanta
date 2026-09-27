const assert = require('node:assert/strict');
const test = require('node:test');
const rawCuratedKnowledge = require('../data/research/curatedKnowledge.json');
const { buildGraphFromDocuments } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData } = require('../lib/research/types');
const practice = require('../data/practice');

const { documents, graph } = normalizeKnowledgeData(rawCuratedKnowledge);
const byId = new Map(documents.map((doc) => [doc.id, doc]));

// Where a record credited to Christopher is allowed to point: his own
// preprint deposits and his own repositories. A journal DOI under his name
// would need a real, checked publication first.
const OWN_DOI = /^10\.(5281\/zenodo\.\d+|17605\/osf\.io\/\w+)$/;
const OWN_URL = [
  'https://doi.org/10.5281/zenodo.',
  'https://doi.org/10.17605/osf.io/',
  'https://github.com/topherchris420/',
  'https://huggingface.co/datasets/ciaochris/',
];

test('records credited to Christopher point only at his own deposits and repositories', () => {
  const credited = documents.filter((doc) =>
    doc.authors.some((author) => author.startsWith('Christopher Woodyard'))
  );
  assert.ok(credited.length >= 20);
  credited.forEach((doc) => {
    if (doc.doi) assert.match(doc.doi, OWN_DOI, `${doc.id} carries a DOI he did not deposit`);
    assert.ok(
      OWN_URL.some((prefix) => doc.url.startsWith(prefix)),
      `${doc.id} links outside his own deposits: ${doc.url}`
    );
  });
});

test('unreviewed work says so in its own summary', () => {
  documents
    .filter((doc) => doc.tags.includes('Preprint') || doc.source.startsWith('R.A.I.N. Lab corpus'))
    .forEach((doc) => {
      assert.match(doc.abstract, /not peer reviewed/i, `${doc.id} must state it is not peer reviewed`);
    });
});

test('fabricated records removed in September 2026 stay removed', () => {
  [
    'qc-topo-01',
    'cym-chladni-01',
    'bio-eeg-01',
    'ai-bci-01',
    'nuc-fusion-01',
    'dataset-openneuro-ds003838',
    'dataset-zenodo-vibroacoustic-resonance',
  ].forEach((id) => assert.ok(!byId.has(id), `${id} is back`));
  const dois = new Set(documents.map((doc) => doc.doi).filter(Boolean));
  ['10.48550/arXiv.2603.08411', '10.5281/zenodo.1084291', '10.57967/hf/2891'].forEach((doi) =>
    assert.ok(!dois.has(doi), `${doi} does not belong to the record it was attached to`)
  );
});

test('stated relations point at real records and say why', () => {
  let stated = 0;
  documents.forEach((doc) =>
    (doc.relations || []).forEach((relation) => {
      stated += 1;
      assert.ok(byId.has(relation.target), `${doc.id} relates to missing ${relation.target}`);
      assert.ok(relation.basis.length > 20, `${doc.id} → ${relation.target} needs a basis`);
    })
  );
  assert.ok(stated >= 10);
  const statedEdges = graph.edges.filter((edge) => edge.basis);
  assert.equal(statedEdges.length, stated, 'every stated relation becomes one reasoned edge');
  statedEdges.forEach((edge) => assert.equal(edge.verified, true));
  graph.edges
    .filter((edge) => byId.has(edge.source) && byId.has(edge.target) && !edge.basis)
    .forEach((edge) => assert.equal(edge.verified, false, 'record-to-record links without a basis are inferred'));
});

test('portfolio links in the atlas resolve to works on the home page', () => {
  const works = new Set(practice.works.map((work) => work.id));
  const linked = documents.flatMap((doc) => doc.practice || []);
  assert.ok(linked.length >= 6);
  linked.forEach((id) => assert.ok(works.has(id), `atlas links to unknown work ${id}`));
});

test('the stored graph is the graph the documents produce', () => {
  const rebuilt = buildGraphFromDocuments(documents);
  assert.deepEqual(
    graph.nodes.map((node) => node.id).sort(),
    rebuilt.nodes.map((node) => node.id).sort()
  );
  assert.equal(graph.edges.length, rebuilt.edges.length);
});

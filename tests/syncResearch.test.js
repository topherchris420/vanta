const assert = require('node:assert/strict');
const test = require('node:test');
const {
  parseArxivAtom,
  parseOpenAlexResponse,
  reconstructOpenAlexAbstract,
  extractEntities,
} = require('../scripts/syncResearch');

test('parseArxivAtom parses Atom XML into structured research documents', () => {
  const sampleAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2603.12345v1</id>
    <published>2026-03-10T14:22:00Z</published>
    <title>Quantum Teleportation Across Resonant Acoustic Cavities</title>
    <summary>We demonstrate high-fidelity continuous-variable quantum teleportation using phononic crystal cavities and superconducting qubits.</summary>
    <author><name>Alice Smith</name></author>
    <author><name>Bob Jones</name></author>
    <category term="quant-ph"/>
    <arxiv:doi xmlns:arxiv="http://arxiv.org/schemas/atom">10.48550/arXiv.2603.12345</arxiv:doi>
  </entry>
</feed>`;

  const docs = parseArxivAtom(sampleAtom);
  assert.equal(docs.length, 1);
  assert.equal(docs[0].id, 'arxiv:2603.12345v1');
  assert.equal(docs[0].title, 'Quantum Teleportation Across Resonant Acoustic Cavities');
  assert.equal(docs[0].source, 'arXiv');
  assert.equal(docs[0].doi, '10.48550/arXiv.2603.12345');
  assert.deepEqual(docs[0].authors, ['Alice Smith', 'Bob Jones']);
  assert.ok(docs[0].tags.includes('quant-ph'));
  assert.ok(docs[0].entities.includes('Quantum Teleportation'));
});

test('reconstructOpenAlexAbstract correctly reconstructs word positions from inverted index', () => {
  const invertedIndex = {
    'Nonlinear': [0],
    'cymatics': [1],
    'and': [2],
    'acoustic': [3],
    'resonance': [4],
    'patterns': [5],
  };

  const text = reconstructOpenAlexAbstract(invertedIndex);
  assert.equal(text, 'Nonlinear cymatics and acoustic resonance patterns');
});

test('parseOpenAlexResponse parses OpenAlex JSON into structured research documents', () => {
  const sampleJson = JSON.stringify({
    results: [
      {
        id: 'https://openalex.org/W987654321',
        title: 'Neural Interface Decoding with Riemannian Manifolds',
        publication_date: '2026-02-15',
        doi: 'https://doi.org/10.1038/s41586-026-00123-x',
        abstract_inverted_index: {
          'Riemannian': [0],
          'geometry': [1],
          'for': [2],
          'brain-computer': [3],
          'interfaces': [4],
        },
        authorships: [
          { author: { display_name: 'Dr. Elena Rostova' } },
        ],
        primary_topic: { display_name: 'Neural Engineering' },
        concepts: [
          { display_name: 'Brain-Computer Interface' },
          { display_name: 'Neural Manifold' },
        ],
        open_access: { oa_url: 'https://nature.com/articles/sample' },
      },
    ],
  });

  const docs = parseOpenAlexResponse(sampleJson);
  assert.equal(docs.length, 1);
  assert.equal(docs[0].id, 'openalex:W987654321');
  assert.equal(docs[0].source, 'OpenAlex');
  assert.equal(docs[0].doi, '10.1038/s41586-026-00123-x');
  assert.ok(docs[0].entities.includes('Brain-Computer Interface'));
});

test('extractEntities identifies key scientific concepts and physical systems', () => {
  const sample = 'Superconducting Nanowire device utilizing Majorana Zero Mode for Fault Tolerant Qubit routing.';
  const entities = extractEntities(sample);
  assert.ok(entities.includes('Superconducting Nanowire'));
  assert.ok(entities.includes('Majorana Zero Mode'));
  assert.ok(entities.includes('Qubit'));
});

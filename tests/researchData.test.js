const assert = require('node:assert/strict');
const test = require('node:test');
const { validateDocument, validateGraphNode, validateGraphEdge, normalizeKnowledgeData } = require('../lib/research/types');
const rawCuratedKnowledge = require('../data/research/curatedKnowledge.json');

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

test('curated knowledge dataset contains at least 25 structured records across all 6 core domains', () => {
  const { documents, graph } = normalizeKnowledgeData(rawCuratedKnowledge);
  assert.ok(Array.isArray(documents), 'Documents must be an array');
  assert.ok(documents.length >= 25, `Expected at least 25 records, found ${documents.length}`);

  const expectedDomains = [
    'Quantum Computing',
    'Cymatics',
    'Biosignal Processing',
    'AI & Neural Interfaces',
    'Acoustics',
    'Nuclear Engineering',
    'Archival Intelligence & Institutional Oversight',
  ];

  const foundDomains = new Set();
  const ids = new Set();

  documents.forEach((doc) => {
    // Validate each document against schema
    assert.doesNotThrow(() => validateDocument(doc), `Document ${doc.id} failed validation`);

    // Verify ID uniqueness
    assert.ok(!ids.has(doc.id), `Duplicate document ID: ${doc.id}`);
    ids.add(doc.id);

    // Verify fields
    assert.ok(doc.title.length > 5, 'Title too short');
    assert.ok(doc.abstract.length > 20, 'Abstract too short');
    assert.ok(doc.authors.length >= 1, 'Authors required');
    assert.ok(doc.tags.length >= 1, 'Tags required');
    assert.ok(doc.entities.length >= 1, 'Entities required');
    assert.ok(isValidUrl(doc.url), `Invalid URL for ${doc.id}: ${doc.url}`);

    // Track domains
    doc.tags.forEach((tag) => {
      expectedDomains.forEach((domain) => {
        if (tag.toLowerCase().includes(domain.toLowerCase())) {
          foundDomains.add(domain);
        }
      });
    });
  });

  expectedDomains.forEach((domain) => {
    assert.ok(foundDomains.has(domain), `Missing coverage for domain: ${domain}`);
  });
});

test('types validation correctly accepts and rejects nodes, edges, and documents', () => {
  assert.throws(() => validateDocument({}), /requires a valid string id/);
  assert.throws(() => validateGraphNode({ id: 'n1', label: 'L', type: 'InvalidType', provenance: 'Local Index' }), /invalid type/);
  assert.throws(() => validateGraphNode({ id: 'n1', label: 'L', type: 'Paper', provenance: 'FakeProvenance' }), /invalid provenance/);
  assert.throws(() => validateGraphEdge({ source: 'a', target: 'b', relationship: 'INVALID_REL' }), /invalid relationship/);

  // Validate oversight node & edge types are accepted
  assert.doesNotThrow(() => validateGraphNode({ id: 'm1', label: 'M', type: 'Memorandum', provenance: 'Declassified Record' }));
  assert.doesNotThrow(() => validateGraphNode({ id: 'h1', label: 'H', type: 'Hearing', provenance: 'Source Verified' }));
  assert.doesNotThrow(() => validateGraphNode({ id: 'ag1', label: 'A', type: 'Agency', provenance: 'Source Verified' }));
  assert.doesNotThrow(() => validateGraphEdge({ source: 'a', target: 'b', relationship: 'SUPERVISED' }));
  assert.doesNotThrow(() => validateGraphEdge({ source: 'a', target: 'b', relationship: 'TESTIFIED_IN' }));
  assert.doesNotThrow(() => validateGraphEdge({ source: 'a', target: 'b', relationship: 'CORRELATED_WITH' }));
});

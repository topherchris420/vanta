const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGraphFromDocuments, getNodeNeighborhood, classifyEntity, slugify } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData } = require('../lib/research/types');
const rawCuratedKnowledge = require('../data/research/curatedKnowledge.json');

test('graphEngine transforms documents into connected 3D nodes and edges with provenance', () => {
  const { documents } = normalizeKnowledgeData(rawCuratedKnowledge);
  const graph = buildGraphFromDocuments(documents);

  assert.ok(graph.nodes.length > documents.length, 'Should have paper nodes + entities/authors');
  assert.ok(graph.edges.length > 20, 'Should have connected edges');

  // Check paper node properties
  const paperNode = graph.nodes.find((n) => n.id === 'qc-topo-01');
  assert.ok(paperNode);
  assert.equal(paperNode.type, 'Paper');
  assert.equal(paperNode.provenance, 'Source Verified');
  assert.ok(Number.isFinite(paperNode.x) && Number.isFinite(paperNode.y) && Number.isFinite(paperNode.z));

  // Check edge types and relationships
  graph.edges.forEach((edge) => {
    assert.ok(edge.source && edge.target);
    assert.ok(['CITES', 'BUILDS_ON', 'EXTENDS', 'USES', 'CONTRADICTS'].includes(edge.relationship));
    assert.ok(edge.weight > 0);
  });

  // Check neighborhood helper
  const neighborhood = getNodeNeighborhood(graph, 'qc-topo-01');
  assert.ok(neighborhood.nodes.length >= 2, 'Should find connected nodes');
  assert.ok(neighborhood.edges.length >= 1, 'Should find connected edges');
});

test('classifyEntity correctly categorizes hardware vs concepts vs datasets', () => {
  assert.equal(classifyEntity('FPGA Accelerator'), 'Technology');
  assert.equal(classifyEntity('Neuromorphic Chip Loihi'), 'Technology');
  assert.equal(classifyEntity('64-Channel EEG Recordings'), 'Dataset');
  assert.equal(classifyEntity('Majorana Zero Mode'), 'Concept');
});

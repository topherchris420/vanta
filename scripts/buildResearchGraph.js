/**
 * Rebuilds the stored graph in data/research/curatedKnowledge.json from its
 * documents. Run after editing records by hand.
 *
 * Usage: npm run build:research-graph
 */
const fs = require('fs');
const path = require('path');
const { buildGraphFromDocuments } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData, validateDocument } = require('../lib/research/types');

const DATA_PATH = path.resolve(__dirname, '../data/research/curatedKnowledge.json');
const { documents } = normalizeKnowledgeData(JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')));
documents.forEach(validateDocument);
const graph = buildGraphFromDocuments(documents);
fs.writeFileSync(DATA_PATH, JSON.stringify({ documents, graph }, null, 2) + '\n');
console.log(`${documents.length} records, ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);

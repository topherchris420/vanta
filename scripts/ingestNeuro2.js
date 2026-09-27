/**
 * @fileoverview Refreshes the one Neuro2 record the catalog can defend: the
 * public Hugging Face mirror (ciaochris/neuro2-neuroscience-datasets).
 *
 * Earlier versions of this script wrote individual dataset records with
 * invented authors and DOIs. It now only updates the mirror record's date from
 * the Hub's own metadata. Individual datasets belong in the catalog only when
 * their DOI, title, and authors have been checked against the repository that
 * hosts them.
 *
 * Usage: node scripts/ingestNeuro2.js
 */

const fs = require('fs');
const path = require('path');
const { buildGraphFromDocuments } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData, validateDocument } = require('../lib/research/types');

const DATA_PATH = path.resolve(__dirname, '../data/research/curatedKnowledge.json');
const DATASET = 'ciaochris/neuro2-neuroscience-datasets';
const RECORD_ID = 'dataset-neuro2-complete-atlas';

async function main() {
  const response = await fetch(`https://huggingface.co/api/datasets/${DATASET}`, {
    headers: { 'User-Agent': 'Vanta-Research-Explorer/1.0 (mailto:christopher@vers3dynamics.com)' },
  });
  if (!response.ok) {
    throw new Error(`Hugging Face responded ${response.status}`);
  }
  const meta = await response.json();
  const lastModified = String(meta.lastModified || '').slice(0, 10);

  const { documents } = normalizeKnowledgeData(JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')));
  const record = documents.find((doc) => doc.id === RECORD_ID);
  if (!record) {
    throw new Error(`${RECORD_ID} is missing from the catalog; add it by hand after checking the dataset card.`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(lastModified)) {
    record.date = lastModified;
  }
  validateDocument(record);

  const graph = buildGraphFromDocuments(documents);
  fs.writeFileSync(DATA_PATH, JSON.stringify({ documents, graph }, null, 2) + '\n');
  console.log(`Neuro2 mirror record dated ${record.date}; ${documents.length} records, ${graph.nodes.length} nodes.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

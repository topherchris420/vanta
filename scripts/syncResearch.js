/**
 * @fileoverview Academic Research Ingestion CLI Pipeline.
 * Fetches scientific publications from arXiv and OpenAlex, extracts entities and relationships,
 * assigns provenance tracking, and updates data/research/curatedKnowledge.json.
 * 
 * Usage: node scripts/syncResearch.js
 */

const fs = require('fs');
const path = require('path');
const { buildGraphFromDocuments, slugify, classifyEntity } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData, validateDocument } = require('../lib/research/types');

const DATA_PATH = path.resolve(__dirname, '../data/research/curatedKnowledge.json');

const SEARCH_TOPICS = [
  'quantum teleportation',
  'cymatics',
  'biosignal processing',
  'neural interface',
  'acoustic resonance',
  'neuroscience dataset',
  'brain-computer interface',
];

/**
 * Helper to perform HTTP GET with timeout.
 * @param {string} url
 * @param {number} [timeoutMs=8000]
 * @returns {Promise<string>}
 */
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Vanta-Research-Explorer/1.0 (mailto:christopher@vers3dynamics.com)',
        Accept: 'application/json, application/atom+xml, text/xml, */*',
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Parses XML text into arXiv document entries without external dependencies.
 * @param {string} xmlText
 * @returns {import('../lib/research/types').ResearchDocument[]}
 */
function parseArxivAtom(xmlText) {
  const documents = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];

    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const rawId = idMatch ? idMatch[1].trim() : '';
    const arxivId = rawId.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', '');

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const rawTitle = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').trim()
      : 'Untitled arXiv Paper';

    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const rawAbstract = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, ' ').trim()
      : 'No abstract provided.';

    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const rawDate = publishedMatch
      ? publishedMatch[1].trim().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const doiMatch = entry.match(/<arxiv:doi[^>]*>(.*?)<\/arxiv:doi>/);
    const doi = doiMatch ? doiMatch[1].trim() : undefined;

    // Authors
    const authors = [];
    const authorRegex = /<author>\s*<name>(.*?)<\/name>\s*<\/author>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    // Categories / Tags
    const tags = new Set(['arXiv']);
    const categoryRegex = /<category term="([^"]+)"/g;
    let catMatch;
    while ((catMatch = categoryRegex.exec(entry)) !== null) {
      tags.add(catMatch[1].trim());
    }

    // Entities extraction from title & abstract
    const entities = extractEntities(rawTitle + ' ' + rawAbstract);

    if (arxivId && rawTitle) {
      const doc = {
        id: 'arxiv:' + arxivId,
        title: rawTitle,
        abstract: rawAbstract,
        date: rawDate,
        authors: authors.length > 0 ? authors : ['arXiv Researcher'],
        doi,
        source: 'arXiv',
        url: 'https://arxiv.org/abs/' + arxivId,
        tags: Array.from(tags).slice(0, 5),
        entities: entities.slice(0, 6),
      };
      documents.push(doc);
    }
  }

  return documents;
}

/**
 * Reconstructs full abstract from OpenAlex inverted index.
 * @param {Record<string, number[]>} invertedIndex
 * @returns {string}
 */
function reconstructOpenAlexAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const wordPositions = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordPositions[pos] = word;
    }
  }
  return wordPositions.filter(Boolean).join(' ');
}

/**
 * Parses OpenAlex JSON API response into ResearchDocument array.
 * @param {string} jsonText
 * @returns {import('../lib/research/types').ResearchDocument[]}
 */
function parseOpenAlexResponse(jsonText) {
  const documents = [];
  try {
    const data = JSON.parse(jsonText);
    const works = data.results || [];

    works.forEach((work) => {
      if (!work.title) return;

      const abstract =
        reconstructOpenAlexAbstract(work.abstract_inverted_index) ||
        `Open-access scientific literature indexed via OpenAlex (citations: ${work.cited_by_count || 0}).`;

      const authors = (work.authorships || [])
        .map((a) => a.author && a.author.display_name)
        .filter(Boolean);

      const tags = new Set(['OpenAlex']);
      if (work.primary_topic && work.primary_topic.display_name) {
        tags.add(work.primary_topic.display_name);
      }
      (work.concepts || []).slice(0, 4).forEach((c) => {
        if (c.display_name) tags.add(c.display_name);
      });

      const entities = (work.concepts || [])
        .map((c) => c.display_name)
        .filter(Boolean);

      const docId = work.id
        ? work.id.replace('https://openalex.org/', 'openalex:')
        : 'openalex:' + slugify(work.title).slice(0, 32);

      const url =
        (work.open_access && work.open_access.oa_url) ||
        work.doi ||
        (work.primary_location && work.primary_location.landing_page_url) ||
        work.id ||
        'https://openalex.org';

      const doc = {
        id: docId,
        title: work.title,
        abstract,
        date: work.publication_date || new Date().toISOString().slice(0, 10),
        authors: authors.length > 0 ? authors : ['OpenAlex Contributor'],
        doi: work.doi ? work.doi.replace('https://doi.org/', '') : undefined,
        source: 'OpenAlex',
        url,
        tags: Array.from(tags).slice(0, 5),
        entities: entities.length > 0 ? entities.slice(0, 6) : extractEntities(work.title + ' ' + abstract),
      };
      documents.push(doc);
    });
  } catch (err) {
    console.warn('Error parsing OpenAlex response:', err.message);
  }

  return documents;
}

/**
 * Extracts key scientific entities and terms from text.
 * @param {string} text
 * @returns {string[]}
 */
function extractEntities(text) {
  if (!text) return [];
  const knownKeywords = [
    'Qubit',
    'Quantum Teleportation',
    'Entanglement Entropy',
    'Majorana Zero Mode',
    'Superconducting Nanowire',
    'Cavity QED',
    'Chladni Resonator',
    'Faraday Wave',
    'Acoustic Levitation',
    'Soliton',
    'Auditory Geometry',
    'Electroencephalography',
    'Phase Synchronization',
    'Heart Rate Variability',
    'Photoplethysmography',
    'Slow-Wave Sleep',
    'Brain-Computer Interface',
    'Neural Manifold',
    'Neuromorphic Architecture',
    'Diffusion Model',
    'Acoustic Metamaterial',
    'Sonoluminescence',
    'Infrasound Waveguide',
    'Magneto-Inertial Confinement',
    'Molten Salt Reactor',
    'Muon-Catalyzed Fusion',
    'Ultrasonic Waveguide',
    'Cavitation Dynamics',
    'FPGA Accelerator',
    'Spiking Transformer',
    'Magnetoencephalography',
    'fMRI',
    'Electrophysiology',
    'Neuropixels',
    'fNIRS',
    'Auditory Evoked Potential',
    'Motor Imagery',
    'Polysomnography',
    'Sensorimotor Rhythm',
    'OpenNeuro',
    'PhysioNet',
    'DANDI Archive',
    'BNCI Horizon',
    'Neuro2 Atlas',
    'Multi-Agent Simulation',
    'Coupled Dynamical Field',
    'Environmental Coherence',
    'Reciprocal Rank Fusion',
    'BM25 Retrieval',
    'Dense Vector Search',
    'Citation-First Synthesis',
    'NASA NTRS',
    'DOE OSTI',
    'R.A.I.N. DataMatrix',
    'TRIBE v2 Brain Encoding',
    'fMRI Response Prediction',
    'Multi-Agent Deliberation',
    'ZeroClaw Runtime',
    'Formal Logic Verification',
  ];

  const extracted = new Set();
  const lower = text.toLowerCase();

  knownKeywords.forEach((kw) => {
    if (lower.includes(kw.toLowerCase())) {
      extracted.add(kw);
    }
  });

  // Fallback: extract capitalized keywords or significant terms
  if (extracted.size === 0) {
    const words = text
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && /^[A-Z]/.test(w));
    words.slice(0, 3).forEach((w) => extracted.add(w));
  }

  if (extracted.size === 0) {
    extracted.add('Scientific Artifact');
  }

  return Array.from(extracted);
}

/**
 * Fetches publications from arXiv API.
 * @returns {Promise<import('../lib/research/types').ResearchDocument[]>}
 */
async function fetchArxivPapers() {
  const query = SEARCH_TOPICS.map((t) => `all:"${t}"`).join('+OR+');
  const url = `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending`;

  try {
    console.log('[arXiv] Fetching query from arXiv API...');
    const xml = await fetchWithTimeout(url, 9000);
    const docs = parseArxivAtom(xml);
    console.log(`[arXiv] Successfully parsed ${docs.length} papers`);
    return docs;
  } catch (err) {
    console.warn(`[arXiv] Fetch failed or timed out: ${err.message}. Proceeding with offline merge.`);
    return [];
  }
}

/**
 * Fetches publications from OpenAlex API.
 * @returns {Promise<import('../lib/research/types').ResearchDocument[]>}
 */
async function fetchOpenAlexPapers() {
  const query = encodeURIComponent(SEARCH_TOPICS.join('|'));
  const url = `https://api.openalex.org/works?filter=default.search:${query},open_access.is_oa:true&sort=cited_by_count:desc&per-page=15`;

  try {
    console.log('[OpenAlex] Fetching works from OpenAlex API...');
    const json = await fetchWithTimeout(url, 9000);
    const docs = parseOpenAlexResponse(json);
    console.log(`[OpenAlex] Successfully parsed ${docs.length} works`);
    return docs;
  } catch (err) {
    console.warn(`[OpenAlex] Fetch failed or timed out: ${err.message}. Proceeding with offline merge.`);
    return [];
  }
}

/**
 * Main synchronization pipeline.
 */
async function syncResearch() {
  console.log('=== Vers3Dynamics Research Ingestion Pipeline ===');

  // 1. Read existing curated knowledge
  let existingDocuments = [];
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      const normalized = normalizeKnowledgeData(raw);
      existingDocuments = normalized.documents;
      console.log(`Loaded ${existingDocuments.length} existing documents from disk.`);
    } catch (err) {
      console.warn('Error reading existing knowledge data:', err.message);
    }
  }

  // 2. Fetch live data from external sources
  const [arxivDocs, openAlexDocs] = await Promise.all([
    fetchArxivPapers(),
    fetchOpenAlexPapers(),
  ]);

  const fetchedDocs = [...arxivDocs, ...openAlexDocs];
  console.log(`Total fetched new records: ${fetchedDocs.length}`);

  // 3. Merge & Deduplicate
  const docMap = new Map();
  const titleSlugMap = new Map();
  const doiMap = new Map();

  // Index existing documents first (priority preservation)
  existingDocuments.forEach((doc) => {
    try {
      if (!Array.isArray(doc.entities) || doc.entities.length === 0) {
        doc.entities = extractEntities((doc.title || '') + ' ' + (doc.abstract || ''));
      }
      validateDocument(doc);
      docMap.set(doc.id, doc);
      titleSlugMap.set(slugify(doc.title), doc.id);
      if (doc.doi) doiMap.set(doc.doi.toLowerCase(), doc.id);
    } catch (e) {
      console.warn('Skipping invalid existing document:', e.message);
    }
  });

  // Merge new documents
  let addedCount = 0;
  fetchedDocs.forEach((doc) => {
    try {
      validateDocument(doc);
      const titleSlug = slugify(doc.title);
      const doiKey = doc.doi ? doc.doi.toLowerCase() : null;

      const isDuplicate =
        docMap.has(doc.id) ||
        titleSlugMap.has(titleSlug) ||
        (doiKey && doiMap.has(doiKey));

      if (!isDuplicate) {
        docMap.set(doc.id, doc);
        titleSlugMap.set(titleSlug, doc.id);
        if (doiKey) doiMap.set(doiKey, doc.id);
        addedCount++;
      }
    } catch (e) {
      // Ignore ill-formed remote documents
    }
  });

  const mergedDocuments = Array.from(docMap.values());
  console.log(`Merged dataset contains ${mergedDocuments.length} total documents (+${addedCount} new).`);

  // 4. Generate Connected 3D Knowledge Graph
  console.log('Building 3D Knowledge Graph network...');
  const graph = buildGraphFromDocuments(mergedDocuments);
  console.log(`Generated ${graph.nodes.length} nodes and ${graph.edges.length} relational edges.`);

  // 5. Serialize output to curatedKnowledge.json
  const outputPayload = {
    documents: mergedDocuments,
    graph: graph,
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`Successfully updated ${DATA_PATH}`);
  console.log('=== Ingestion Complete ===');
  return outputPayload;
}

if (require.main === module) {
  syncResearch().catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}

module.exports = {
  syncResearch,
  parseArxivAtom,
  parseOpenAlexResponse,
  reconstructOpenAlexAbstract,
  extractEntities,
};

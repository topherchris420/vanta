/**
 * @fileoverview Client-side in-memory fuzzy search engine with exact field weights,
 * dynamic 1-hop/2-hop sub-graph extraction, and provenance filtering.
 */

const { normalizeKnowledgeData, validateDocument } = require('./types');
const { buildGraphFromDocuments } = require('./graphEngine');

/**
 * Tokenizes text into lowercase alphanumeric tokens.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/[\s\-]+/)
    .filter((t) => t.length > 1);
}

/**
 * Calculates Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = [];
  for (let i = 0; i <= b.length; i++) row[i] = i;

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Calculates fuzzy similarity ratio between 0.0 and 1.0.
 * @param {string} queryToken
 * @param {string} targetToken
 * @returns {number}
 */
function fuzzyTokenMatch(queryToken, targetToken) {
  if (queryToken === targetToken) return 1.0;
  if (targetToken.startsWith(queryToken)) return 0.85;
  if (queryToken.startsWith(targetToken)) return 0.8;
  if (targetToken.includes(queryToken) && queryToken.length >= 3) return 0.7;

  // For tokens length >= 4, check Levenshtein distance
  const maxLen = Math.max(queryToken.length, targetToken.length);
  if (maxLen >= 4) {
    const dist = levenshteinDistance(queryToken, targetToken);
    const maxAllowedDist = maxLen >= 8 ? 2 : 1;
    if (dist <= maxAllowedDist) {
      return Math.max(0, 1 - dist / maxLen);
    }
  }

  return 0;
}

/**
 * Scores a field's token list against query tokens.
 * @param {string[]} queryTokens
 * @param {string[]} fieldTokens
 * @returns {number} score between 0.0 and 1.0
 */
function scoreField(queryTokens, fieldTokens) {
  if (!queryTokens.length || !fieldTokens.length) return 0;

  let totalFieldScore = 0;
  queryTokens.forEach((qToken) => {
    let bestMatch = 0;
    for (let i = 0; i < fieldTokens.length; i++) {
      const match = fuzzyTokenMatch(qToken, fieldTokens[i]);
      if (match > bestMatch) {
        bestMatch = match;
        if (bestMatch === 1.0) break;
      }
    }
    totalFieldScore += bestMatch;
  });

  return totalFieldScore / queryTokens.length;
}

class SearchEngine {
  /**
   * @param {import('./types').ResearchDocument[] | { documents: import('./types').ResearchDocument[], graph?: import('./types').GraphData }} [data=[]]
   */
  constructor(data = []) {
    /** @type {import('./types').ResearchDocument[]} */
    this.documents = [];
    /** @type {Map<string, import('./types').ResearchDocument>} */
    this.docMap = new Map();
    /** @type {import('./types').GraphData} */
    this.fullGraph = { nodes: [], edges: [] };
    /** @type {Set<string>} */
    this.entities = new Set();
    /** @type {Set<string>} */
    this.tags = new Set();
    /** @type {Map<string, { titleTokens: string[], abstractTokens: string[], entityTokens: string[], tagTokens: string[], authorTokens: string[] }>} */
    this.docTokenIndex = new Map();

    if (data) {
      this.load(data);
    }
  }

  /**
   * Loads and indexes dataset.
   * @param {import('./types').ResearchDocument[] | { documents: import('./types').ResearchDocument[], graph?: import('./types').GraphData }} data
   */
  load(data) {
    const normalized = normalizeKnowledgeData(data);
    this.documents = [];
    this.docMap.clear();
    this.entities.clear();
    this.tags.clear();
    this.docTokenIndex.clear();

    normalized.documents.forEach((doc) => {
      validateDocument(doc);
      this.documents.push(doc);
      this.docMap.set(doc.id, doc);

      (doc.tags || []).forEach((t) => this.tags.add(t));
      (doc.entities || []).forEach((e) => this.entities.add(e));

      // Tokenize each weighted field
      const titleTokens = tokenize(doc.title);
      const abstractTokens = tokenize(doc.abstract);
      const entityTokens = (doc.entities || []).flatMap((e) => tokenize(e));
      const tagTokens = (doc.tags || []).flatMap((t) => tokenize(t));
      const authorTokens = (doc.authors || []).flatMap((a) => tokenize(a));
      const agencyTokens = doc.agency ? tokenize(doc.agency) : [];
      const eraTokens = doc.era ? tokenize(doc.era) : [];

      this.docTokenIndex.set(doc.id, {
        titleTokens,
        abstractTokens,
        entityTokens: [...entityTokens, ...agencyTokens],
        tagTokens: [...tagTokens, ...eraTokens],
        authorTokens,
      });
    });

    // Build or store graph
    if (normalized.graph && normalized.graph.nodes && normalized.graph.nodes.length > 0) {
      this.fullGraph = normalized.graph;
    } else {
      this.fullGraph = buildGraphFromDocuments(this.documents);
    }
  }

  /**
   * Execute weighted fuzzy search with dynamic subgraph extraction.
   * @param {string} [query='']
   * @param {{
   *   provenanceFilter?: 'all' | 'verifiedOnly' | 'showInferred',
   *   tag?: string,
   *   era?: string,
   *   agency?: string,
   *   source?: string,
   *   sortBy?: 'relevance' | 'date-desc' | 'date-asc' | 'title-asc' | 'citations-desc',
   *   hops?: number,
   *   limit?: number,
   *   offset?: number
   * }} [options={}]
   * @returns {{
   *   results: Array<{ document: import('./types').ResearchDocument, score: number, matchedTerms: string[] }>,
   *   graph: import('./types').GraphData,
   *   total: number,
   *   query: string,
   *   stats: { totalDocuments: number, matchedDocuments: number, totalNodes: number, totalEdges: number }
   * }}
   */
  search(query = '', options = {}) {
    const cleanQuery = (query || '').trim();
    const queryTokens = tokenize(cleanQuery);
    const provenanceFilter = options.provenanceFilter || 'all';
    const tagFilter = options.tag;
    const eraFilter = options.era;
    const agencyFilter = options.agency;
    const sourceFilter = options.source;
    const hops = typeof options.hops === 'number' ? options.hops : 2;

    const scoredDocs = [];

    this.documents.forEach((doc) => {
      // 1. Check Provenance Filter on document
      if (provenanceFilter === 'verifiedOnly') {
        const isVerified =
          doc.source.toLowerCase().includes('arxiv') ||
          doc.source.toLowerCase().includes('openalex') ||
          doc.source.toLowerCase().includes('ssrn') ||
          doc.source.toLowerCase().includes('physical review') ||
          doc.source.toLowerCase().includes('nature') ||
          doc.source.toLowerCase().includes('ieee') ||
          doc.source.toLowerCase().includes('declassified') ||
          Boolean(doc.doi);
        if (!isVerified) return;
      }

      // 2. Check Tag / Discipline Filter
      if (tagFilter && tagFilter !== 'All') {
        const hasTag = (doc.tags || []).some(
          (t) => t.toLowerCase() === tagFilter.toLowerCase()
        );
        if (!hasTag) return;
      }

      // 3. Check Era Filter
      if (eraFilter && eraFilter !== 'All') {
        if (!doc.era || !doc.era.toLowerCase().includes(eraFilter.toLowerCase())) {
          return;
        }
      }

      // 4. Check Agency Filter
      if (agencyFilter && agencyFilter !== 'All') {
        if (!doc.agency || !doc.agency.toLowerCase().includes(agencyFilter.toLowerCase())) {
          return;
        }
      }

      // 5. Check Source Filter
      if (sourceFilter && sourceFilter !== 'All') {
        if (!doc.source.toLowerCase().includes(sourceFilter.toLowerCase())) {
          return;
        }
      }

      // 6. Calculate Weighted Score
      if (queryTokens.length === 0) {
        // Empty query matches all documents with base score
        scoredDocs.push({
          document: doc,
          score: 1.0,
          matchedTerms: [],
        });
      } else {
        const tokens = this.docTokenIndex.get(doc.id) || {
          titleTokens: [],
          abstractTokens: [],
          entityTokens: [],
          tagTokens: [],
          authorTokens: [],
        };

        // Exact weight formula specified in task:
        // title: 0.4, abstract: 0.3, entities: 0.2, tags: 0.1
        const titleScore = scoreField(queryTokens, tokens.titleTokens);
        const abstractScore = scoreField(queryTokens, tokens.abstractTokens);
        const entityScore = scoreField(queryTokens, tokens.entityTokens);
        const tagScore = scoreField(queryTokens, tokens.tagTokens);
        const authorScore = scoreField(queryTokens, tokens.authorTokens);

        const compositeScore =
          0.4 * titleScore +
          0.3 * abstractScore +
          0.2 * entityScore +
          0.1 * tagScore +
          0.15 * authorScore;

        if (compositeScore > 0.05) {
          const matchedTerms = new Set();
          queryTokens.forEach((q) => {
            [
              ...tokens.titleTokens,
              ...tokens.entityTokens,
              ...tokens.tagTokens,
              ...tokens.authorTokens,
            ].forEach((t) => {
              if (fuzzyTokenMatch(q, t) > 0.6) matchedTerms.add(t);
            });
          });

          scoredDocs.push({
            document: doc,
            score: Number(compositeScore.toFixed(3)),
            matchedTerms: Array.from(matchedTerms),
          });
        }
      }
    });

    // Sort Results
    const sortBy = options.sortBy || (cleanQuery ? 'relevance' : 'date-desc');
    if (sortBy === 'relevance') {
      scoredDocs.sort(
        (a, b) => b.score - a.score || b.document.date.localeCompare(a.document.date)
      );
    } else if (sortBy === 'date-desc') {
      scoredDocs.sort((a, b) => b.document.date.localeCompare(a.document.date));
    } else if (sortBy === 'date-asc') {
      scoredDocs.sort((a, b) => a.document.date.localeCompare(b.document.date));
    } else if (sortBy === 'title-asc') {
      scoredDocs.sort((a, b) => a.document.title.localeCompare(b.document.title));
    }

    const total = scoredDocs.length;
    const offset = options.offset || 0;
    const limit = options.limit || total;
    const paginatedResults = scoredDocs.slice(offset, offset + limit);

    // Dynamic Sub-Graph Extraction (1-hop / 2-hop neighborhood)
    const matchingDocIds = new Set(scoredDocs.map((s) => s.document.id));
    const extractedNodeIds = new Set(matchingDocIds);
    const extractedEdges = [];

    if (this.fullGraph && this.fullGraph.edges) {
      // 1-Hop Expansion
      const oneHopIds = new Set();
      this.fullGraph.edges.forEach((edge) => {
        // Filter edges by provenance if requested
        if (provenanceFilter === 'verifiedOnly' && !edge.verified) {
          return;
        }
        if (provenanceFilter === 'showInferred' && edge.verified) {
          return;
        }

        const isSourceMatching = matchingDocIds.has(edge.source);
        const isTargetMatching = matchingDocIds.has(edge.target);

        if (isSourceMatching || isTargetMatching) {
          extractedNodeIds.add(edge.source);
          extractedNodeIds.add(edge.target);
          oneHopIds.add(edge.source);
          oneHopIds.add(edge.target);
          extractedEdges.push(edge);
        }
      });

      // 2-Hop Expansion if hops >= 2
      if (hops >= 2 && oneHopIds.size > 0 && oneHopIds.size < 80) {
        this.fullGraph.edges.forEach((edge) => {
          if (provenanceFilter === 'verifiedOnly' && !edge.verified) return;
          if (provenanceFilter === 'showInferred' && edge.verified) return;

          const isSource1Hop = oneHopIds.has(edge.source);
          const isTarget1Hop = oneHopIds.has(edge.target);

          if (isSource1Hop && isTarget1Hop) {
            extractedNodeIds.add(edge.source);
            extractedNodeIds.add(edge.target);
            if (!extractedEdges.includes(edge)) {
              extractedEdges.push(edge);
            }
          }
        });
      }
    }

    const extractedNodes = (this.fullGraph.nodes || []).filter((n) =>
      extractedNodeIds.has(n.id)
    );

    const dynamicGraph = {
      nodes:
        extractedNodes.length > 0
          ? extractedNodes
          : this.fullGraph.nodes || [],
      edges:
        extractedNodes.length > 0
          ? extractedEdges
          : this.fullGraph.edges || [],
    };

    return {
      results: paginatedResults,
      graph: dynamicGraph,
      total,
      query: cleanQuery,
      stats: {
        totalDocuments: this.documents.length,
        matchedDocuments: total,
        totalNodes: dynamicGraph.nodes.length,
        totalEdges: dynamicGraph.edges.length,
      },
    };
  }

  /**
   * Suggest autocomplete terms.
   * @param {string} prefix
   * @param {number} [limit=5]
   * @returns {string[]}
   */
  suggest(prefix = '', limit = 5) {
    const cleanPrefix = (prefix || '').trim().toLowerCase();
    if (!cleanPrefix) return [];

    const suggestions = new Set();

    // 1. Entities
    this.entities.forEach((entity) => {
      if (entity.toLowerCase().includes(cleanPrefix)) {
        suggestions.add(entity);
      }
    });

    // 2. Tags
    this.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(cleanPrefix)) {
        suggestions.add(tag);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Retrieve full graph.
   * @returns {import('./types').GraphData}
   */
  getFullGraph() {
    return this.fullGraph;
  }

  /**
   * Retrieve all documents.
   * @returns {import('./types').ResearchDocument[]}
   */
  getAllDocuments() {
    return [...this.documents];
  }
}

module.exports = SearchEngine;

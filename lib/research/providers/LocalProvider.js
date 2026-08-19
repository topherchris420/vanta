/**
 * @fileoverview High-performance client-side research search engine with TF-IDF scoring and fuzzy matching.
 */

const BaseProvider = require('./BaseProvider');
const { validateDocument, normalizeKnowledgeData } = require('../types');

/**
 * Tokenizes and normalizes text into searchable terms.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/[\s\-]+/)
    .filter((token) => token.length > 1);
}

class LocalProvider extends BaseProvider {
  /**
   * @param {import('../types').ResearchDocument[] | { documents: import('../types').ResearchDocument[], graph?: import('../types').GraphData }} [documents=[]]
   */
  constructor(documents = []) {
    super();
    /** @type {import('../types').ResearchDocument[]} */
    this.documents = [];
    /** @type {Map<string, import('../types').ResearchDocument>} */
    this.docMap = new Map();
    /** @type {Map<string, Map<string, number>>} term -> (docId -> weight) */
    this.invertedIndex = new Map();
    /** @type {Map<string, number>} term -> document frequency */
    this.docFrequencies = new Map();
    /** @type {Set<string>} all distinct tags */
    this.tags = new Set();
    /** @type {Set<string>} all distinct entities */
    this.entities = new Set();

    if (documents) {
      this.load(documents);
    }
  }

  /**
   * Loads and indexes an array of research documents or knowledge data object.
   * @param {import('../types').ResearchDocument[] | { documents: import('../types').ResearchDocument[], graph?: import('../types').GraphData }} data
   */
  load(data) {
    const { documents: docs } = normalizeKnowledgeData(data);
    this.documents = [];
    this.docMap.clear();
    this.invertedIndex.clear();
    this.docFrequencies.clear();
    this.tags.clear();
    this.entities.clear();

    docs.forEach((doc) => {
      validateDocument(doc);
      this.documents.push(doc);
      this.docMap.set(doc.id, doc);

      (doc.tags || []).forEach((t) => this.tags.add(t));
      (doc.entities || []).forEach((e) => this.entities.add(e));

      // Build weighted terms for this document
      const termWeights = new Map();

      // Title tokens (weight 3.5)
      tokenize(doc.title).forEach((t) => {
        termWeights.set(t, (termWeights.get(t) || 0) + 3.5);
      });

      // Entities tokens (weight 2.5)
      (doc.entities || []).forEach((entity) => {
        tokenize(entity).forEach((t) => {
          termWeights.set(t, (termWeights.get(t) || 0) + 2.5);
        });
      });

      // Tags tokens (weight 2.0)
      (doc.tags || []).forEach((tag) => {
        tokenize(tag).forEach((t) => {
          termWeights.set(t, (termWeights.get(t) || 0) + 2.0);
        });
      });

      // Authors tokens (weight 1.5)
      (doc.authors || []).forEach((author) => {
        tokenize(author).forEach((t) => {
          termWeights.set(t, (termWeights.get(t) || 0) + 1.5);
        });
      });

      // Agency tokens (weight 2.0)
      if (doc.agency) {
        tokenize(doc.agency).forEach((t) => {
          termWeights.set(t, (termWeights.get(t) || 0) + 2.0);
        });
      }

      // Era tokens (weight 1.5)
      if (doc.era) {
        tokenize(doc.era).forEach((t) => {
          termWeights.set(t, (termWeights.get(t) || 0) + 1.5);
        });
      }

      // Abstract tokens (weight 1.0)
      tokenize(doc.abstract).forEach((t) => {
        termWeights.set(t, (termWeights.get(t) || 0) + 1.0);
      });

      // Update inverted index
      termWeights.forEach((weight, term) => {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term).set(doc.id, weight);
        this.docFrequencies.set(term, (this.docFrequencies.get(term) || 0) + 1);
      });
    });
  }

  /**
   * Search documents.
   * @param {string} [query='']
   * @param {import('./BaseProvider').SearchFilters & { era?: string, agency?: string }} [filters={}]
   * @returns {Promise<import('./BaseProvider').SearchResponse>}
   */
  async search(query = '', filters = {}) {
    const cleanQuery = (query || '').trim();
    const queryTokens = tokenize(cleanQuery);
    const totalDocs = this.documents.length || 1;

    // Base candidate scores: docId -> { score, matchedTerms }
    const candidateScores = new Map();

    if (queryTokens.length === 0) {
      // Empty query matches all documents with default score
      this.documents.forEach((doc) => {
        candidateScores.set(doc.id, {
          score: 1.0,
          matchedTerms: [],
        });
      });
    } else {
      queryTokens.forEach((qToken) => {
        // Direct term match or prefix/substring match
        this.invertedIndex.forEach((postings, indexTerm) => {
          let matchMultiplier = 0;
          if (indexTerm === qToken) {
            matchMultiplier = 1.0;
          } else if (indexTerm.startsWith(qToken) || qToken.startsWith(indexTerm)) {
            matchMultiplier = 0.75;
          } else if (indexTerm.includes(qToken) && qToken.length >= 3) {
            matchMultiplier = 0.5;
          }

          if (matchMultiplier > 0) {
            const df = this.docFrequencies.get(indexTerm) || 1;
            // IDF: log(1 + totalDocs / df)
            const idf = Math.log(1 + totalDocs / df);

            postings.forEach((weight, docId) => {
              const prev = candidateScores.get(docId) || {
                score: 0,
                matchedTerms: new Set(),
              };
              if (prev.matchedTerms instanceof Array) {
                prev.matchedTerms = new Set(prev.matchedTerms);
              }
              prev.score += weight * idf * matchMultiplier;
              prev.matchedTerms.add(indexTerm);
              candidateScores.set(docId, prev);
            });
          }
        });
      });
    }

    // Apply filters
    const filteredResults = [];
    candidateScores.forEach((info, docId) => {
      const doc = this.docMap.get(docId);
      if (!doc) return;

      // Filter: tag/discipline
      if (filters.tag && filters.tag !== 'All') {
        const hasTag = (doc.tags || []).some(
          (t) => t.toLowerCase() === filters.tag.toLowerCase()
        );
        if (!hasTag) return;
      }

      // Filter: era
      if (filters.era && filters.era !== 'All') {
        if (!doc.era || !doc.era.toLowerCase().includes(filters.era.toLowerCase())) {
          return;
        }
      }

      // Filter: agency
      if (filters.agency && filters.agency !== 'All') {
        if (!doc.agency || !doc.agency.toLowerCase().includes(filters.agency.toLowerCase())) {
          return;
        }
      }

      // Filter: author
      if (filters.author) {
        const hasAuthor = (doc.authors || []).some((a) =>
          a.toLowerCase().includes(filters.author.toLowerCase())
        );
        if (!hasAuthor) return;
      }

      // Filter: source
      if (filters.source) {
        if (!doc.source.toLowerCase().includes(filters.source.toLowerCase())) {
          return;
        }
      }

      // Filter: date range
      if (filters.startDate && doc.date < filters.startDate) return;
      if (filters.endDate && doc.date > filters.endDate) return;

      filteredResults.push({
        document: doc,
        score: Number(info.score.toFixed(3)),
        matchedTerms: Array.from(info.matchedTerms || []),
      });
    });

    // Sorting
    const sortBy = filters.sortBy || (cleanQuery ? 'relevance' : 'date-desc');
    if (sortBy === 'relevance') {
      filteredResults.sort((a, b) => b.score - a.score || b.document.date.localeCompare(a.document.date));
    } else if (sortBy === 'date-desc') {
      filteredResults.sort((a, b) => b.document.date.localeCompare(a.document.date));
    } else if (sortBy === 'date-asc') {
      filteredResults.sort((a, b) => a.document.date.localeCompare(b.document.date));
    } else if (sortBy === 'title-asc') {
      filteredResults.sort((a, b) => a.document.title.localeCompare(b.document.title));
    }

    const total = filteredResults.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || total;
    const paginated = filteredResults.slice(offset, offset + limit);

    return {
      results: paginated,
      total,
      query: cleanQuery,
    };
  }

  /**
   * Suggest autocomplete terms.
   * @param {string} prefix
   * @param {number} [limit=5]
   * @returns {Promise<string[]>}
   */
  async suggest(prefix = '', limit = 5) {
    const cleanPrefix = (prefix || '').trim().toLowerCase();
    if (!cleanPrefix) return [];

    const suggestions = new Set();

    // Check entities first (high value)
    this.entities.forEach((entity) => {
      if (entity.toLowerCase().includes(cleanPrefix)) {
        suggestions.add(entity);
      }
    });

    // Check tags
    this.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(cleanPrefix)) {
        suggestions.add(tag);
      }
    });

    // Check index terms
    if (suggestions.size < limit) {
      this.invertedIndex.forEach((_, term) => {
        if (term.startsWith(cleanPrefix)) {
          suggestions.add(term);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Retrieve single document.
   * @param {string} id
   * @returns {Promise<import('../types').ResearchDocument|null>}
   */
  async getById(id) {
    return this.docMap.get(id) || null;
  }

  /**
   * Get all registered tags/disciplines.
   * @returns {string[]}
   */
  getAllTags() {
    return Array.from(this.tags).sort();
  }

  /**
   * Get all registered documents.
   * @returns {import('../types').ResearchDocument[]}
   */
  getAllDocuments() {
    return [...this.documents];
  }
}

module.exports = LocalProvider;

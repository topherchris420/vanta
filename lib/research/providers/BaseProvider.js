/**
 * @fileoverview Abstract base class for research search providers.
 */

/**
 * @typedef {import('../types').ResearchDocument} ResearchDocument
 *
 * @typedef {Object} SearchFilters
 * @property {string} [tag] - Filter by exact or matching tag/discipline
 * @property {string} [author] - Filter by author name
 * @property {string} [source] - Filter by publication venue/source
 * @property {string} [startDate] - Filter by minimum date (YYYY-MM-DD)
 * @property {string} [endDate] - Filter by maximum date (YYYY-MM-DD)
 * @property {'relevance' | 'date-desc' | 'date-asc' | 'title-asc'} [sortBy] - Sorting mode
 * @property {number} [limit] - Maximum results to return
 * @property {number} [offset] - Offset for pagination
 *
 * @typedef {Object} SearchResultItem
 * @property {ResearchDocument} document - Matched research document
 * @property {number} score - Relevance score (higher is more relevant)
 * @property {string[]} matchedTerms - Terms that matched the query
 *
 * @typedef {Object} SearchResponse
 * @property {SearchResultItem[]} results - Array of search result items
 * @property {number} total - Total matching records
 * @property {string} query - Cleaned search query
 */

class BaseProvider {
  /**
   * Search research documents with query and filters.
   * @param {string} query
   * @param {SearchFilters} [filters={}]
   * @returns {Promise<SearchResponse>}
   */
  async search(query, filters = {}) {
    throw new Error('BaseProvider.search must be implemented by subclass.');
  }

  /**
   * Provide query suggestions for autocomplete.
   * @param {string} prefix
   * @param {number} [limit=5]
   * @returns {Promise<string[]>}
   */
  async suggest(prefix, limit = 5) {
    throw new Error('BaseProvider.suggest must be implemented by subclass.');
  }

  /**
   * Retrieve a single document by its unique ID.
   * @param {string} id
   * @returns {Promise<ResearchDocument|null>}
   */
  async getById(id) {
    throw new Error('BaseProvider.getById must be implemented by subclass.');
  }
}

module.exports = BaseProvider;

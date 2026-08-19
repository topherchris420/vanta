/**
 * @fileoverview Research data schema definitions and validators for Vers3Dynamics Research Explorer.
 */

/**
 * @typedef {'Paper' | 'Concept' | 'Technology' | 'Dataset' | 'Author' | 'Memorandum' | 'Hearing' | 'PolicyShift' | 'Agency' | 'Official'} NodeType
 */

/**
 * @typedef {'CITES' | 'BUILDS_ON' | 'EXTENDS' | 'USES' | 'CONTRADICTS' | 'SUPERVISED' | 'TESTIFIED_IN' | 'REVISED_POLICY' | 'SUBPOENAED_BY' | 'CORRELATED_WITH'} EdgeType
 */

/**
 * @typedef {'Source Verified' | 'Local Index' | 'Inferred Relation' | 'Declassified Record'} ProvenanceType
 */

/**
 * @typedef {Object} ResearchDocument
 * @property {string} id - Unique document identifier (e.g., 'doc-qc-01')
 * @property {string} title - Full title of the research paper or artifact
 * @property {string} abstract - Comprehensive summary of findings and methodology
 * @property {string} date - ISO publication or release date (YYYY-MM-DD)
 * @property {string[]} authors - List of authors / researchers
 * @property {string} [doi] - Digital Object Identifier if applicable
 * @property {string} source - Primary publication venue or repository (e.g., 'arXiv', 'SSRN', 'IEEE', 'Vers3Dynamics', 'Declassified Archives')
 * @property {string} url - Direct verified URL to artifact or publication
 * @property {string[]} tags - Categorical tags (e.g., 'quantum', 'cymatics', 'neural', 'Archival Intelligence & Institutional Oversight')
 * @property {string[]} entities - Key concepts, technologies, and named entities extracted from text
 * @property {string} [era] - Historical administrative era (e.g., 'Cold War (1947–1975)', 'Church Committee Era (1975–1980)')
 * @property {string} [agency] - Overseeing or responsible agency (e.g., 'AEC', 'CIA', 'NSA', 'DoD', 'Senate Select Committee')
 * @property {string} [classificationLevel] - Declassified / unclassified status
 */

/**
 * @typedef {Object} GraphNode
 * @property {string} id - Unique node identifier
 * @property {string} label - Display label
 * @property {NodeType} type - Node classification type
 * @property {number} val - Relative importance / node radius weight
 * @property {string} group - Category / discipline grouping
 * @property {ProvenanceType} provenance - Provenance tracking badge
 * @property {ResearchDocument} [document] - Optional attached source document
 * @property {number} [x] - 3D coordinate x
 * @property {number} [y] - 3D coordinate y
 * @property {number} [z] - 3D coordinate z
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} source - Source node ID
 * @property {string} target - Target node ID
 * @property {EdgeType} relationship - Relationship semantic type
 * @property {number} weight - Edge strength / line opacity (0.1 to 1.0)
 * @property {boolean} verified - Whether relation is explicitly verified
 */

/**
 * @typedef {Object} GraphData
 * @property {GraphNode[]} nodes - Collection of graph nodes
 * @property {GraphEdge[]} edges - Collection of graph edges
 */

const VALID_NODE_TYPES = new Set([
  'Paper',
  'Concept',
  'Technology',
  'Dataset',
  'Author',
  'Memorandum',
  'Hearing',
  'PolicyShift',
  'Agency',
  'Official',
]);

const VALID_EDGE_TYPES = new Set([
  'CITES',
  'BUILDS_ON',
  'EXTENDS',
  'USES',
  'CONTRADICTS',
  'SUPERVISED',
  'TESTIFIED_IN',
  'REVISED_POLICY',
  'SUBPOENAED_BY',
  'CORRELATED_WITH',
]);

const VALID_PROVENANCE = new Set([
  'Source Verified',
  'Local Index',
  'Inferred Relation',
  'Declassified Record',
]);

/**
 * Validates a research document structure.
 * @param {ResearchDocument} doc
 * @returns {boolean}
 */
function validateDocument(doc) {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Research document must be a non-null object.');
  }
  if (!doc.id || typeof doc.id !== 'string') {
    throw new Error('Research document requires a valid string id.');
  }
  if (!doc.title || typeof doc.title !== 'string') {
    throw new Error('Research document ' + doc.id + ' requires a valid title.');
  }
  if (!doc.abstract || typeof doc.abstract !== 'string') {
    throw new Error('Research document ' + doc.id + ' requires an abstract.');
  }
  if (!Array.isArray(doc.authors) || doc.authors.length === 0) {
    throw new Error('Research document ' + doc.id + ' requires at least one author.');
  }
  if (!doc.url || typeof doc.url !== 'string') {
    throw new Error('Research document ' + doc.id + ' requires a source URL.');
  }
  if (!Array.isArray(doc.tags) || doc.tags.length === 0) {
    throw new Error('Research document ' + doc.id + ' requires at least one tag.');
  }
  return true;
}

/**
 * Validates a graph node structure.
 * @param {GraphNode} node
 * @returns {boolean}
 */
function validateGraphNode(node) {
  if (!node || typeof node !== 'object') {
    throw new Error('Graph node must be a non-null object.');
  }
  if (!node.id || typeof node.id !== 'string') {
    throw new Error('Graph node requires a valid string id.');
  }
  if (!node.label || typeof node.label !== 'string') {
    throw new Error('Graph node ' + node.id + ' requires a string label.');
  }
  if (!VALID_NODE_TYPES.has(node.type)) {
    throw new Error(
      'Graph node ' + node.id + ' has invalid type ' + node.type + '. Expected one of: ' + Array.from(VALID_NODE_TYPES).join(', ')
    );
  }
  if (!VALID_PROVENANCE.has(node.provenance)) {
    throw new Error(
      'Graph node ' + node.id + ' has invalid provenance ' + node.provenance + '. Expected one of: ' + Array.from(VALID_PROVENANCE).join(', ')
    );
  }
  return true;
}

/**
 * Validates a graph edge structure.
 * @param {GraphEdge} edge
 * @returns {boolean}
 */
function validateGraphEdge(edge) {
  if (!edge || typeof edge !== 'object') {
    throw new Error('Graph edge must be a non-null object.');
  }
  if (!edge.source || typeof edge.source !== 'string') {
    throw new Error('Graph edge requires a valid source node id.');
  }
  if (!edge.target || typeof edge.target !== 'string') {
    throw new Error('Graph edge requires a valid target node id.');
  }
  if (!VALID_EDGE_TYPES.has(edge.relationship)) {
    throw new Error(
      'Graph edge ' + edge.source + '->' + edge.target + ' has invalid relationship ' + edge.relationship + '. Expected one of: ' + Array.from(VALID_EDGE_TYPES).join(', ')
    );
  }
  return true;
}

/**
 * Normalizes input knowledge data into { documents, graph }.
 * Accepts either an array of documents or an object containing { documents, graph }.
 * @param {ResearchDocument[] | { documents: ResearchDocument[], graph?: GraphData }} data
 * @returns {{ documents: ResearchDocument[], graph: GraphData }}
 */
function normalizeKnowledgeData(data) {
  if (Array.isArray(data)) {
    return {
      documents: data,
      graph: { nodes: [], edges: [] },
    };
  }
  if (data && typeof data === 'object' && Array.isArray(data.documents)) {
    return {
      documents: data.documents,
      graph:
        data.graph && Array.isArray(data.graph.nodes)
          ? data.graph
          : { nodes: [], edges: [] },
    };
  }
  return {
    documents: [],
    graph: { nodes: [], edges: [] },
  };
}

module.exports = {
  VALID_NODE_TYPES,
  VALID_EDGE_TYPES,
  VALID_PROVENANCE,
  validateDocument,
  validateGraphNode,
  validateGraphEdge,
  normalizeKnowledgeData,
};


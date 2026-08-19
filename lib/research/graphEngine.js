/**
 * @fileoverview Graph transformation engine that converts research documents into an interactive 3D Knowledge Graph.
 */

const {
  validateGraphNode,
  validateGraphEdge,
} = require('./types');

/**
 * Creates a clean slug for node IDs.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Classifies an entity string into NodeType.
 * @param {string} entity
 * @returns {'Technology' | 'Dataset' | 'Concept'}
 */
function classifyEntity(entity) {
  const lower = entity.toLowerCase();
  if (
    lower.includes('fpga') ||
    lower.includes('chip') ||
    lower.includes('array') ||
    lower.includes('sensor') ||
    lower.includes('cavity') ||
    lower.includes('transducer') ||
    lower.includes('waveguide') ||
    lower.includes('resonator') ||
    lower.includes('transformer') ||
    lower.includes('metamaterial') ||
    lower.includes('hardware')
  ) {
    return 'Technology';
  }
  if (
    lower.includes('dataset') ||
    lower.includes('corpus') ||
    lower.includes('tomography') ||
    lower.includes('benchmark') ||
    lower.includes('eeg recordings') ||
    lower.includes('tachogram')
  ) {
    return 'Dataset';
  }
  return 'Concept';
}

/**
 * Computes deterministic 3D spherical cluster coordinates.
 * @param {number} index
 * @param {number} total
 * @param {number} clusterIndex
 * @param {number} totalClusters
 * @param {number} radius
 * @returns {{ x: number, y: number, z: number }}
 */
function calculate3DPosition(index, total, clusterIndex, totalClusters, radius = 450) {
  // Cluster center angle on sphere
  const phiCluster = Math.acos(-1 + (2 * clusterIndex) / Math.max(totalClusters, 1));
  const thetaCluster = Math.sqrt(totalClusters * Math.PI) * clusterIndex;

  const clusterCenterX = (radius * 0.7) * Math.sin(phiCluster) * Math.cos(thetaCluster);
  const clusterCenterY = (radius * 0.7) * Math.sin(phiCluster) * Math.sin(thetaCluster);
  const clusterCenterZ = (radius * 0.7) * Math.cos(phiCluster);

  // Local offset within cluster
  const localPhi = Math.acos(-1 + (2 * (index % 12)) / 12);
  const localTheta = Math.sqrt(12 * Math.PI) * (index % 12);
  const localSpread = 120 + ((index * 29) % 80);

  const x = clusterCenterX + localSpread * Math.sin(localPhi) * Math.cos(localTheta);
  const y = clusterCenterY + localSpread * Math.sin(localPhi) * Math.sin(localTheta);
  const z = clusterCenterZ + localSpread * Math.cos(localPhi);

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
  };
}

/**
 * Transforms an array of research documents into a structured 3D knowledge graph.
 * @param {import('./types').ResearchDocument[]} documents
 * @returns {import('./types').GraphData}
 */
function buildGraphFromDocuments(documents = []) {
  const nodeMap = new Map();
  const edges = [];
  const edgeSet = new Set();

  const addEdge = (source, target, relationship, weight = 0.6, verified = true) => {
    if (!source || !target || source === target) return;
    const edgeKey = `${source}->${target}:${relationship}`;
    if (edgeSet.has(edgeKey)) return;
    edgeSet.add(edgeKey);

    const edge = {
      source,
      target,
      relationship,
      weight,
      verified,
    };
    validateGraphEdge(edge);
    edges.push(edge);
  };

  // Group documents by discipline for cluster organization
  const disciplines = Array.from(
    new Set(documents.map((d) => (d.tags && d.tags[0]) || 'Interdisciplinary'))
  );
  const clusterIndexMap = new Map(disciplines.map((d, i) => [d, i]));

  // Step 1: Add Paper Nodes
  documents.forEach((doc, docIdx) => {
    const discipline = (doc.tags && doc.tags[0]) || 'Interdisciplinary';
    const clusterIdx = clusterIndexMap.get(discipline) || 0;
    const pos = calculate3DPosition(docIdx, documents.length, clusterIdx, disciplines.length, 420);

    const paperNode = {
      id: doc.id,
      label: doc.title,
      type: 'Paper',
      val: 20 + Math.min((doc.entities || []).length * 2, 12),
      group: discipline,
      provenance: 'Source Verified',
      document: doc,
      x: pos.x,
      y: pos.y,
      z: pos.z,
    };
    validateGraphNode(paperNode);
    nodeMap.set(doc.id, paperNode);

    // Step 2: Add Author Nodes & Edges
    (doc.authors || []).forEach((author, aIdx) => {
      const authorId = 'author-' + slugify(author);
      if (!nodeMap.has(authorId)) {
        const aPos = {
          x: pos.x + (Math.sin(aIdx + 1) * 80),
          y: pos.y + (Math.cos(aIdx + 1) * 80),
          z: pos.z + 50,
        };
        const authorNode = {
          id: authorId,
          label: author,
          type: 'Author',
          val: 14,
          group: 'Authors',
          provenance: 'Source Verified',
          x: Number(aPos.x.toFixed(2)),
          y: Number(aPos.y.toFixed(2)),
          z: Number(aPos.z.toFixed(2)),
        };
        validateGraphNode(authorNode);
        nodeMap.set(authorId, authorNode);
      }
      addEdge(doc.id, authorId, 'USES', 0.8, true);
    });

    // Step 3: Add Entity / Concept / Technology Nodes & Edges
    (doc.entities || []).forEach((entity, eIdx) => {
      const entityType = classifyEntity(entity);
      const entityId = `${entityType.toLowerCase()}-${slugify(entity)}`;

      if (!nodeMap.has(entityId)) {
        const ePos = {
          x: pos.x + Math.sin(eIdx * 1.5) * (90 + eIdx * 10),
          y: pos.y + Math.cos(eIdx * 1.5) * (90 + eIdx * 10),
          z: pos.z + ((eIdx % 2 === 0 ? 1 : -1) * (60 + eIdx * 8)),
        };
        const entityNode = {
          id: entityId,
          label: entity,
          type: entityType,
          val: entityType === 'Technology' ? 14 : 10,
          group: discipline,
          provenance: 'Local Index',
          x: Number(ePos.x.toFixed(2)),
          y: Number(ePos.y.toFixed(2)),
          z: Number(ePos.z.toFixed(2)),
        };
        validateGraphNode(entityNode);
        nodeMap.set(entityId, entityNode);
      } else {
        // Boost existing entity weight for multi-document hub
        const existing = nodeMap.get(entityId);
        existing.val = Math.min(existing.val + 3, 28);
      }

      const rel = entityType === 'Technology' ? 'USES' : 'BUILDS_ON';
      addEdge(doc.id, entityId, rel, 0.7, true);
    });
  });

  // Step 4: Add Cross-Document Citation & Extension Edges
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const docA = documents[i];
      const docB = documents[j];

      // Check shared tags & entities
      const sharedTags = (docA.tags || []).filter((t) => (docB.tags || []).includes(t));
      const sharedEntities = (docA.entities || []).filter((e) => (docB.entities || []).includes(e));

      if (sharedEntities.length >= 1) {
        // Strong connection
        const rel = docA.date > docB.date ? 'EXTENDS' : 'BUILDS_ON';
        const source = docA.date > docB.date ? docA.id : docB.id;
        const target = docA.date > docB.date ? docB.id : docA.id;
        addEdge(source, target, rel, 0.75 + Math.min(sharedEntities.length * 0.1, 0.25), false);
      } else if (sharedTags.length >= 2) {
        // Disciplinary connection
        const source = docA.date > docB.date ? docA.id : docB.id;
        const target = docA.date > docB.date ? docB.id : docA.id;
        addEdge(source, target, 'CITES', 0.5, false);
      }
    }
  }

  const nodes = Array.from(nodeMap.values());
  return { nodes, edges };
}

/**
 * Returns immediate neighborhood (connected nodes and edges) for a given node.
 * @param {import('./types').GraphData} graph
 * @param {string} nodeId
 * @returns {import('./types').GraphData}
 */
function getNodeNeighborhood(graph, nodeId) {
  if (!graph || !graph.nodes || !nodeId) {
    return { nodes: [], edges: [] };
  }

  const connectedNodeIds = new Set([nodeId]);
  const connectedEdges = [];

  (graph.edges || []).forEach((edge) => {
    if (edge.source === nodeId) {
      connectedNodeIds.add(edge.target);
      connectedEdges.push(edge);
    } else if (edge.target === nodeId) {
      connectedNodeIds.add(edge.source);
      connectedEdges.push(edge);
    }
  });

  const connectedNodes = (graph.nodes || []).filter((n) => connectedNodeIds.has(n.id));
  return {
    nodes: connectedNodes,
    edges: connectedEdges,
  };
}

module.exports = {
  buildGraphFromDocuments,
  getNodeNeighborhood,
  slugify,
  classifyEntity,
  calculate3DPosition,
};

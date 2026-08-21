import { useEffect, useRef } from "react";
import styles from "../../styles/Research.module.css";
import { getNodeNeighborhood } from "../../lib/research/graphEngine";

/**
 * Slide-out details inspector for selected research nodes and documents.
 * @param {{
 *   node: import('../../lib/research/types').GraphNode | null,
 *   graph: import('../../lib/research/types').GraphData,
 *   onClose: () => void,
 *   onSelectNode: (nodeId: string) => void
 * }} props
 */
const ResearchDetails = ({ node, graph, onClose, onSelectNode }) => {
  const bodyRef = useRef(null);

  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (node) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [node, onClose]);

  // Reset scroll position when node changes
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [node?.id]);

  if (!node) {
    return null;
  }

  const doc = node.document;
  const neighborhood = getNodeNeighborhood(graph, node.id);

  const getProvenanceClass = (prov) => {
    if (prov === "Source Verified") return styles.provenanceVerified;
    if (prov === "Local Index") return styles.provenanceLocal;
    return styles.provenanceInferred;
  };

  return (
    <aside
      className={`${styles.detailsDrawer} ${node ? styles.detailsDrawerOpen : ""}`}
      aria-labelledby="details-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      <header className={styles.detailsHeader}>
        <div className={styles.detailsTitleRow}>
          <span
            className={`${styles.provenanceBadge} ${getProvenanceClass(
              node.provenance
            )}`}
          >
            {node.provenance}
          </span>
          <span className={styles.pageBadge}>{node.type}</span>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close details inspector"
        >
          &#x2715;
        </button>
      </header>

      <div className={styles.detailsBody} ref={bodyRef}>
        <h2 id="details-drawer-title" className={styles.detailsNodeLabel}>
          {node.label}
        </h2>

        {doc && (
          <div className={styles.detailsMetadataGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Published</span>
              <span className={styles.metaValue}>{doc.date}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Source / Venue</span>
              <span className={styles.metaValue}>{doc.source}</span>
            </div>
            {doc.agency && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Responsible Agency</span>
                <span className={styles.metaValue}>{doc.agency}</span>
              </div>
            )}
            {doc.era && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Administrative Era</span>
                <span className={styles.metaValue}>{doc.era}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Authors / Investigators</span>
              <span className={styles.metaValue}>{doc.authors.join(", ")}</span>
            </div>
            {doc.doi && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>DOI / Catalog</span>
                <span className={styles.metaValue}>{doc.doi}</span>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className={styles.detailsSectionTitle}>Abstract & Overview</h3>
          <p className={styles.detailsAbstractText}>
            {doc
              ? doc.abstract
              : `Knowledge Graph entity '${node.label}' within the ${node.group} research cluster. Indexed for provenance mapping and multi-hop concept discovery.`}
          </p>
        </div>

        {doc && doc.entities && doc.entities.length > 0 && (
          <div>
            <h3 className={styles.detailsSectionTitle}>Extracted Entities</h3>
            <div className={styles.cardTags}>
              {doc.entities.map((entity) => (
                <span key={entity} className={styles.cardTag}>
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {neighborhood.nodes.length > 1 && (
          <div>
            <h3 className={styles.detailsSectionTitle}>
              Connected Graph Relations ({neighborhood.edges.length})
            </h3>
            <div className={styles.connectedList}>
              {neighborhood.edges.map((edge, idx) => {
                const targetId =
                  edge.source === node.id ? edge.target : edge.source;
                const targetNode = graph.nodes.find((n) => n.id === targetId);
                if (!targetNode) return null;

                return (
                  <div
                    key={targetId + "-" + idx}
                    className={styles.connectedNodeItem}
                    onClick={() => onSelectNode(targetId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onSelectNode(targetId);
                      }
                    }}
                  >
                    <span className={styles.connectedLabel}>
                      {targetNode.label}
                    </span>
                    <span className={styles.relationshipTag}>
                      {edge.relationship}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {doc && doc.url && (
        <footer className={styles.detailsFooter}>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewSourceButton}
          >
            <span>View Source Artifact &rarr;</span>
          </a>
        </footer>
      )}
    </aside>
  );
};

export default ResearchDetails;

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import signalExperience from "../../lib/signalExperience";
import {
  isMobileDevice,
  prefersReducedMotion,
  supportsWebGL,
  shouldUseWebGL,
} from "../../lib/runtimeCapabilities";
import styles from "../../styles/Research.module.css";
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import SpriteText from "three-spritetext";

const { resolveWebGLPixelRatio } = signalExperience;

// Dynamically import ForceGraph3D to prevent SSR execution
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

// Color palette matching Vanta design system
const NODE_COLORS = {
  Paper: "#8cf0c6", // Signal mint
  Concept: "#e4b65c", // Calibration amber
  Technology: "#5ce1e6", // Cyan
  Dataset: "#c4b5fd", // Violet
  Author: "#ffab91", // Coral
  Memorandum: "#e06c75", // Crimson/Rose
  Hearing: "#f0932b", // Orange/Amber
  PolicyShift: "#a29bfe", // Lavender
  Agency: "#74b9ff", // Azure
  Official: "#ffeaa7", // Gold
};

/**
 * Interactive 3D Knowledge Graph Component powered by ForceGraph3D and SpriteText.
 * @param {{
 *   graph: import('../../lib/research/types').GraphData,
 *   selectedNodeId: string | null,
 *   onSelectNode: (node: import('../../lib/research/types').GraphNode) => void,
 *   hoveredDocId?: string | null
 * }} props
 */
const ResearchGraph = ({
  graph,
  selectedNodeId,
  onSelectNode,
  hoveredDocId,
}) => {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  // Start with the original desktop canvas size so the graph renders immediately;
  // ResizeObserver will replace it with the actual container dimensions on mount.
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [particleFlow, setParticleFlow] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const initialCameraSetRef = useRef(false);

  // ResizeObserver for container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = containerRef.current.clientWidth || rect.width || (typeof window !== "undefined" ? window.innerWidth : 800);
        const height = containerRef.current.clientHeight || rect.height || (typeof window !== "undefined" ? window.innerHeight - 60 : 600);
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 400),
        });
      }
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(containerRef.current);
    window.addEventListener("resize", updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Format graph data for react-force-graph
  const graphData = useMemo(() => {
    if (!graph || !graph.nodes) return { nodes: [], links: [] };
    return {
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: (graph.edges || []).map((e) => ({
        source: typeof e.source === "object" ? e.source.id : e.source,
        target: typeof e.target === "object" ? e.target.id : e.target,
        relationship: e.relationship,
        weight: e.weight || 1,
      })),
    };
  }, [graph]);

  // Shared sphere geometry
  const baseSphereGeo = useMemo(() => new SphereGeometry(1, 20, 20), []);

  // Render custom 3D mesh + SpriteText billboard for each node
  const handleNodeThreeObject = useCallback(
    (node) => {
      const colorHex = NODE_COLORS[node.type] || "#8cf0c6";
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode?.id === node.id || hoveredDocId === node.id;
      const radius =
        node.type === "Paper"
          ? 7.5
          : node.type === "Dataset"
          ? 6.8
          : node.type === "Author"
          ? 5.2
          : 4.2;

      const group = new Group();

      const mat = new MeshStandardMaterial({
        color: new Color(colorHex),
        emissive: new Color(colorHex),
        emissiveIntensity: isSelected
          ? 0.95
          : isHovered
          ? 0.8
          : node.type === "Paper" || node.type === "Dataset"
          ? 0.55
          : 0.35,
        roughness: 0.2,
        metalness: 0.8,
      });

      const sphere = new Mesh(baseSphereGeo, mat);
      const scale = isSelected ? radius * 1.35 : isHovered ? radius * 1.2 : radius;
      sphere.scale.set(scale, scale, scale);
      group.add(sphere);

      // Render billboard text sprite with three-spritetext
      if (
        node.type === "Paper" ||
        node.type === "Technology" ||
        node.type === "Dataset" ||
        node.type === "Agency" ||
        isSelected ||
        isHovered
      ) {
        const sprite = new SpriteText(node.label);
        sprite.color = isSelected ? "#ffffff" : colorHex;
        sprite.textHeight =
          node.type === "Paper" || node.type === "Dataset" ? 4.5 : 3.4;
        sprite.backgroundColor = "rgba(6, 11, 9, 0.85)";
        sprite.borderColor = isSelected ? "#8cf0c6" : colorHex;
        sprite.borderWidth = isSelected ? 2 : 1;
        sprite.borderRadius = 3;
        sprite.padding = [2, 5];
        sprite.fontFace = "'Space Grotesk', -apple-system, sans-serif";
        sprite.fontWeight = "bold";
        sprite.position.y = radius + sprite.textHeight * 0.8 + 4;
        group.add(sprite);
      }

      return group;
    },
    [selectedNodeId, hoveredNode, hoveredDocId, baseSphereGeo]
  );

  // Focus node in 3D spacetime. Keep the camera close enough to make the
  // network feel immersive while leaving room for the selected node label.
  const focusNode = useCallback((node) => {
    if (!node || !fgRef.current || typeof fgRef.current.cameraPosition !== "function") return;
    const distance = 95;
    const distRatio =
      1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0 || 1);
    fgRef.current.cameraPosition(
      {
        x: (node.x || 0) * distRatio,
        y: (node.y || 0) * distRatio + 20,
        z: (node.z || 0) * distRatio,
      },
      { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
      1000
    );
  }, []);

  // Start closer to the network so the graph fills the viewport on first render.
  useEffect(() => {
    if (
      initialCameraSetRef.current ||
      !fgRef.current ||
      typeof fgRef.current.cameraPosition !== "function" ||
      !dimensions.width ||
      !dimensions.height
    ) return;

    initialCameraSetRef.current = true;
    fgRef.current.cameraPosition(
      { x: 0, y: 52, z: 360 },
      { x: 0, y: 0, z: 0 },
      0
    );
  }, [dimensions.width, dimensions.height]);

  // Handle external selection
  useEffect(() => {
    if (selectedNodeId && graphData.nodes.length) {
      const node = graphData.nodes.find((n) => n.id === selectedNodeId);
      if (node) focusNode(node);
    }
  }, [selectedNodeId, graphData, focusNode]);

  // Configure D3 forces once mounted
  useEffect(() => {
    if (fgRef.current && typeof fgRef.current.d3Force === "function") {
      const chargeForce = fgRef.current.d3Force("charge");
      if (chargeForce) chargeForce.strength(-140);
      const linkForce = fgRef.current.d3Force("link");
      if (linkForce) linkForce.distance(55);
    }
  }, [graphData]);

  // Handle auto-rotation
  useEffect(() => {
    if (fgRef.current && typeof fgRef.current.controls === "function") {
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.8;
      }
    }
  }, [autoRotate]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (!fgRef.current || typeof fgRef.current.cameraPosition !== "function") return;
    fgRef.current.cameraPosition(
      { x: 0, y: 52, z: 360 },
      { x: 0, y: 0, z: 0 },
      1000
    );
  };

  const reducedMotion = prefersReducedMotion();
  const webglSupported = supportsWebGL();
  const enableWebGL = shouldUseWebGL({ isMobile: false, reducedMotion, webglAvailable: webglSupported });

  if (!enableWebGL) {
    return (
      <div className={styles.graphContainer} ref={containerRef} data-webgl="fallback">
        <div className={styles.graphHudTop}>
          <div className={styles.graphHudCard}>
            <div className={styles.graphHudTitle}>Knowledge Index (Static Mode)</div>
            <div className={styles.graphHudStats}>
              {graphData.nodes.length} Structured Records Indexed
            </div>
          </div>
        </div>
        <div className={styles.resultsList} style={{ padding: "1rem" }}>
          {graphData.nodes.slice(0, 15).map((node) => (
            <div
              key={node.id}
              className={`${styles.resultCard} ${
                selectedNodeId === node.id ? styles.resultCardActive : ""
              }`}
              onClick={() => onSelectNode(node)}
              style={{ cursor: "pointer", marginBottom: "0.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={styles.cardAgencyBadge} style={{ background: NODE_COLORS[node.type] || "#8cf0c6", color: "#060b09" }}>
                  {node.type}
                </span>
                <span className={styles.cardDate}>{node.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.graphContainer} ref={containerRef}>
      {/* HUD Top Status */}
      <div className={styles.graphHudTop}>
        <div className={styles.graphHudCard}>
          <div className={styles.graphHudTitle}>3D Knowledge Graph</div>
          <div className={styles.graphHudStats}>
            {graphData.nodes.length} Nodes &bull; {graphData.links.length} Semantic Edges
          </div>
        </div>
      </div>

      {/* Graph Legend */}
      <div className={styles.graphLegend}>
        <div className={styles.legendTitle}>Node Types</div>
        <div className={styles.legendItems}>
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: color }} />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph Controls */}
      <div className={styles.graphControls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={handleResetCamera}
        >
          Reset View
        </button>
        <button
          type="button"
          className={`${styles.controlButton} ${
            autoRotate ? styles.controlButtonActive : ""
          }`}
          onClick={() => setAutoRotate((prev) => !prev)}
        >
          {autoRotate ? "Pause Rotation" : "Auto Rotate"}
        </button>
        <button
          type="button"
          className={`${styles.controlButton} ${
            particleFlow ? styles.controlButtonActive : ""
          }`}
          onClick={() => setParticleFlow((prev) => !prev)}
        >
          {particleFlow ? "Particle Flow On" : "Particle Flow Off"}
        </button>
      </div>

      {/* 3D Force-Directed Graph */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="rgba(6, 11, 9, 0)"
          nodeThreeObject={handleNodeThreeObject}
          nodeThreeObjectExtend={false}
          onNodeClick={(node) => {
            focusNode(node);
            onSelectNode(node);
          }}
          onNodeHover={(node) => setHoveredNode(node || null)}
          linkDirectionalParticles={particleFlow ? 2 : 0}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={1.8}
          linkDirectionalParticleColor={() => "#8cf0c6"}
          linkColor={() => "rgba(140, 240, 198, 0.22)"}
          linkWidth={1}
          linkCurvature={0.12}
          warmupTicks={40}
          cooldownTicks={90}
          enableNodeDrag={true}
          showNavInfo={false}
        />
      )}
    </div>
  );
};

export default ResearchGraph;

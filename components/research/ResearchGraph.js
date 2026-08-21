import { useEffect, useRef, useState, useCallback } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereGeometry,
  MeshStandardMaterial,
  Mesh,
  Group,
  Vector3,
  Color,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Raycaster,
  Vector2,
  AmbientLight,
  PointLight,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import signalExperience from "../../lib/signalExperience";
import styles from "../../styles/Research.module.css";

const { resolveWebGLPixelRatio } = signalExperience;

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
 * Creates a canvas texture for crisp sprite labels.
 * @param {string} text
 * @param {string} color
 * @returns {CanvasTexture}
 */
function createLabelTexture(text, color = "#edf9f4") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(6, 11, 9, 0.75)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = "bold 28px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const displayText = text.length > 28 ? text.slice(0, 26) + "..." : text;
  ctx.fillText(displayText, 256, 64);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Interactive 3D Knowledge Graph Component.
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
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [particleFlow, setParticleFlow] = useState(true);

  // References for camera animation
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const nodeMeshMapRef = useRef(new Map());
  const cameraTargetPos = useRef(null);
  const controlsTargetPos = useRef(null);

  // Focus camera on node
  const focusNode = useCallback((node) => {
    if (!node || !controlsRef.current || !cameraRef.current) return;
    const target = new Vector3(node.x, node.y, node.z);
    controlsTargetPos.current = target.clone();

    // Position camera slightly offset from target node
    const offset = new Vector3(node.x, node.y + 40, node.z + 180);
    cameraTargetPos.current = offset;
  }, []);

  // When selectedNodeId changes externally, focus on it
  useEffect(() => {
    if (selectedNodeId && graph?.nodes) {
      const node = graph.nodes.find((n) => n.id === selectedNodeId);
      if (node) focusNode(node);
    }
  }, [selectedNodeId, graph, focusNode]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsTargetPos.current = new Vector3(0, 0, 0);
    cameraTargetPos.current = new Vector3(0, 80, 580);
  };

  useEffect(() => {
    if (!containerRef.current || !graph?.nodes?.length) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, width / height, 1, 4000);
    camera.position.set(0, 80, 580);
    cameraRef.current = camera;

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn("Unable to create WebGLRenderer for Knowledge Graph", e);
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      resolveWebGLPixelRatio(window.devicePixelRatio, mobileQuery.matches)
    );
    renderer.setClearColor(0x060b09, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 1400;
    controls.minDistance = 60;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight = new PointLight(0x8cf0c6, 2.2, 1600);
    pointLight.position.set(0, 200, 300);
    scene.add(pointLight);

    const goldLight = new PointLight(0xe4b65c, 1.8, 1400);
    goldLight.position.set(200, -150, -200);
    scene.add(goldLight);

    // Node & Edge Groups
    const graphGroup = new Group();
    scene.add(graphGroup);

    const nodeMeshMap = new Map();
    const spriteList = [];
    const geometryDisposalList = [];
    const materialDisposalList = [];
    const textureDisposalList = [];

    // Shared sphere geometry
    const baseSphereGeo = new SphereGeometry(1, 24, 24);
    geometryDisposalList.push(baseSphereGeo);

    // Build Node Meshes
    graph.nodes.forEach((node) => {
      const colorHex = NODE_COLORS[node.type] || "#8cf0c6";
      const radius = node.type === "Paper" ? 9 : node.type === "Author" ? 6 : 4.5;

      const mat = new MeshStandardMaterial({
        color: new Color(colorHex),
        emissive: new Color(colorHex),
        emissiveIntensity: node.type === "Paper" ? 0.65 : 0.4,
        roughness: 0.2,
        metalness: 0.8,
      });
      materialDisposalList.push(mat);

      const mesh = new Mesh(baseSphereGeo, mat);
      mesh.scale.set(radius, radius, radius);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = { node, baseRadius: radius };

      graphGroup.add(mesh);
      nodeMeshMap.set(node.id, mesh);

      // Create Label Sprite for Paper nodes or on hover
      if (node.type === "Paper" || node.type === "Technology") {
        const texture = createLabelTexture(node.label, colorHex);
        textureDisposalList.push(texture);

        const spriteMat = new SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.82,
          depthWrite: false,
        });
        materialDisposalList.push(spriteMat);

        const sprite = new Sprite(spriteMat);
        sprite.position.set(node.x, node.y + radius + 14, node.z);
        sprite.scale.set(70, 17.5, 1);
        sprite.userData = { nodeId: node.id };
        graphGroup.add(sprite);
        spriteList.push(sprite);
      }
    });
    nodeMeshMapRef.current = nodeMeshMap;

    // Build Edges
    const linePositions = [];
    const lineColors = [];

    graph.edges.forEach((edge) => {
      const sourceMesh = nodeMeshMap.get(edge.source);
      const targetMesh = nodeMeshMap.get(edge.target);
      if (!sourceMesh || !targetMesh) return;

      linePositions.push(
        sourceMesh.position.x,
        sourceMesh.position.y,
        sourceMesh.position.z,
        targetMesh.position.x,
        targetMesh.position.y,
        targetMesh.position.z
      );

      const colorA = new Color(NODE_COLORS[sourceMesh.userData.node.type] || "#8cf0c6");
      const colorB = new Color(NODE_COLORS[targetMesh.userData.node.type] || "#8cf0c6");

      lineColors.push(colorA.r, colorA.g, colorA.b, colorB.r, colorB.g, colorB.b);
    });

    const edgeGeometry = new BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(linePositions, 3)
    );
    edgeGeometry.setAttribute(
      "color",
      new Float32BufferAttribute(lineColors, 3)
    );
    geometryDisposalList.push(edgeGeometry);

    const edgeMaterial = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    materialDisposalList.push(edgeMaterial);

    const edgeLines = new LineSegments(edgeGeometry, edgeMaterial);
    graphGroup.add(edgeLines);

    // Directional Particle Flow System
    const particleCount = Math.min(graph.edges.length * 4, 300);
    const particleGeo = new BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleData = [];

    for (let i = 0; i < particleCount; i++) {
      const edge = graph.edges[i % graph.edges.length];
      const sourceMesh = nodeMeshMap.get(edge.source);
      const targetMesh = nodeMeshMap.get(edge.target);

      particleData.push({
        source: sourceMesh ? sourceMesh.position : new Vector3(),
        target: targetMesh ? targetMesh.position : new Vector3(),
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.006,
      });

      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
    }

    particleGeo.setAttribute(
      "position",
      new Float32BufferAttribute(particlePositions, 3)
    );
    geometryDisposalList.push(particleGeo);

    const particleMat = new PointsMaterial({
      color: new Color("#8cf0c6"),
      size: 3.5,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    materialDisposalList.push(particleMat);

    const particles = new Points(particleGeo, particleMat);
    graphGroup.add(particles);

    // Raycasting for Interactivity
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let hoveredMesh = null;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const nodeMeshes = Array.from(nodeMeshMap.values());
      const intersects = raycaster.intersectObjects(nodeMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) {
            hoveredMesh.scale.setScalar(hoveredMesh.userData.baseRadius);
          }
          hoveredMesh = hit;
          hoveredMesh.scale.setScalar(hoveredMesh.userData.baseRadius * 1.35);
          setHoveredNode(hit.userData.node);
        }
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = "pointer";
      } else {
        if (hoveredMesh) {
          hoveredMesh.scale.setScalar(hoveredMesh.userData.baseRadius);
          hoveredMesh = null;
          setHoveredNode(null);
        }
        container.style.cursor = "default";
      }
    };

    const onPointerDown = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const nodeMeshes = Array.from(nodeMeshMap.values());
      const intersects = raycaster.intersectObjects(nodeMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const node = hit.userData.node;
        focusNode(node);
        onSelectNode(node);
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);

    // Window & Container Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        onResize();
      });
      resizeObserver.observe(container);
    }

    // Animation Loop
    let animId = 0;
    let clock = 0;

    const animate = () => {
      clock += 0.016;

      // Camera Smooth Lerp Interpolation
      if (controlsTargetPos.current) {
        controls.target.lerp(controlsTargetPos.current, 0.08);
        if (controls.target.distanceTo(controlsTargetPos.current) < 0.2) {
          controlsTargetPos.current = null;
        }
      }
      if (cameraTargetPos.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08);
        if (camera.position.distanceTo(cameraTargetPos.current) < 0.2) {
          cameraTargetPos.current = null;
        }
      }

      controls.update();

      // Particle Flow Animation
      if (particleFlow && !motionQuery.matches) {
        const posAttr = particleGeo.attributes.position;
        const pArray = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
          const p = particleData[i];
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          pArray[i * 3] = p.source.x + (p.target.x - p.source.x) * p.progress;
          pArray[i * 3 + 1] = p.source.y + (p.target.y - p.source.y) * p.progress;
          pArray[i * 3 + 2] = p.source.z + (p.target.z - p.source.z) * p.progress;
        }
        posAttr.needsUpdate = true;
      }

      // Gentle floating oscillation
      if (!motionQuery.matches) {
        pointLight.position.x = Math.sin(clock * 0.5) * 200;
        pointLight.position.z = Math.cos(clock * 0.5) * 300;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup & Resource Disposal
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (resizeObserver) resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);

      controls.dispose();

      geometryDisposalList.forEach((g) => g.dispose());
      materialDisposalList.forEach((m) => m.dispose());
      textureDisposalList.forEach((t) => t.dispose());

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [graph, particleFlow, focusNode, onSelectNode]);

  // Sync auto-rotate with controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Highlight externally hovered document
  useEffect(() => {
    if (hoveredDocId && nodeMeshMapRef.current.has(hoveredDocId)) {
      const mesh = nodeMeshMapRef.current.get(hoveredDocId);
      mesh.scale.setScalar(mesh.userData.baseRadius * 1.4);
      return () => {
        mesh.scale.setScalar(mesh.userData.baseRadius);
      };
    }
  }, [hoveredDocId]);

  return (
    <div className={styles.graphContainer} ref={containerRef}>
      {/* HUD Top Status */}
      <div className={styles.graphHudTop}>
        <div className={styles.graphHudCard}>
          <div className={styles.graphHudTitle}>3D Knowledge Graph</div>
          <div className={styles.graphHudStats}>
            {graph.nodes.length} Nodes &bull; {graph.edges.length} Semantic Edges
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

      {/* 3D Canvas Hover Tooltip */}
      {hoveredNode && (
        <div
          className={styles.graphTooltip}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 16,
          }}
        >
          <div className={styles.tooltipType}>{hoveredNode.type}</div>
          <div className={styles.tooltipLabel}>{hoveredNode.label}</div>
        </div>
      )}
    </div>
  );
};

export default ResearchGraph;

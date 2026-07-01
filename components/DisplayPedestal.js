import { useCallback, useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import styles from "../styles/Home.module.css";
import displayPedestalModels from "../lib/displayPedestalModels.json";

const makeConcreteTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  context.fillStyle = "#10131a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 1400; i += 1) {
    const shade = 28 + Math.floor(Math.random() * 26);
    context.fillStyle = `rgba(${shade}, ${shade + 1}, ${shade + 4}, 0.18)`;
    context.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 2.4 + 0.4,
      Math.random() * 2.4 + 0.4
    );
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(3, 3);
  return texture;
};

const disposeObject = (object) => {
  const geometries = new Set();
  const materials = new Set();

  object.traverse((child) => {
    if (child.geometry) {
      geometries.add(child.geometry);
    }
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => materials.add(material));
    } else if (child.material) {
      materials.add(child.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
};

const makeEdgeMesh = (geometry, color, opacity = 0.85) =>
  new LineSegments(
    new EdgesGeometry(geometry),
    new LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    })
  );

const makeUserModel = (model) => {
  const group = new Group();
  const pointGeometry = new SphereGeometry(0.055, 18, 12);
  const primaryMaterial = new MeshBasicMaterial({
    color: model.primary,
    transparent: true,
    opacity: 0.95,
  });
  const secondaryMaterial = new MeshBasicMaterial({
    color: model.secondary,
    transparent: true,
    opacity: 0.82,
  });
  const points = model.nodes.map(([x, y, z]) => new Vector3(x, y, z));
  const linePoints = [];

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    linePoints.push(point, next);

    if (index % 2 === 0 && points[index + 2]) {
      linePoints.push(point, points[index + 2]);
    }

    const node = new Mesh(
      pointGeometry.clone(),
      index % 2 === 0 ? primaryMaterial.clone() : secondaryMaterial.clone()
    );
    node.position.copy(point);
    group.add(node);
  });

  const lineGeometry = new BufferGeometry().setFromPoints(linePoints);
  const lineMaterial = new LineBasicMaterial({
    color: model.primary,
    transparent: true,
    opacity: 0.62,
  });
  group.add(new LineSegments(lineGeometry, lineMaterial));

  group.position.set(0, 1.35, -1.95);
  group.scale.setScalar(1.34);
  return group;
};

const DisplayPedestal = ({ className = "" }) => {
  const hostRef = useRef(null);
  const sceneApiRef = useRef(null);
  const modelIndexRef = useRef(0);
  const hoverRef = useRef(false);
  const [modelIndex, setModelIndex] = useState(0);
  const activeModel = displayPedestalModels[modelIndex];

  const swapModel = useCallback(() => {
    setModelIndex((currentIndex) => (currentIndex + 1) % displayPedestalModels.length);
  }, []);

  useEffect(() => {
    modelIndexRef.current = modelIndex;
    sceneApiRef.current?.setUserModel(displayPedestalModels[modelIndex]);
  }, [modelIndex]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(3.1, 2.25, 4.25);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const sceneRoot = new Group();
    scene.add(sceneRoot);

    scene.add(new AmbientLight(0x9fb7ff, 0.85));
    const cyanLight = new PointLight(0x67e8f9, 4.2, 8);
    cyanLight.position.set(-1.9, 2.1, 1.7);
    scene.add(cyanLight);
    const mintLight = new PointLight(0x86efac, 3.5, 7);
    mintLight.position.set(1.9, 1.8, 2.1);
    scene.add(mintLight);
    const violetLight = new PointLight(0xc084fc, 2.8, 8);
    violetLight.position.set(0, 2.7, -1.8);
    scene.add(violetLight);

    const floorTexture = makeConcreteTexture();
    const floor = new Mesh(
      new PlaneGeometry(10, 10),
      new MeshStandardMaterial({
        color: 0x171a20,
        metalness: 0.38,
        roughness: 0.24,
        map: floorTexture,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.34;
    sceneRoot.add(floor);

    const reflection = new Mesh(
      new PlaneGeometry(3.2, 1.45),
      new MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      })
    );
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(0, -0.325, 0.1);
    sceneRoot.add(reflection);

    const pedestalGroup = new Group();
    pedestalGroup.position.y = 0.02;
    sceneRoot.add(pedestalGroup);

    const baseGeometry = new CylinderGeometry(1.58, 1.8, 0.42, 6);
    const base = new Mesh(
      baseGeometry,
      new MeshStandardMaterial({
        color: 0x030407,
        metalness: 0.28,
        roughness: 0.78,
      })
    );
    base.rotation.y = Math.PI / 6;
    pedestalGroup.add(base);

    const baseEdges = makeEdgeMesh(baseGeometry, 0x67e8f9, 0.55);
    baseEdges.rotation.copy(base.rotation);
    pedestalGroup.add(baseEdges);

    const neonRing = new Mesh(
      new TorusGeometry(1.54, 0.012, 10, 6),
      new MeshBasicMaterial({
        color: 0x86efac,
        transparent: true,
        opacity: 0.72,
      })
    );
    neonRing.rotation.x = Math.PI / 2;
    neonRing.rotation.z = Math.PI / 6;
    neonRing.position.y = 0.225;
    pedestalGroup.add(neonRing);

    const frameGroup = new Group();
    frameGroup.position.y = 1.2;
    pedestalGroup.add(frameGroup);

    const glassGeometry = new BoxGeometry(2.05, 1.28, 2.05);
    const glassShell = new Mesh(
      glassGeometry,
      new MeshStandardMaterial({
        color: 0x9feaff,
        metalness: 0.08,
        roughness: 0.03,
        transparent: true,
        opacity: 0.12,
      })
    );
    frameGroup.add(glassShell);

    const glassEdges = makeEdgeMesh(glassGeometry, 0x67e8f9, 0.9);
    frameGroup.add(glassEdges);

    const haloA = new Mesh(
      new TorusGeometry(1.18, 0.01, 10, 96),
      new MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.52,
      })
    );
    haloA.rotation.x = Math.PI / 2;
    frameGroup.add(haloA);

    const haloB = new Mesh(
      new TorusGeometry(0.86, 0.008, 10, 96),
      new MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.4,
      })
    );
    haloB.rotation.x = Math.PI / 2;
    haloB.rotation.y = Math.PI / 2.8;
    frameGroup.add(haloB);

    const cubeGeometry = new BoxGeometry(0.76, 0.76, 0.76);
    const hologramCube = new Mesh(
      cubeGeometry,
      new MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x67e8f9,
        emissiveIntensity: 0.62,
        metalness: 0.05,
        roughness: 0.18,
        transparent: true,
        opacity: 0.22,
      })
    );
    hologramCube.rotation.set(0.64, 0.5, 0.1);
    frameGroup.add(hologramCube);

    const cubeEdges = makeEdgeMesh(cubeGeometry, 0x86efac, 0.88);
    hologramCube.add(cubeEdges);

    const glowMaterials = [
      baseEdges.material,
      neonRing.material,
      glassEdges.material,
      haloA.material,
      haloB.material,
      hologramCube.material,
      cubeEdges.material,
    ];

    let userModelGroup = null;
    const setUserModel = (model) => {
      if (userModelGroup) {
        sceneRoot.remove(userModelGroup);
        disposeObject(userModelGroup);
      }
      userModelGroup = makeUserModel(model);
      sceneRoot.add(userModelGroup);
    };

    setUserModel(displayPedestalModels[modelIndexRef.current]);
    sceneApiRef.current = { setUserModel };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = motionQuery.matches;
    let frame = 0;
    let elapsed = 0;
    let glow = 1;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const render = () => {
      frame = window.requestAnimationFrame(render);
      const delta = isReducedMotion ? 0 : 0.016;
      elapsed += delta;

      const targetGlow = hoverRef.current ? 1.45 : 1;
      glow += (targetGlow - glow) * 0.08;
      glowMaterials.forEach((material) => {
        material.opacity = Math.min((material.userData.baseOpacity ?? material.opacity) * glow, 1);
        if ("emissiveIntensity" in material) {
          material.emissiveIntensity = 0.62 * glow;
        }
      });

      if (!isReducedMotion) {
        pedestalGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.08;
        frameGroup.position.y = 1.2 + Math.sin(elapsed * 1.15) * 0.045;
        frameGroup.rotation.y += 0.0024;
        hologramCube.rotation.x += 0.006;
        hologramCube.rotation.y += 0.009;
        haloA.rotation.z -= 0.004;
        haloB.rotation.z += 0.005;

        if (userModelGroup) {
          userModelGroup.rotation.y -= 0.003;
          userModelGroup.position.y = 1.35 + Math.sin(elapsed * 0.9) * 0.04;
        }

        const orbit = elapsed * 0.18;
        camera.position.x = Math.sin(orbit) * 3.15;
        camera.position.z = 4.15 + Math.cos(orbit) * 0.68;
        camera.position.y = 2.15 + Math.sin(orbit * 0.7) * 0.18;
        camera.lookAt(0, 0.7, 0);
      }

      renderer.render(scene, camera);
    };

    glowMaterials.forEach((material) => {
      material.userData.baseOpacity = material.opacity;
    });

    const onMotionChange = (event) => {
      isReducedMotion = event.matches;
      renderer.render(scene, camera);
    };

    motionQuery.addEventListener("change", onMotionChange);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      motionQuery.removeEventListener("change", onMotionChange);
      resizeObserver.disconnect();
      sceneApiRef.current = null;
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      floorTexture.dispose();
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      swapModel();
    }
  };

  return (
    <div
      className={`${styles.displayPedestal} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={`Swap background user model. Current model: ${activeModel.label}`}
      onClick={swapModel}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <div ref={hostRef} className={styles.displayPedestalCanvas} aria-hidden="true" />
      <div className={styles.displayPedestalHud} aria-hidden="true">
        <span className={styles.displayPedestalModel}>{activeModel.label}</span>
        <span className={styles.displayPedestalSwatches}>
          {displayPedestalModels.map((model, index) => (
            <span
              key={model.label}
              className={`${styles.displayPedestalSwatch} ${
                index === modelIndex ? styles.displayPedestalSwatchActive : ""
              }`}
              style={{ "--swatch": model.primary }}
            />
          ))}
        </span>
      </div>
    </div>
  );
};

export default DisplayPedestal;

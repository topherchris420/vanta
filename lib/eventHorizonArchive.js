/**
 * The Event Horizon Archive.
 *
 * The hero stage renders one sentence: every signal this studio has ever made
 * is pulled inward, quantised, and written onto the surface of a black hole.
 * Each layer carries a clause of it, so nothing here is geometry for its own
 * sake:
 *
 *   starfield      the information still out there, unread
 *   lattice        the spacetime well the signal falls through
 *   platter        the archive itself: tracks, sectors, spun Keplerian
 *   streams        information on its way in, stretched by the fall
 *   horizon        the black surface every bit finally lands on
 *   lensing        light that circled the hole and came back to the camera
 *   index          the visitor-swappable model, caged and being written
 *
 * The scene owns no DOM, no loop, and no listeners. It exposes a small API the
 * React shell drives, so the runtime contract (paused offscreen, static under
 * reduced motion, capped pixel ratio) stays in one place.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TetrahedronGeometry,
  Vector3,
} from "three";

const MINT = new Color(0x8cf0c6);
const AMBER = new Color(0xe4b65c);
const PAPER = new Color(0xedf9f4);
const MUTED = new Color(0xa5b6ae);

// The shadow is drawn as an opaque sphere sitting just inside the photon ring,
// because that ring is exactly where a real shadow's edge appears.
const HORIZON_RADIUS = 1.16;
const PHOTON_RADIUS = 1.32;
const PLATTER_INNER = 1.74;
const PLATTER_OUTER = 4.5;
const LATTICE_INNER = 2.5;
// Far enough for the well to flatten out, close enough that its outer rings
// never sweep across the frame as huge soft ellipses.
const LATTICE_OUTER = 8;
const WELL_DEPTH = 3.6;
const INDEX_ORBIT = 2.8;
const INDEX_HEIGHT = 1.9;
// World radius the camera must always frame, whatever the panel's aspect is.
const FRAME_RADIUS = 3.95;
const CAMERA_FOV = 36;

// Shared by every shader in the scene so colour, noise, and highlight rolloff
// stay identical across layers instead of drifting per material.
const PRELUDE = `
  const float PI = 3.141592653589793;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Highlights roll off to white instead of clipping into flat plates.
  vec3 shoulder(vec3 c) {
    return 1.0 - exp(-c);
  }
`;

const shellGeometries = {
  tetra: (radius) => new TetrahedronGeometry(radius),
  octa: (radius) => new OctahedronGeometry(radius),
  cube: (radius) => new BoxGeometry(radius * 1.16, radius * 1.16, radius * 1.16),
  icosa: (radius) => new IcosahedronGeometry(radius),
};

const disposeObject = (object) => {
  const geometries = new Set();
  const materials = new Set();

  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => materials.add(material));
    } else if (child.material) {
      materials.add(child.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
};

/* ------------------------------------------------------------------ layers */

// Distant, unread information. Cheap depth cue that keeps the void from
// reading as an empty black rectangle.
const createStarfield = (detail, shared) => {
  const count = detail.stars;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const tints = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const radius = 34 + Math.random() * 46;
    const theta = Math.random() * Math.PI * 2;
    // Biased toward the disk plane so the void still has an orientation.
    const phi = Math.acos(1 - 2 * Math.random()) * 0.5 + Math.PI * 0.25;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius * 0.55;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    seeds[i] = Math.random();
    tints[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aTint", new Float32BufferAttribute(tints, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uPixelRatio: shared.uPixelRatio,
      uMint: { value: MINT },
      uPaper: { value: PAPER },
      uMuted: { value: MUTED },
    },
    vertexShader: `
      ${PRELUDE}
      attribute float aSeed;
      attribute float aTint;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vTint;

      void main() {
        vTint = aTint;
        float twinkle = 0.45 + 0.55 * sin(uTime * (0.4 + aSeed * 1.6) + aSeed * 42.0);
        vAlpha = 0.18 + 0.62 * twinkle * (0.35 + aSeed * 0.65);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (26.0 + aSeed * 34.0) * uPixelRatio / max(-mv.z, 0.001);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uIntensity;
      uniform vec3 uMint;
      uniform vec3 uPaper;
      uniform vec3 uMuted;
      varying float vAlpha;
      varying float vTint;

      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float falloff = exp(-dot(d, d) * 22.0);
        vec3 tint = mix(uMuted, mix(uMint, uPaper, vTint), vTint);
        gl_FragColor = vec4(tint, falloff * vAlpha * (0.7 + 0.4 * uIntensity));
      }
    `,
  });

  const points = new Points(geometry, material);
  points.renderOrder = -10;
  points.frustumCulled = false;
  return points;
};

// Flamm's funnel drawn as a polar wireframe: log-spaced rings plus spokes, so
// the well reads as geometry rather than as a gradient.
const createSpacetimeLattice = (detail, shared) => {
  const rings = detail.latticeRings;
  const spokes = detail.latticeSpokes;
  const segments = detail.latticeSegments;
  const radiusAt = (index) =>
    LATTICE_INNER *
    Math.pow(LATTICE_OUTER / LATTICE_INNER, index / (rings - 1));

  const positions = [];
  const radii = [];

  const push = (angle, radius) => {
    positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    radii.push(radius);
  };

  for (let ring = 0; ring < rings; ring += 1) {
    const radius = radiusAt(ring);
    for (let step = 0; step < segments; step += 1) {
      push((step / segments) * Math.PI * 2, radius);
      push(((step + 1) / segments) * Math.PI * 2, radius);
    }
  }

  for (let spoke = 0; spoke < spokes; spoke += 1) {
    const angle = (spoke / spokes) * Math.PI * 2;
    for (let ring = 0; ring < rings - 1; ring += 1) {
      push(angle, radiusAt(ring));
      push(angle, radiusAt(ring + 1));
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRadius", new Float32BufferAttribute(radii, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uRipple: shared.uRipple,
      uInner: { value: LATTICE_INNER },
      uOuter: { value: LATTICE_OUTER },
      uDepth: { value: WELL_DEPTH },
      uMint: { value: MINT },
      uAmber: { value: AMBER },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      attribute float aRadius;
      uniform float uTime;
      uniform float uDepth;
      uniform float uInner;
      uniform float uRipple;
      varying float vRadius;

      void main() {
        vRadius = aRadius;
        // The well: deepest at the throat, asymptotically flat far out.
        float well = -uDepth * pow(uInner / max(aRadius, uInner), 0.85);
        float breathe = sin(aRadius * 0.8 - uTime * 1.9) * exp(-aRadius * 0.1);
        float ripple =
          uRipple * sin(aRadius * 1.7 - uTime * 6.5) * exp(-(aRadius - uInner) * 0.1);
        vec3 displaced = vec3(position.x, well + breathe * 0.06 + ripple * 0.7, position.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uRipple;
      uniform float uInner;
      uniform float uOuter;
      uniform vec3 uMint;
      uniform vec3 uAmber;
      uniform vec3 uPaper;
      varying float vRadius;

      void main() {
        float near = smoothstep(uInner * 0.98, uInner * 1.3, vRadius);
        float far = smoothstep(uOuter * 0.88, uOuter * 0.58, vRadius);
        float fade = near * far;
        vec3 color = mix(uAmber, uMint, smoothstep(uInner, uInner * 3.4, vRadius));
        float wave = 0.5 + 0.5 * sin(vRadius * 1.7 - uTime * 6.5);
        color += uPaper * wave * uRipple * 0.9;
        float alpha = fade * (0.17 + 0.2 * uIntensity + 0.55 * uRipple * wave);
        gl_FragColor = vec4(shoulder(color), alpha);
      }
    `,
  });

  const lattice = new LineSegments(geometry, material);
  lattice.renderOrder = 1;
  lattice.frustumCulled = false;
  return lattice;
};

// The archive. Concentric tracks cut into angular sectors, each sector one lit
// or dark bit, the whole platter spun at Keplerian rates and Doppler-beamed so
// the approaching limb burns brighter than the receding one.
const createDataPlatter = (detail, shared) => {
  const geometry = new RingGeometry(
    PLATTER_INNER * 0.94,
    PLATTER_OUTER * 1.04,
    detail.platterSegments,
    2
  );

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uIngest: shared.uIngest,
      uInner: { value: PLATTER_INNER },
      uOuter: { value: PLATTER_OUTER },
      uTracks: { value: detail.platterTracks },
      uMint: { value: MINT },
      uAmber: { value: AMBER },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      varying vec2 vLocal;
      varying vec3 vWorld;

      void main() {
        vLocal = position.xy;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uIngest;
      uniform float uInner;
      uniform float uOuter;
      uniform float uTracks;
      uniform vec3 uMint;
      uniform vec3 uAmber;
      uniform vec3 uPaper;
      varying vec2 vLocal;
      varying vec3 vWorld;

      void main() {
        float radius = length(vLocal);
        // A long outer taper: without it the coldest tracks stay just bright
        // enough to sweep the whole panel as haze.
        float edge = smoothstep(uInner * 0.99, uInner * 1.06, radius)
          * smoothstep(uOuter, uOuter * 0.62, radius);
        if (edge <= 0.001) discard;

        float span = uOuter - uInner;
        float normalized = clamp((radius - uInner) / span, 0.0, 1.0);
        float angle = atan(vLocal.y, vLocal.x);

        // Every track is a rigid ring of sectors, and each track carries the
        // orbital rate of its own radius, so the platter shears as it spins.
        float trackF = normalized * uTracks;
        float track = floor(trackF);
        float trackRadius = uInner + (track + 0.5) / uTracks * span;
        float rate = 5.6 / pow(trackRadius, 1.5);
        float sectors = floor(96.0 + track * 9.0);
        float sectorF = fract((angle + uTime * rate) / (2.0 * PI) + 4.0) * sectors;
        float sector = floor(sectorF);

        // One bit per sector, rewritten on its own slow schedule.
        float bit = hash21(vec2(sector, track) + 0.5);
        float lit = step(
          0.58 - 0.24 * uIngest,
          fract(bit * 31.7 + uTime * (0.03 + bit * 0.16))
        );
        float gapU = fract(sectorF);
        float gapV = fract(trackF);
        float cell =
          smoothstep(0.0, 0.1, gapU) * smoothstep(1.0, 0.9, gapU) *
          smoothstep(0.0, 0.14, gapV) * smoothstep(1.0, 0.86, gapV);
        // Unlit sectors stay legible, so the archive reads as a continuous
        // platter carrying data rather than as scattered blocks.
        float data = cell * mix(0.42, 1.0, lit);

        // Spiral density waves keep the platter from reading as a bitmap.
        float spiral = 0.5 + 0.5 * sin(angle * 2.0 - log(radius) * 9.0 + uTime * 1.1);
        float heat = pow(1.0 - normalized, 1.5);
        float density = data * (0.45 + 0.85 * spiral) * (0.1 + 1.95 * heat);

        // Relativistic beaming: material sweeping toward the camera is bright.
        // The receding limb keeps a floor, so the archive still reads as a
        // closed ring instead of a comet tail.
        vec3 flow = normalize(vec3(sin(angle), 0.0, cos(angle)));
        vec3 toCamera = normalize(cameraPosition - vWorld);
        float beam = clamp(0.8 + 0.42 * dot(flow, toCamera), 0.38, 1.45);
        density *= pow(beam, 1.8);

        vec3 color = mix(uAmber, uMint, smoothstep(0.15, 0.72, 1.0 - normalized));
        color = mix(color, uPaper, pow(1.0 - normalized, 3.2) * 0.85);
        color *= density * (1.0 + 0.5 * uIntensity + 0.9 * uIngest);

        // The innermost stable orbit, drawn as a hard lip of white.
        float lip = exp(-pow((radius - uInner * 1.03) / 0.075, 2.0));
        color += uPaper * lip * pow(beam, 1.8) * (0.7 + 0.5 * uIngest);
        density = max(density, lip * 0.9);

        gl_FragColor = vec4(shoulder(color), edge * clamp(density * 1.3, 0.0, 1.0));
      }
    `,
  });

  const platter = new Mesh(geometry, material);
  platter.rotation.x = -Math.PI / 2;
  platter.renderOrder = 3;
  return platter;
};

// Filaments of information on the way in. All motion lives in the vertex
// shader, so the CPU cost of the infall is one uniform write per frame.
const createInfallStreams = (detail, shared) => {
  const filaments = detail.streamFilaments;
  const perFilament = detail.streamLength;
  const count = filaments * perFilament;

  const seeds = new Float32Array(count);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const heights = new Float32Array(count);
  const speeds = new Float32Array(count);
  const tints = new Float32Array(count);

  // Spawned just inside the framed radius: a filament that starts off-camera
  // spends its whole descent invisible and only flickers at the very end.
  for (let filament = 0; filament < filaments; filament += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 3.4;
    const height = (Math.random() - 0.5) * 4.4;
    const speed = 0.03 + Math.random() * 0.034;
    const tint = Math.random();

    for (let step = 0; step < perFilament; step += 1) {
      const index = filament * perFilament + step;
      seeds[index] = step / perFilament + Math.random() * 0.004;
      angles[index] = angle + (Math.random() - 0.5) * 0.34;
      radii[index] = radius + (Math.random() - 0.5) * 1.1;
      heights[index] = height + (Math.random() - 0.5) * 0.8;
      speeds[index] = speed;
      tints[index] = tint;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(count * 3), 3)
  );
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aAngle", new Float32BufferAttribute(angles, 1));
  geometry.setAttribute("aRadius", new Float32BufferAttribute(radii, 1));
  geometry.setAttribute("aHeight", new Float32BufferAttribute(heights, 1));
  geometry.setAttribute("aSpeed", new Float32BufferAttribute(speeds, 1));
  geometry.setAttribute("aTint", new Float32BufferAttribute(tints, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uIngest: shared.uIngest,
      uPixelRatio: shared.uPixelRatio,
      uTarget: { value: PLATTER_INNER * 0.86 },
      uMint: { value: MINT },
      uAmber: { value: AMBER },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      attribute float aSeed;
      attribute float aAngle;
      attribute float aRadius;
      attribute float aHeight;
      attribute float aSpeed;
      attribute float aTint;
      uniform float uTime;
      uniform float uIngest;
      uniform float uPixelRatio;
      uniform float uTarget;
      varying float vLife;
      varying float vTint;

      void main() {
        float life = fract(aSeed + uTime * aSpeed * (1.0 + uIngest * 0.9));
        // Free fall: slow drift far out, then a hard plunge at the end.
        float fall = pow(life, 1.6);
        float radius = mix(aRadius, uTarget, fall);
        // Angular momentum: the winding tightens as the radius collapses.
        float angle = aAngle - (life * 2.2 + pow(life, 3.0) * 11.0);
        float flatten = 1.0 - smoothstep(0.05, 0.92, life);
        vec3 traced = vec3(cos(angle) * radius, aHeight * flatten, sin(angle) * radius);

        vLife = life;
        vTint = aTint;
        vec4 mv = modelViewMatrix * vec4(traced, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (10.0 + 26.0 * pow(life, 2.0)) * uPixelRatio / max(-mv.z, 0.001);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uIntensity;
      uniform float uIngest;
      uniform vec3 uMint;
      uniform vec3 uAmber;
      uniform vec3 uPaper;
      varying float vLife;
      varying float vTint;

      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float falloff = exp(-dot(d, d) * 17.0);
        float enter = smoothstep(0.0, 0.08, vLife);
        float land = 1.0 - smoothstep(0.9, 1.0, vLife);
        // Blueshift on the way down: cool amber out there, paper-white at the edge.
        vec3 color = mix(mix(uAmber, uMint, vTint), uPaper, pow(vLife, 2.4));
        float energy = (0.35 + 1.5 * pow(vLife, 2.0)) * (1.0 + 0.6 * uIntensity + uIngest);
        gl_FragColor = vec4(shoulder(color * energy), falloff * enter * land);
      }
    `,
  });

  const streams = new Points(geometry, material);
  streams.renderOrder = 2;
  streams.frustumCulled = false;
  return streams;
};

// The surface itself. Black everywhere except the encoding, which is a lattice
// of equal-area cells — the holographic bound, drawn literally.
const createHorizon = (shared) => {
  const geometry = new SphereGeometry(HORIZON_RADIUS, 96, 64);
  const material = new ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uIngest: shared.uIngest,
      uMint: { value: MINT },
      uAmber: { value: AMBER },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      varying vec3 vLocal;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vLocal = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uIngest;
      uniform vec3 uMint;
      uniform vec3 uAmber;
      uniform vec3 uPaper;
      varying vec3 vLocal;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - clamp(dot(vViewNormal, vViewDir), 0.0, 1.0), 2.6);

        // Equal-area cells: one bit per cell, the same size at the pole as at
        // the equator, so the encoding never pinches.
        float phi = acos(clamp(vLocal.y, -1.0, 1.0));
        float theta = atan(vLocal.z, vLocal.x) + uTime * 0.05;
        // Fine enough to read as an encoding rather than as tiling.
        float rows = 62.0;
        float rowF = phi / PI * rows;
        float row = floor(rowF);
        float columns = max(4.0, floor(rows * 2.0 * sin((row + 0.5) / rows * PI)));
        float columnF = fract(theta / (2.0 * PI) + 4.0) * columns;
        float column = floor(columnF);

        float u = fract(columnF);
        float v = fract(rowF);
        float border = min(min(u, 1.0 - u), min(v, 1.0 - v));
        float lattice = smoothstep(0.09, 0.0, border);

        float bit = hash21(vec2(column, row) + 0.5);
        float written = step(
          0.9 - 0.4 * uIngest,
          fract(bit * 17.3 + uTime * (0.05 + bit * 0.24))
        );

        vec3 color = uMint * lattice * 0.4;
        color += mix(uPaper, uAmber, 0.35) * written * (0.35 + 1.2 * uIngest) * (0.25 + lattice);
        // Only grazing angles reveal the encoding; the face stays near-black,
        // so the shadow still reads as a hole and not as a wireframe planet.
        color *= (0.02 + 1.75 * fresnel) * (0.8 + 0.5 * uIntensity);
        // A hard rim so the silhouette reads as a horizon, not a dim sphere.
        color += mix(uMint, uPaper, 0.4) * pow(fresnel, 3.4) * (0.3 + 0.85 * uIngest);

        gl_FragColor = vec4(shoulder(color), 1.0);
      }
    `,
  });

  const horizon = new Mesh(geometry, material);
  horizon.renderOrder = 0;
  return horizon;
};

// Everything the geometry cannot show: the photon ring, and the far side of the
// platter bent over the top of the hole and under its floor. Billboarded,
// because a lensed image is always a circle around the shadow.
const createLensing = (shared) => {
  const size = PLATTER_OUTER * 1.5;
  const geometry = new PlaneGeometry(size * 2, size * 2);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uIngest: shared.uIngest,
      uTilt: shared.uTilt,
      uBeam: shared.uBeam,
      uScale: { value: size },
      uRing: { value: PHOTON_RADIUS },
      // The secondary image sits just outside the photon ring, not out where
      // the real platter is; a wide arc reads as haze instead of as lensing.
      uArc: { value: PHOTON_RADIUS * 1.2 },
      uMint: { value: MINT },
      uAmber: { value: AMBER },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uIngest;
      uniform float uTilt;
      uniform float uBeam;
      uniform float uScale;
      uniform float uRing;
      uniform float uArc;
      uniform vec3 uMint;
      uniform vec3 uAmber;
      uniform vec3 uPaper;
      varying vec2 vUv;

      void main() {
        vec2 p = (vUv - 0.5) * 2.0 * uScale;
        float radius = length(p);
        vec2 dir = p / max(radius, 0.0001);

        // Doppler beaming applies to the lensed images too.
        float beam = 1.0 + uBeam * 0.7 * dir.x;

        // Photon ring: light that orbited the hole once before escaping. The
        // thinnest, hottest feature in the frame, and the edge of the shadow.
        float ring = exp(-pow((radius - uRing) / 0.026, 2.0));
        ring += 0.4 * exp(-pow((radius - uRing * 1.03) / 0.08, 2.0));

        // The lensed platter: the far face bent over the top of the shadow and
        // the near underside bent below it, both carrying the platter's own
        // track structure so the two images read as one object.
        float arc = exp(-pow((radius - uArc) / 0.075, 2.0));
        arc += 0.75 * exp(-pow((radius - uArc * 1.18) / 0.14, 2.0));
        arc += 0.3 * exp(-pow((radius - uArc * 1.5) / 0.24, 2.0));
        float tracks = 0.6 + 0.4 * sin(radius * 52.0);
        float vertical = pow(abs(dir.y), 1.05);
        float lensed = arc * tracks * vertical * uTilt;

        // Escaping glow, kept tight against the shadow so the panel stays sharp.
        float halo = exp(-pow((radius - uRing) / 0.44, 2.0))
          * smoothstep(uRing * 0.94, uRing * 1.05, radius);

        float flare = 0.6 + 0.4 * (0.5 + 0.5 * sin(uTime * 1.3));
        vec3 color = mix(uMint, uPaper, 0.6) * ring * (2.2 + 1.1 * uIngest);
        color += mix(uAmber, uMint, 0.55) * lensed * 2.6;
        color += uMint * halo * 0.24 * flare;
        color *= beam * (1.0 + 0.45 * uIntensity);

        float alpha = clamp(ring * 1.3 + lensed * 1.5 + halo * 0.22, 0.0, 1.0);
        gl_FragColor = vec4(shoulder(color), alpha);
      }
    `,
  });

  const lensing = new Mesh(geometry, material);
  lensing.renderOrder = 4;
  return lensing;
};

// The visitor's model, caged and tethered: the thing currently being written.
const createIndexConstellation = (model, shared) => {
  const group = new Group();
  const primary = new Color(model.primary);
  const secondary = new Color(model.secondary);
  const nodes = model.nodes.map(([x, y, z]) => new Vector3(x, y, z));
  const scale = 1.5;

  const nodeGeometry = new OctahedronGeometry(0.075);
  const primaryMaterial = new MeshBasicMaterial({
    color: primary,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const secondaryMaterial = new MeshBasicMaterial({
    color: secondary,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const linkPositions = [];
  const linkT = [];
  const linkOffset = [];

  const link = (from, to, offset) => {
    linkPositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
    linkT.push(0, 1);
    linkOffset.push(offset, offset);
  };

  nodes.forEach((node, index) => {
    link(node, nodes[(index + 1) % nodes.length], index * 0.17);
    if (nodes[index + 2]) link(node, nodes[index + 2], 0.5 + index * 0.11);

    const mesh = new Mesh(
      nodeGeometry,
      index % 2 === 0 ? primaryMaterial : secondaryMaterial
    );
    mesh.position.copy(node).multiplyScalar(scale);
    mesh.rotation.set(index * 0.7, index * 1.1, 0);
    group.add(mesh);
  });

  const linkGeometry = new BufferGeometry();
  linkGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(linkPositions.map((value) => value * scale), 3)
  );
  linkGeometry.setAttribute("aT", new Float32BufferAttribute(linkT, 1));
  linkGeometry.setAttribute("aOffset", new Float32BufferAttribute(linkOffset, 1));

  const linkMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIntensity: shared.uIntensity,
      uAppear: shared.uAppear,
      uPrimary: { value: primary },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      attribute float aT;
      attribute float aOffset;
      varying float vT;
      varying float vOffset;

      void main() {
        vT = aT;
        vOffset = aOffset;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uAppear;
      uniform vec3 uPrimary;
      uniform vec3 uPaper;
      varying float vT;
      varying float vOffset;

      void main() {
        // One packet running the length of every link.
        float head = fract(uTime * 0.38 + vOffset);
        float packet = exp(-pow((vT - head) / 0.13, 2.0));
        vec3 color = mix(uPrimary, uPaper, packet * 0.85);
        float alpha = (0.34 + 0.66 * packet) * (0.6 + 0.4 * uIntensity) * uAppear;
        gl_FragColor = vec4(shoulder(color * (0.8 + packet)), alpha);
      }
    `,
  });

  group.add(new LineSegments(linkGeometry, linkMaterial));

  const cageGeometry = (shellGeometries[model.shell] ?? shellGeometries.icosa)(1.02);
  const cage = new LineSegments(
    new EdgesGeometry(cageGeometry),
    new LineBasicMaterial({
      color: secondary,
      transparent: true,
      opacity: 0.45,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  cageGeometry.dispose();
  group.add(cage);

  group.traverse((child) => {
    child.renderOrder = 5;
  });

  return group;
};

// The write channel: a dashed beam from the caged index down into the horizon.
const createTether = (shared, length) => {
  const segments = 48;
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const along = new Float32Array((segments + 1) * 2);

  // Object3D.lookAt aims +Z at its target, so the beam runs down +Z from the
  // caged index toward the horizon.
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    positions[index * 6 + 2] = t * length;
    positions[index * 6 + 5] = Math.min((index + 0.98) / segments, 1) * length;
    along[index * 2] = t;
    along[index * 2 + 1] = t;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aAlong", new Float32BufferAttribute(along, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uIngest: shared.uIngest,
      uAppear: shared.uAppear,
      uMint: { value: MINT },
      uPaper: { value: PAPER },
    },
    vertexShader: `
      ${PRELUDE}
      attribute float aAlong;
      varying float vAlong;

      void main() {
        vAlong = aAlong;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      ${PRELUDE}
      uniform float uTime;
      uniform float uIngest;
      uniform float uAppear;
      uniform vec3 uMint;
      uniform vec3 uPaper;
      varying float vAlong;

      void main() {
        float packet = pow(fract(vAlong * 6.0 - uTime * 0.9), 6.0);
        // Stops at the horizon rather than running through it.
        float taper = smoothstep(0.0, 0.12, vAlong) * smoothstep(0.88, 0.7, vAlong);
        vec3 color = mix(uMint, uPaper, packet);
        gl_FragColor = vec4(
          shoulder(color * (0.5 + packet * 2.0 + uIngest)),
          taper * (0.1 + 0.7 * packet) * uAppear
        );
      }
    `,
  });

  const tether = new LineSegments(geometry, material);
  tether.renderOrder = 5;
  return tether;
};

/* -------------------------------------------------------------------- scene */

export const createEventHorizonArchive = ({ detail, model }) => {
  const shared = {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uIngest: { value: 0 },
    uRipple: { value: 0 },
    uAppear: { value: 1 },
    uTilt: { value: 1 },
    uBeam: { value: 1 },
    uPixelRatio: { value: 1 },
  };

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
  const root = new Group();
  scene.add(root);

  root.add(createStarfield(detail, shared));
  root.add(createSpacetimeLattice(detail, shared));
  root.add(createDataPlatter(detail, shared));
  root.add(createInfallStreams(detail, shared));

  const horizon = createHorizon(shared);
  root.add(horizon);

  const lensing = createLensing(shared);
  root.add(lensing);

  const indexOrbit = new Group();
  const indexSpin = new Group();
  indexOrbit.add(indexSpin);
  indexOrbit.add(createTether(shared, Math.hypot(INDEX_ORBIT, INDEX_HEIGHT)));
  root.add(indexOrbit);

  let constellation = null;
  const setIndexModel = (nextModel) => {
    if (constellation) {
      indexSpin.remove(constellation);
      disposeObject(constellation);
    }
    constellation = createIndexConstellation(nextModel, shared);
    indexSpin.add(constellation);
  };
  setIndexModel(model);

  let orbitRadius = 14;
  let elapsed = 0;
  let hover = 0;
  let hoverTarget = 0;
  let ingest = 0;
  let ripple = 0;
  let appear = 1;
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  const cameraRight = new Vector3();
  const limbVelocity = new Vector3();
  const toCamera = new Vector3();

  const resize = (width, height) => {
    camera.aspect = Math.max(width, 1) / Math.max(height, 1);
    camera.updateProjectionMatrix();

    const verticalFov = (camera.fov * Math.PI) / 180;
    const verticalDistance = FRAME_RADIUS / Math.tan(verticalFov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const horizontalDistance = FRAME_RADIUS / Math.tan(horizontalFov / 2);
    orbitRadius = Math.max(verticalDistance, horizontalDistance) * 0.92;

    // Re-place the camera without advancing the clock, so a still frame is
    // never left standing at the previous aspect's orbit.
    update(0);
  };

  const update = (delta) => {
    elapsed += delta;

    hover += (hoverTarget - hover) * Math.min(1, delta * 5);
    ingest *= Math.exp(-delta * 2.6);
    ripple *= Math.exp(-delta * 1.5);
    appear += (1 - appear) * Math.min(1, delta * 2.6);
    pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, delta * 3.2);
    pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, delta * 3.2);

    shared.uTime.value = elapsed;
    shared.uIntensity.value = hover;
    shared.uIngest.value = ingest;
    shared.uRipple.value = ripple;
    shared.uAppear.value = appear;

    // A slow drift with a low sightline, so the platter stays near edge-on and
    // the lensed arcs keep their crescents.
    const azimuth = elapsed * 0.07 + pointer.x * 0.42;
    const elevation = 0.2 + Math.sin(elapsed * 0.11) * 0.09 - pointer.y * 0.22;
    const distance = orbitRadius * (1 - hover * 0.08);
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance
    );
    camera.lookAt(0, 0.06, 0);

    // The lensed arcs only exist while the platter is close to edge-on.
    shared.uTilt.value = 1 - Math.min(1, Math.abs(elevation) / 0.62) ** 1.4;

    // Which screen edge carries the approaching limb, for the beaming term.
    // The platter spins so the material at the screen-right limb travels along
    // (-right.z, 0, right.x); how much of that points at the camera decides
    // which side of the lensed images burns brighter.
    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    limbVelocity.set(-cameraRight.z, 0, cameraRight.x).normalize();
    toCamera.copy(camera.position).normalize();
    shared.uBeam.value = limbVelocity.dot(toCamera);

    horizon.rotation.y = elapsed * 0.06;
    lensing.quaternion.copy(camera.quaternion);

    const indexAngle = elapsed * 0.13;
    indexOrbit.position.set(
      Math.cos(indexAngle) * INDEX_ORBIT,
      INDEX_HEIGHT + Math.sin(elapsed * 0.5) * 0.1,
      Math.sin(indexAngle) * INDEX_ORBIT
    );
    indexOrbit.lookAt(0, 0, 0);
    indexSpin.rotation.y = elapsed * 0.42;
    indexSpin.rotation.x = Math.sin(elapsed * 0.31) * 0.28;
    // Tidal stretch: the cage is pulled long on the axis facing the hole.
    const stretch = 1 + (0.14 + ingest * 0.4) * Math.sin(elapsed * 0.9);
    indexSpin.scale.set(appear, appear * stretch, appear);
  };

  return {
    scene,
    camera,
    update,
    resize,
    setIndexModel: (nextModel) => {
      setIndexModel(nextModel);
      appear = 0.05;
    },
    setHover: (value) => {
      hoverTarget = value ? 1 : 0;
    },
    setPointer: (x, y) => {
      pointerTarget.x = Math.max(-1, Math.min(1, x));
      pointerTarget.y = Math.max(-1, Math.min(1, y));
    },
    setPixelRatio: (value) => {
      shared.uPixelRatio.value = value;
    },
    // A write event: the horizon flares, the platter densifies, and a
    // gravitational wave leaves the throat.
    ingestPulse: () => {
      ingest = 1;
      ripple = 1;
    },
    settle: (seconds) => {
      update(seconds);
    },
    dispose: () => {
      disposeObject(scene);
    },
  };
};

export default createEventHorizonArchive;

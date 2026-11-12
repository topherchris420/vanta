/**
 * The studio, as a three.js scene with a small imperative API.
 *
 * The React page owns every decision (what is open, what is playing, what the
 * visitor has found); this module owns pixels and the camera. It never touches
 * the DOM outside its host element, never plays sound, and runs its loop only
 * when there is something to draw, following lib/studio/quality.js.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Box3,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Raycaster,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import archiveModels from "../../displayPedestalModels.json";
import { createEventHorizonArchive } from "../../eventHorizonArchive";
import signalExperience from "../../signalExperience";
import instruments from "../instruments";
import layoutModel from "../layout";
import navigation from "../navigation";
import quality from "../quality";
import { buildArchitecture, SUN_POSITION, SUN_TARGET } from "./architecture";
import { createKit, createMaterials, disposeTree } from "./kit";
import { addPendants, loadImageTexture } from "./props";
import { buildRooms } from "./rooms";
import { drawMonitor, drawRackScope, drawScope, drawSynthDisplay } from "./screens";
import { createGlowTexture } from "./textures";

const { ARCHIVE_DETAIL } = signalExperience;
const { chladni, chladniModeAt, envelopeAt, followLevel, stepGrains, WAVEFORMS, SYNTH_LIMITS } = instruments;
const { zoneAt } = layoutModel;
const {
  clamp,
  easeInOutCubic,
  findPath,
  glideDuration,
  hasLineOfSight,
  pathLength,
  pointAlong,
  poseFromView,
  resolveCollisions,
  shortestAngle,
  stepWalker,
  yawToward,
} = navigation;
const { TIERS, createFrameGovernor, lowerTier, resolveStudioMode, resolveStudioPixelRatio } = quality;

const HIDDEN_KINDS = new Set(["thread"]);
const PITCH_LIMIT = 1.25;
const LOOK_SENSITIVITY = 0.0042;

const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function createStudio({
  host,
  layout,
  practice,
  documents = [],
  tierId = "high",
  reducedMotion = false,
  isMobile = false,
  fonts,
  events = {},
}) {
  const emit = (name, ...args) => {
    try {
      events[name]?.(...args);
    } catch (error) {
      console.warn(`Studio event ${name} failed.`, error);
    }
  };

  let tier = TIERS[tierId] ?? TIERS.medium;
  let autoQuality = true;
  let motionReduced = reducedMotion;

  /* ------------------------------------------------------------ renderer */

  const renderer = new WebGLRenderer({
    antialias: tier.id !== "low",
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = tier.shadowMapSize > 0;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setPixelRatio(resolveStudioPixelRatio(window.devicePixelRatio, tier.id, isMobile));
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(0x050806);
  scene.fog = new FogExp2(0x070b09, 0.018);
  const camera = new PerspectiveCamera(isMobile ? 70 : 62, 1, 0.05, 160);

  const shared = { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } };

  // Environment reflections, kept faint: they are what make brass read as
  // brass, not a light source.
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = tier.environment ? environment : null;
  scene.environmentIntensity = 0.22;

  /* -------------------------------------------------------------- lights */

  const hemi = new HemisphereLight(0x9fbdb2, 0x2a1d12, 1.1);
  scene.add(hemi);

  // The last of the daylight, low in the north-west, through the windows.
  const sun = new DirectionalLight(0xffc68a, 6);
  sun.position.copy(SUN_POSITION);
  sun.target.position.copy(SUN_TARGET);
  scene.add(sun, sun.target);
  const configureShadows = () => {
    const enabled = tier.shadowMapSize > 0;
    renderer.shadowMap.enabled = enabled;
    sun.castShadow = enabled;
    if (enabled) {
      sun.shadow.mapSize.set(tier.shadowMapSize, tier.shadowMapSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 2, far: 50 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = tier.softShadows ? 3 : 1;
    }
    // Without shadows a directional light shines through the ceiling, so it
    // gives way to the room's own light.
    sun.visible = enabled;
    hemi.intensity = enabled ? 1.1 : 1.6;
  };

  /* ------------------------------------------------------------ building */

  const loader = new TextureLoader();
  const images = new Map();
  let dirty = true;
  const loadImage = (src) => {
    if (!images.has(src)) {
      images.set(
        src,
        loadImageTexture(loader, src, Math.min(tier.anisotropy * 2, 16), () => {
          dirty = true;
        })
      );
    }
    return images.get(src);
  };

  const glowTexture = createGlowTexture();
  const materials = createMaterials(tier);
  const kit = createKit();
  const ctx = {
    kit,
    m: materials,
    scene,
    layout,
    practice,
    documents,
    tier,
    fonts,
    labels: [],
    accents: [],
    loadImage,
    glowTexture,
  };

  const architecture = buildArchitecture({ kit, materials, layout, tier, scene, shared });
  const dyn = buildRooms(ctx);
  const pendants = addPendants(ctx);
  kit.flush(scene);

  const pendantLights = new Map();
  pendants.forEach((pendant, id) => {
    const light = new PointLight(0xffd29a, 2.4, 9, 2);
    light.position.set(pendant.room.pendant.x, pendant.room.pendant.y - 0.06, pendant.room.pendant.z);
    scene.add(light);
    pendantLights.set(id, light);
  });

  // The Event Horizon Archive, built by the same module as the home page's
  // hero, mounted inside its instrument.
  const archive = createEventHorizonArchive({
    detail: ARCHIVE_DETAIL[tier.archiveDetail] ?? ARCHIVE_DETAIL.reduced,
    model: archiveModels[0],
    embedded: true,
  });
  dyn.archiveMount.add(archive.root);
  archive.setPixelRatio(renderer.getPixelRatio());
  archive.update(9.4, camera);

  const applyTier = () => {
    renderer.setPixelRatio(resolveStudioPixelRatio(window.devicePixelRatio, tier.id, isMobile));
    shared.uPixelRatio.value = renderer.getPixelRatio();
    archive.setPixelRatio(renderer.getPixelRatio());
    configureShadows();
    ctx.accents.forEach((light) => {
      light.visible = tier.accentLights;
    });
    scene.environment = tier.environment ? environment : null;
    if (architecture.dust) architecture.dust.visible = tier.dust > 0;
    dyn.plate.geometry.setDrawRange(0, Math.min(tier.plateParticles, dyn.plate.capacity));
    scene.traverse((child) => {
      if (child.material && !Array.isArray(child.material)) child.material.needsUpdate = true;
    });
    resize();
    dirty = true;
  };

  /* -------------------------------------------------------------- markers */

  const pickables = layout.objects.map((object) => {
    const [cx, cy, cz] = object.hit.c;
    const [sx, sy, sz] = object.hit.s;
    const material = new SpriteMaterial({
      map: glowTexture,
      color: new Color(0x89f2c2),
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    });
    const marker = new Sprite(material);
    marker.position.set(...object.anchor);
    marker.scale.setScalar(0.12);
    marker.renderOrder = 20;
    marker.visible = false;
    scene.add(marker);
    return {
      object,
      box: new Box3(new Vector3(cx - sx / 2, cy - sy / 2, cz - sz / 2), new Vector3(cx + sx / 2, cy + sy / 2, cz + sz / 2)),
      marker,
      opacity: 0,
    };
  });
  const pickById = new Map(pickables.map((entry) => [entry.object.id, entry]));
  const wallBoxes = layout.walls.map(
    (wall) => new Box3(new Vector3(wall.x[0], 0, wall.z[0]), new Vector3(wall.x[1], layout.studio.height, wall.z[1]))
  );

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hitPoint = new Vector3();

  const castFrom = (x, y, maxDistance) => {
    ndc.set(x, y);
    raycaster.setFromCamera(ndc, camera);
    const origin = raycaster.ray.origin;
    let best = null;
    pickables.forEach((entry) => {
      const hit = raycaster.ray.intersectBox(entry.box, hitPoint);
      if (!hit) return;
      const distance = hit.distanceTo(origin);
      if (distance > maxDistance) return;
      if (!best || distance < best.distance) best = { entry, distance };
    });
    if (!best) return null;
    for (const wall of wallBoxes) {
      const hit = raycaster.ray.intersectBox(wall, hitPoint);
      if (hit && hit.distanceTo(origin) < best.distance - 0.05) return null;
    }
    return best;
  };

  /* --------------------------------------------------------------- camera */

  const { studio } = layout;
  const pose = { x: 0, y: studio.eyeHeight, z: 0, yaw: 0, pitch: 0 };
  const walker = { x: studio.start.x, z: studio.start.z, vx: 0, vz: 0, yaw: studio.start.yaw };
  const input = { forward: 0, strafe: 0, turn: 0, run: false };
  const look = { dx: 0, dy: 0 };
  let mode = "intro";
  let glide = null;
  let focusedId = null;
  let bobPhase = 0;
  let zoneId = null;
  let targetId = null;
  let hoverNdc = null;
  let elapsed = 0;

  const introPose = poseFromView({ eye: studio.intro.eye, look: studio.intro.look });
  Object.assign(pose, introPose);

  const applyCamera = () => {
    camera.position.set(pose.x, pose.y, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0, "YXZ");
    camera.updateMatrixWorld();
  };
  applyCamera();

  // Glide along a list of floor points to a final pose. Reduced motion cuts
  // straight there; the page covers the cut with a short fade.
  const startGlide = (points, final, { onDone, nextMode } = {}) => {
    const route = points.length >= 2 ? points : [{ x: pose.x, z: pose.z }, { x: final.x, z: final.z }];
    const length = pathLength(route);
    const duration = motionReduced ? 0 : glideDuration(length);
    glide = {
      route,
      length,
      duration,
      t: 0,
      from: { y: pose.y, yaw: pose.yaw, pitch: pose.pitch },
      final,
      onDone,
      nextMode,
      settle: 0,
    };
    mode = "glide";
    dirty = true;
  };

  const finishGlide = () => {
    const { final, onDone, nextMode } = glide;
    Object.assign(pose, { x: final.x, y: final.y, z: final.z, yaw: final.yaw, pitch: final.pitch });
    glide = null;
    mode = nextMode ?? "focus";
    if (mode === "walk") {
      const free = resolveCollisions(pose.x, pose.z, studio.playerRadius, layout.colliders);
      Object.assign(walker, { x: free.x, z: free.z, vx: 0, vz: 0, yaw: pose.yaw });
      pose.x = free.x;
      pose.z = free.z;
      pose.y = studio.eyeHeight;
    }
    applyCamera();
    dirty = true;
    onDone?.();
  };

  const stepGlide = (dt) => {
    const g = glide;
    if (g.duration <= 0) {
      finishGlide();
      return;
    }
    g.t = Math.min(g.t + dt, g.duration);
    const u = easeInOutCubic(g.t / g.duration);
    const point = pointAlong(g.route, u * g.length);
    pose.x = point.x;
    pose.z = point.z;
    pose.y = g.from.y + (g.final.y - g.from.y) * u;
    const toward = smoothstep(0.5, 1, u);
    const travelYaw = point.yaw ?? g.final.yaw;
    const aimYaw = travelYaw + shortestAngle(travelYaw, g.final.yaw) * toward;
    const rate = 5 + 20 * toward;
    pose.yaw += shortestAngle(pose.yaw, aimYaw) * (1 - Math.exp(-rate * dt));
    const aimPitch = -0.05 + (g.final.pitch + 0.05) * toward;
    pose.pitch += (aimPitch - pose.pitch) * (1 - Math.exp(-rate * dt));
    if (g.t >= g.duration) {
      g.settle += dt;
      if (
        g.settle > 0.45 ||
        (Math.abs(shortestAngle(pose.yaw, g.final.yaw)) < 0.003 && Math.abs(pose.pitch - g.final.pitch) < 0.003)
      ) {
        finishGlide();
      }
    }
  };

  const routeTo = (x, z) =>
    findPath({ x: pose.x, z: pose.z }, { x, z }, layout) ?? [{ x: pose.x, z: pose.z }, { x, z }];

  const glideToView = (view, options) => {
    const final = poseFromView(view);
    const route = routeTo(final.x, final.z);
    startGlide(route, final, options);
  };

  /* ------------------------------------------------------------ targeting */

  const playerDistance = (entry) =>
    Math.hypot(entry.object.anchor[0] - pose.x, entry.object.anchor[2] - pose.z);

  const computeTarget = () => {
    if (mode !== "walk") return null;
    if (hoverNdc) {
      const hovered = castFrom(hoverNdc.x, hoverNdc.y, 6);
      if (hovered && playerDistance(hovered.entry) <= studio.reach + 1) return hovered.entry.object.id;
    }
    const centre = castFrom(0, 0, studio.reach + 0.8);
    if (centre) return centre.entry.object.id;
    let best = null;
    let bestScore = Infinity;
    pickables.forEach((entry) => {
      const distance = playerDistance(entry);
      if (distance > studio.reach) return;
      const yaw = yawToward(pose.x, pose.z, entry.object.anchor[0], entry.object.anchor[2]);
      const angle = Math.abs(shortestAngle(pose.yaw, yaw));
      if (angle > 0.95) return;
      if (!hasLineOfSight(pose.x, pose.z, entry.object.anchor[0], entry.object.anchor[2], layout.colliders)) return;
      const score = distance + angle * 1.6;
      if (score < bestScore) {
        bestScore = score;
        best = entry.object.id;
      }
    });
    return best;
  };

  const updateMarkers = (dt) => {
    pickables.forEach((entry) => {
      let goal = 0;
      if (mode === "walk") {
        const distance = playerDistance(entry);
        const range = HIDDEN_KINDS.has(entry.object.kind) ? 2.2 : 4.2;
        if (
          distance < range &&
          hasLineOfSight(pose.x, pose.z, entry.object.anchor[0], entry.object.anchor[2], layout.colliders)
        ) {
          goal = entry.object.id === targetId ? 1 : 0.55 * (1 - distance / range) + 0.1;
        }
      }
      entry.opacity += (goal - entry.opacity) * (motionReduced ? 1 : 1 - Math.exp(-10 * dt));
      const visible = entry.opacity > 0.01;
      entry.marker.visible = visible;
      if (visible) {
        const isTarget = entry.object.id === targetId;
        entry.marker.material.opacity = entry.opacity;
        entry.marker.material.color.set(isTarget ? 0xe7b85e : 0x89f2c2);
        const pulse = isTarget && !motionReduced ? 1 + Math.sin(elapsed * 4) * 0.08 : 1;
        entry.marker.scale.setScalar((isTarget ? 0.2 : 0.11) * pulse);
      }
    });
  };

  /* -------------------------------------------------------- instrument state */

  const state = {
    scope: { frequency: 440, shape: "sine", amplitude: 0.8, mode: "time", ratio: 1.5, output: false, phase: 0 },
    scopeDirty: true,
    plate: { frequency: chladniModeAt(480).frequency, drive: false, mode: chladniModeAt(480) },
    synth: { shape: "triangle", attack: 0.02, release: 0.5, brightness: 0.6 },
    held: [],
    synthDirty: true,
    level: 0,
    recordLevel: 0,
    recordPlaying: false,
    recordTime: 0,
    recordAt: 0,
    chord: new Set(),
    patched: false,
    lamp: false,
    controllersUp: false,
  };

  const recordArtifact = practice.channels.find((channel) => channel.artifact.kind === "recording").artifact;
  const pendantLevels = new Map([...pendants.keys()].map((id) => [id, 0.35]));

  /* --------------------------------------------------------------- frame */

  const prevPose = { x: NaN, y: NaN, z: NaN, yaw: NaN, pitch: NaN };
  const screenTimers = { monitor: 0, scope: 0, rack: 0 };
  const near = (x, z, distance) => Math.hypot(pose.x - x, pose.z - z) < distance;
  const voicedFrequencies = [...practice.channels].sort((a, b) => a.frequency - b.frequency).map((c) => c.frequency);

  const step = (dt) => {
    const ambient = !motionReduced;
    if (ambient) elapsed += dt;
    shared.uTime.value = elapsed;

    // Camera.
    if (mode === "intro") {
      const drift = ambient ? elapsed : 0;
      pose.x = introPose.x + Math.sin(drift * 0.11) * 0.08;
      pose.y = introPose.y + Math.sin(drift * 0.17) * 0.02;
      pose.z = introPose.z - Math.min(drift, 14) * 0.012;
      pose.yaw = introPose.yaw + Math.sin(drift * 0.09) * 0.035;
      pose.pitch = introPose.pitch;
    } else if (mode === "glide") {
      stepGlide(dt);
    } else if (mode === "walk") {
      walker.yaw = pose.yaw - look.dx * LOOK_SENSITIVITY;
      pose.pitch = clamp(pose.pitch - look.dy * LOOK_SENSITIVITY, -PITCH_LIMIT, PITCH_LIMIT);
      const steps = Math.max(1, Math.ceil(dt / 0.04));
      for (let index = 0; index < steps; index += 1) {
        Object.assign(walker, stepWalker(walker, input, dt / steps, layout.colliders, { radius: studio.playerRadius }));
      }
      const speed = Math.hypot(walker.vx, walker.vz);
      if (ambient) bobPhase += speed * dt * 2.2;
      pose.x = walker.x;
      pose.z = walker.z;
      pose.yaw = walker.yaw;
      pose.y = studio.eyeHeight + (ambient ? Math.sin(bobPhase * Math.PI) * 0.014 * Math.min(speed / 2.5, 1) : 0);
    }
    look.dx = 0;
    look.dy = 0;
    applyCamera();

    if (mode !== "intro") {
      const zone = zoneAt(layout.zones, pose.x, pose.z);
      if (zone && zone.id !== zoneId) {
        zoneId = zone.id;
        emit("onZone", zone);
      }
    }

    const nextTarget = computeTarget();
    if (nextTarget !== targetId) {
      targetId = nextTarget;
      emit("onTarget", targetId ? pickById.get(targetId).object : null);
    }
    updateMarkers(dt);

    const blend = (rate) => (motionReduced ? 1 : 1 - Math.exp(-rate * dt));

    // Pendants: brighter in the room you are in, brightest in a sounding chord.
    pendants.forEach((pendant, id) => {
      let goal = 0.32;
      if (id === zoneId) goal += 0.3;
      if (state.chord.has(id)) goal += 0.7;
      if (id === "music") goal += Math.max(state.level, state.recordLevel) * 0.45;
      const level = pendantLevels.get(id) + (goal - pendantLevels.get(id)) * blend(4);
      pendantLevels.set(id, level);
      const flicker = ambient ? 1 + Math.sin(elapsed * 7.3 + id.length) * 0.012 : 1;
      pendantLights.get(id).intensity = level * 15 * flicker;
      pendant.material.color.setRGB(1, 0.89, 0.69).multiplyScalar(0.55 + level * 0.9);
      pendant.glow.material.opacity = 0.12 + level * 0.45;
    });

    // Chimes swing on a damped spring.
    dyn.chimes.forEach((chime) => {
      if (Math.abs(chime.swing) < 1e-4 && Math.abs(chime.velocity) < 1e-4) return;
      const acceleration = -9 * chime.swing - 1.1 * chime.velocity;
      chime.velocity += acceleration * dt;
      chime.swing += chime.velocity * dt;
      chime.group.rotation.z = motionReduced ? 0 : chime.swing;
    });

    // The tuning fork shimmers while it rings.
    if (dyn.fork.energy > 0.001) {
      dyn.fork.energy *= Math.exp(-dt * 0.7);
      dyn.fork.prongs.forEach((prong, index) => {
        prong.position.z = (index ? 1 : -1) * (0.012 + (ambient ? Math.sin(elapsed * 90) : 0) * 0.0018 * dyn.fork.energy);
      });
    }

    // Reading lamp, and the thread it reveals.
    const lamp = dyn.lamp;
    lamp.level += (lamp.target - lamp.level) * blend(5);
    lamp.light.intensity = lamp.level * 3.4;
    lamp.glow.material.opacity = lamp.level * 0.55;
    lamp.shade.emissiveIntensity = lamp.level * 1.2;
    dyn.provenance.threadMaterial.color.setRGB(0.23 + 0.68 * lamp.level, 0.17 + 0.55 * lamp.level, 0.09 + 0.28 * lamp.level);
    dyn.provenance.caption.visible = lamp.level > 0.5;

    // The person's controller, lifted.
    const controllers = dyn.controllers;
    controllers.lift += (controllers.target - controllers.lift) * blend(6);
    controllers.groups[0].position.y = 0.762 + controllers.lift * 0.14;
    controllers.groups[0].rotation.x = -controllers.lift * 0.5;

    // What the room reacts to is computed from what is being played, never
    // from the audio output: held keys through the synth's own envelope, and
    // the recording through its stored loudness curve.
    state.level = followLevel(state.level, state.held.length, dt, state.synth);
    if (state.recordPlaying) {
      const time = state.recordTime + (performance.now() - state.recordAt) / 1000;
      state.recordLevel = envelopeAt(recordArtifact.peaks, time, recordArtifact.duration);
    } else {
      state.recordLevel *= Math.exp(-dt * 4);
    }

    // Synth keys, knobs, speaker cones, meters.
    dyn.keys.forEach((entry) => {
      entry.target = state.held.includes(entry.key.midi) ? 1 : 0;
      entry.press += (entry.target - entry.press) * blend(28);
      entry.pivot.rotation.x = entry.press * 0.065;
    });
    const reactive = Math.max(state.level, state.recordLevel);
    dyn.cones.forEach((cone, index) => {
      const pulse = ambient ? Math.abs(Math.sin(elapsed * (29 + index * 3))) : 0.5;
      cone.scale.setScalar(1 + reactive * 0.07 * pulse);
    });
    dyn.vu.forEach((needle, index) => {
      const jitter = ambient ? Math.sin(elapsed * (13 + index * 4)) * 0.06 : 0;
      const goal = -0.75 + clamp(reactive + jitter * reactive, 0, 1) * 1.5;
      needle.rotation.x = needle.rotation.x + (goal - needle.rotation.x) * blend(12);
    });

    // The record turns at 33⅓ while it plays, and the arm swings in.
    const record = dyn.record;
    record.arm.rotation.y += ((state.recordPlaying ? 0.18 : 0.55) - record.arm.rotation.y) * blend(3);
    if (state.recordPlaying && ambient) record.group.rotation.y -= dt * ((33.333 / 60) * Math.PI * 2);

    // The R.A.I.N. box blinks its own slow heartbeat.
    dyn.rainLed.material.color.setRGB(0.91, 0.72, 0.37).multiplyScalar(ambient ? 0.35 + 0.65 * (Math.sin(elapsed * 1.6) > 0.6 ? 1 : 0.2) : 1);

    // Archive rings and the archive itself, only when it can be seen.
    if (near(0, -6.4, 15)) {
      if (ambient) {
        dyn.archiveRings.ringA.rotation.z += dt * 0.08;
        dyn.archiveRings.ringB.rotation.z -= dt * 0.05;
      }
      archive.update(ambient ? dt : 0, camera);
    }

    // Screens.
    screenTimers.monitor += dt;
    if (near(0, -0.4, 10) && (screenTimers.monitor > 1 / 12 || dirty)) {
      screenTimers.monitor = 0;
      drawMonitor(dyn.monitor.screen, {
        frequencies: voicedFrequencies,
        time: elapsed * 1000,
        fonts,
        label: zoneId ? (layout.zones.find((zone) => zone.id === zoneId)?.name ?? "") : "",
      });
    }
    screenTimers.scope += dt;
    if (state.scope.mode === "xy" && ambient) {
      state.scope.phase += dt * 0.04;
      if (near(-9.5, 2.4, 8) && screenTimers.scope > 1 / 20) state.scopeDirty = true;
    }
    if (state.scopeDirty) {
      screenTimers.scope = 0;
      drawScope(dyn.scope.screen, state.scope, fonts);
      state.scopeDirty = false;
    }
    dyn.generatorKnob.rotation.x =
      -2.3 + (Math.log(state.scope.frequency / 40) / Math.log(2000 / 40)) * 4.6;
    screenTimers.rack += dt;
    const rackActive = state.held.length > 0 || state.recordLevel > 0.01 || state.level > 0.01;
    if (near(3, 6.3, 8) && (rackActive || state.rackIdleDirty) && screenTimers.rack > 1 / 20) {
      screenTimers.rack = 0;
      drawRackScope(
        dyn.rackScope.screen,
        {
          frequencies: state.held.map((midi) => instruments.midiToFrequency(midi)),
          shape: state.synth.shape,
          level: state.level,
          recordLevel: state.recordLevel,
          patched: state.patched,
        },
        fonts,
        elapsed * 1000
      );
      state.rackIdleDirty = rackActive;
    }
    if (state.synthDirty) {
      state.synthDirty = false;
      const unit = (value, [min, max]) => Math.log(value / min) / Math.log(max / min);
      drawSynthDisplay(dyn.synthDisplay.screen, {
        shape: state.synth.shape,
        attackUnit: unit(state.synth.attack, SYNTH_LIMITS.attack),
        releaseUnit: unit(state.synth.release, SYNTH_LIMITS.release),
        brightness: state.synth.brightness,
        held: state.held.map((midi) => instruments.midiToName(midi)),
      }, fonts);
      dyn.synthKnobs.forEach((knob) => {
        const value =
          knob.name === "shape"
            ? WAVEFORMS.indexOf(state.synth.shape) / (WAVEFORMS.length - 1)
            : knob.name === "brightness"
              ? state.synth.brightness
              : unit(state.synth[knob.name], SYNTH_LIMITS[knob.name]);
        knob.group.rotation.y = 2.35 - value * 4.7;
      });
    }

    // The resonance plate: grains walk toward the nodal lines while driven.
    const plate = dyn.plate;
    const driving = state.plate.drive || state.patchedDrive;
    const plateMode = state.patchedDrive ? state.patchedMode : state.plate.mode;
    if (driving && near(-6.6, 4.6, 10) && plateMode && plateMode.resonance > 0.02) {
      stepGrains(plate.grains, plateMode, { energy: 1 });
      state.plateDirty = true;
    }
    if (state.plateDirty) {
      state.plateDirty = false;
      const count = Math.min(tier.plateParticles, plate.capacity);
      const mode = plateMode;
      const bounce = driving && ambient && mode ? 0.004 * mode.resonance : 0;
      for (let index = 0; index < count; index += 1) {
        const gx = plate.grains[index * 2];
        const gy = plate.grains[index * 2 + 1];
        plate.positions[index * 3] = gx * plate.half;
        plate.positions[index * 3 + 1] = bounce ? Math.abs(chladni(mode.m, mode.n, gx, gy)) * bounce * Math.random() : 0;
        plate.positions[index * 3 + 2] = gy * plate.half;
      }
      plate.geometry.attributes.position.needsUpdate = true;
    }

    const moved =
      pose.x !== prevPose.x || pose.y !== prevPose.y || pose.z !== prevPose.z ||
      pose.yaw !== prevPose.yaw || pose.pitch !== prevPose.pitch;
    Object.assign(prevPose, pose);
    return moved;
  };
  state.plateDirty = true;
  state.rackIdleDirty = true;

  /* ----------------------------------------------------------------- loop */

  let webglAvailable = true;
  let visible = !document.hidden;
  let covered = false;
  let frameId = 0;
  let lastTime = 0;
  let accumulated = 0;
  const governor = createFrameGovernor();

  const renderMode = () =>
    resolveStudioMode({ webglAvailable, visible, covered, reducedMotion: motionReduced });

  const render = () => {
    try {
      renderer.render(scene, camera);
    } catch (error) {
      fail("render", error);
    }
  };

  const loop = (now) => {
    frameId = 0;
    const current = renderMode();
    if (current === "paused" || current === "fallback") {
      lastTime = 0;
      return;
    }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 1 / 60;
    lastTime = now;
    accumulated += dt;
    if (tier.frameInterval && accumulated < tier.frameInterval - 0.002) {
      frameId = window.requestAnimationFrame(loop);
      return;
    }
    // A slow machine still walks and glides in real time: up to a quarter
    // second per frame is honoured, and walking sub-steps it below.
    const delta = Math.min(accumulated, 0.25);
    accumulated = 0;

    const moved = step(delta);
    const animating =
      mode === "glide" || input.forward || input.strafe || input.turn ||
      Math.hypot(walker.vx, walker.vz) > 0.001 ||
      state.level > 0.002 || state.recordPlaying || state.plate.drive || state.patchedDrive;
    if (current === "continuous" || moved || dirty || animating) {
      render();
      dirty = false;
      if (current === "continuous" && autoQuality) {
        const verdict = governor.sample(delta * 1000);
        if (verdict === "down") {
          const next = lowerTier(tier.id);
          if (next) {
            tier = TIERS[next];
            applyTier();
            emit("onTierChange", next, "auto");
          }
        }
      }
    }
    frameId = window.requestAnimationFrame(loop);
  };

  const wake = () => {
    if (!frameId && webglAvailable) frameId = window.requestAnimationFrame(loop);
  };

  function fail(reason, error) {
    if (!webglAvailable) return;
    webglAvailable = false;
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    if (error) console.warn(`Studio ${reason} failed.`, error);
    emit("onFailure", reason);
  }

  const onContextLost = (event) => {
    event.preventDefault();
    fail("context");
  };
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);

  const onVisibility = () => {
    visible = !document.hidden;
    lastTime = 0;
    if (visible) {
      dirty = true;
      wake();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Space taken by an open panel. The camera's optical centre moves into the
  // part of the room that is still visible, so the object in use stays in view.
  const inset = { right: 0, bottom: 0 };

  function resize() {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    camera.aspect = width / height;
    camera.fov = width < height ? 72 : isMobile ? 66 : 62;
    const right = Math.min(inset.right, width * 0.6);
    const bottom = Math.min(inset.bottom, height * 0.7);
    if (right || bottom) camera.setViewOffset(width + right, height + bottom, right, bottom, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    dirty = true;
    wake();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  configureShadows();
  applyTier();
  resize();

  // Compile every shader before the first frame the visitor sees, so the
  // first turn of the head does not stutter.
  try {
    renderer.compile(scene, camera);
  } catch {
    // compile is an optimisation; rendering will compile lazily.
  }
  wake();

  /* ------------------------------------------------------------------ API */

  const objectById = (id) => pickById.get(id)?.object ?? null;

  const api = {
    get mode() {
      return mode;
    },
    getPose: () => ({ ...pose, zone: zoneId }),
    getTarget: () => (targetId ? objectById(targetId) : null),

    setInput(next) {
      Object.assign(input, next);
      if (next.forward || next.strafe || next.turn) wake();
    },
    look(dx, dy) {
      if (mode !== "walk") return;
      look.dx += dx;
      look.dy += dy;
      wake();
    },
    hover(x, y) {
      hoverNdc = x === null ? null : { x, y };
      wake();
    },
    // What is under a point on the canvas, if anything a visitor could use.
    pick(x, y) {
      const hit = castFrom(x, y, 14);
      return hit ? hit.entry.object : null;
    },

    enter() {
      return new Promise((resolve) => {
        const start = { x: studio.start.x, y: studio.eyeHeight, z: studio.start.z, yaw: studio.start.yaw, pitch: -0.04 };
        startGlide(routeTo(start.x, start.z), start, { nextMode: "walk", onDone: resolve });
        wake();
      });
    },

    focus(id) {
      const object = objectById(id);
      if (!object) return Promise.resolve(false);
      return new Promise((resolve) => {
        focusedId = id;
        const final = poseFromView(object.view);
        const route = routeTo(object.stand[0], object.stand[1]);
        route.push({ x: final.x, z: final.z });
        startGlide(route, final, {
          nextMode: "focus",
          onDone: () => {
            emit("onArrive", id);
            resolve(true);
          },
        });
        wake();
      });
    },

    // Back on your feet in front of the thing you were using, facing it.
    release() {
      return new Promise((resolve) => {
        const object = focusedId ? objectById(focusedId) : null;
        focusedId = null;
        const [sx, sz] = object ? object.stand : [pose.x, pose.z];
        const free = resolveCollisions(sx, sz, studio.playerRadius, layout.colliders);
        const yaw = object ? yawToward(free.x, free.z, object.anchor[0], object.anchor[2]) : pose.yaw;
        const pitch = object
          ? clamp(Math.atan2(object.anchor[1] - studio.eyeHeight, Math.hypot(object.anchor[0] - free.x, object.anchor[2] - free.z)) * 0.6, -0.5, 0.3)
          : 0;
        startGlide(
          [{ x: pose.x, z: pose.z }, { x: free.x, z: free.z }],
          { x: free.x, y: studio.eyeHeight, z: free.z, yaw, pitch },
          { nextMode: "walk", onDone: resolve }
        );
        wake();
      });
    },

    goto(zone) {
      const target = layout.zones.find((entry) => entry.id === zone);
      if (!target) return Promise.resolve(false);
      return new Promise((resolve) => {
        focusedId = null;
        glideToView(target.view, { nextMode: "walk", onDone: () => resolve(true) });
        wake();
      });
    },

    view(view) {
      return new Promise((resolve) => {
        glideToView(view, { nextMode: "focus", onDone: () => resolve(true) });
        wake();
      });
    },

    // Leave whatever mode the camera is in and stand where it is.
    stand() {
      glide = null;
      focusedId = null;
      const free = resolveCollisions(pose.x, pose.z, studio.playerRadius, layout.colliders);
      Object.assign(walker, { x: free.x, z: free.z, vx: 0, vz: 0, yaw: pose.yaw });
      pose.y = studio.eyeHeight;
      mode = "walk";
      dirty = true;
      wake();
    },

    setInset({ right = 0, bottom = 0 } = {}) {
      if (inset.right === right && inset.bottom === bottom) return;
      inset.right = right;
      inset.bottom = bottom;
      resize();
    },

    setCovered(value) {
      covered = Boolean(value);
      lastTime = 0;
      dirty = true;
      wake();
    },
    setReducedMotion(value) {
      motionReduced = Boolean(value);
      dirty = true;
      wake();
    },
    getTier: () => tier.id,
    setTier(id, { manual = true } = {}) {
      if (!TIERS[id]) return;
      if (manual) autoQuality = false;
      tier = TIERS[id];
      governor.reset();
      applyTier();
    },
    setAutoQuality(value) {
      autoQuality = Boolean(value);
      governor.reset();
    },

    /* instruments */
    setScope(next) {
      Object.assign(state.scope, next);
      state.scopeDirty = true;
      dirty = true;
      wake();
    },
    setPlate({ frequency, drive }) {
      if (Number.isFinite(frequency)) {
        state.plate.frequency = frequency;
        state.plate.mode = chladniModeAt(frequency);
      }
      if (drive !== undefined) state.plate.drive = Boolean(drive);
      state.plateDirty = true;
      dirty = true;
      wake();
    },
    scatterPlate() {
      const grains = dyn.plate.grains;
      for (let index = 0; index < grains.length; index += 1) grains[index] = Math.random() * 2 - 1;
      state.plateDirty = true;
      dirty = true;
      wake();
    },
    setSynth({ params, held }) {
      if (params) {
        Object.assign(state.synth, params);
        state.synthDirty = true;
      }
      if (held) {
        state.held = held;
        state.synthDirty = true;
        // Patched, the synthesizer drives the plate: its lowest note, carried
        // up by octaves into the plate's range.
        if (state.patched && held.length) {
          let frequency = instruments.midiToFrequency(Math.min(...held));
          while (frequency < instruments.CHLADNI_RANGE[0]) frequency *= 2;
          state.patchedMode = chladniModeAt(frequency);
          state.patchedDrive = true;
        } else {
          state.patchedDrive = false;
        }
        state.plateDirty = true;
      }
      dirty = true;
      wake();
    },
    setRecord({ playing, time }) {
      if (playing !== undefined) state.recordPlaying = Boolean(playing);
      if (Number.isFinite(time)) {
        state.recordTime = time;
        state.recordAt = performance.now();
      }
      dirty = true;
      wake();
    },
    setChord(channelIds) {
      state.chord = new Set(channelIds || []);
      dirty = true;
      wake();
    },
    strikeChimes(channelIds) {
      const ids = new Set(channelIds);
      dyn.chimes.forEach((chime, index) => {
        if (ids.has(chime.channel)) chime.velocity += 0.9 + index * 0.05;
      });
      dirty = true;
      wake();
    },
    strikeFork() {
      dyn.fork.energy = 1;
      dirty = true;
      wake();
    },
    setLamp(on) {
      state.lamp = Boolean(on);
      dyn.lamp.target = on ? 1 : 0;
      dirty = true;
      wake();
    },
    setPatched(on) {
      state.patched = Boolean(on);
      dyn.patch.loose.visible = !on;
      dyn.patch.plugged.visible = Boolean(on);
      state.rackIdleDirty = true;
      dirty = true;
      wake();
    },
    setControllers(up) {
      dyn.controllers.target = up ? 1 : 0;
      dirty = true;
      wake();
    },
    setArchiveModel(index) {
      const model = archiveModels[index];
      if (!model) return;
      archive.setIndexModel(model);
      archive.ingestPulse();
      dirty = true;
      wake();
    },
    archivePulse() {
      archive.ingestPulse();
      dirty = true;
      wake();
    },

    // Where an object's screen is on the page, for the desktop to grow from.
    getScreenRect(id) {
      if (id !== "computer") return null;
      const bounds = renderer.domElement.getBoundingClientRect();
      const corners = [
        [-0.48, 1.55, -0.486],
        [0.48, 1.55, -0.486],
        [-0.48, 0.99, -0.486],
        [0.48, 0.99, -0.486],
      ].map(([x, y, z]) => new Vector3(x, y, z).project(camera));
      const xs = corners.map((corner) => bounds.left + ((corner.x + 1) / 2) * bounds.width);
      const ys = corners.map((corner) => bounds.top + ((1 - corner.y) / 2) * bounds.height);
      return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    },

    // Redraw every printed label once the site's own typefaces have loaded.
    refreshLabels(nextFonts) {
      Object.assign(fonts, nextFonts);
      ctx.labels.forEach((texture) => texture.userData?.redraw?.(fonts));
      state.scopeDirty = true;
      state.synthDirty = true;
      state.rackIdleDirty = true;
      dirty = true;
      wake();
    },

    // For browser checks: the scene's internals, read-only by convention.
    debug: () => ({ scene, camera, renderer, sun, hemi, pendantLights, state, tier: tier.id }),

    renderNow() {
      dirty = true;
      wake();
    },

    dispose() {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      webglAvailable = false;
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      archive.dispose();
      disposeTree(scene);
      glowTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      images.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    },
  };

  return api;
}

export default createStudio;

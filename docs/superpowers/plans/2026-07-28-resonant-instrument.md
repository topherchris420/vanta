# Resonant Instrument Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Rebuild the Vers3Dynamics home page as the approved five-channel Resonant Instrument while preserving every real project link, native scrolling, silent-by-default audio, reduced-motion behavior, and WebGL fallbacks.

**Architecture:** Keep project content in pages/index.js and add a small pure signal module plus a browser-only audio hook. The page owns active and preview channel state, presentational channel components render that state, and the existing vanta:resonance event remains the boundary to the WebGL background. Existing Three.js scenes are hardened rather than replaced.

**Tech Stack:** Next.js Pages Router, React, CSS Modules, Three.js, Web Audio API, next/font, Node built-in test runner.

## Global Constraints

- Keep Next.js Pages Router, React, CSS Modules, Three.js, and Vanta; do not migrate frameworks.
- Add no package dependency.
- Keep projectSections in pages/index.js as the canonical project-content source.
- Preserve every existing project evidence URL and the intentional https://mitpress.vercel.app canonical domain.
- Sound must remain silent until an explicit user gesture in each page session.
- Native scrolling only; no scroll hijacking.
- prefers-reduced-motion must stop continuous WebGL and custom-cursor render loops, not only time updates.
- Desktop WebGL device pixel ratio cap: 2. Mobile cap: 1.5.
- Use Syne for display text, Space Grotesk for body text, and a system monospace stack for instrument data.
- Use signal black #060b09, raised surface #0b1210, primary text #edf9f4, secondary text #a5b6ae, signal mint #8cf0c6, and calibration gold #e4b65c.
- No fabricated claims, testimonials, legal routes, or portfolio evidence.
- Every commit must follow the workspace Lore Commit Protocol.

## Scope check

This is one integrated home-page experience rather than independent subsystems: channel selection drives page styling, WebGL response, and optional sound together. Splitting audio, visuals, and layout into separate product plans would create intermediate states that cannot satisfy the approved experience. The tasks below still keep each code unit independently reviewable.

## File structure

**Create**

- lib/signalExperience.js - pure channel selection, preview restoration, render-mode policy, mute-preference parsing, validation, and resonance detail.
- hooks/useSignalAudio.js - Web Audio lifecycle, explicit activation, gain ramps, persistence, and cleanup.
- components/FrequencyRail.js - accessible desktop/mobile channel navigation.
- components/ProjectChannel.js - semantic shared project-channel structure.
- tests/signalExperience.test.js - pure signal behavior.
- tests/signalComponents.test.js - pure navigation and channel view-model behavior consumed by the new React components.
- tests/homeSignalLayout.test.js - rendered-page integration coverage through a real local Next server.
- tests/renderLoopContracts.test.js - pure reduced-motion, visibility, pixel-ratio, and mobile runtime-policy behavior.

**Modify**

- pages/index.js:22-425 - enrich project signal data, replace cards with channels, own active and preview state, wire sound, and update metadata.
- components/DisplayPedestal.js:56-615 - remove its private audio controller, emit resonance intent, add visibility pausing and renderer fallback.
- components/VantaEffect.js:26-256 - use the approved palette and explicit render-loop state machine.
- components/CustomCursor.js:7-108 - stop its continuous loop for reduced motion and hidden documents.
- components/Navbar.js:4-75 - update anchor destinations for the new page structure and make 404 links return home.
- pages/_app.js:1-35 - swap Inter for Syne and make Space Grotesk the body font.
- pages/_document.js:1-13 - update the browser theme color.
- styles/globals.css:1-91 - install approved tokens and global accessibility behavior.
- styles/Home.module.css:1-1330 - replace the card-era composition with the approved instrument layout.
- pages/404.js and styles/NotFound.module.css - align the existing 404 with the new tokens and typography.
- PRODUCT.md - document the shipped interaction and performance constraints.

**Delete after their final consumers are removed**

- components/Marquee.js
- components/SpotlightCard.js
- components/ScrollProgress.js

---

### Task 1: Signal selection and explicit audio lifecycle

**Files:**

- Create: lib/signalExperience.js
- Create: hooks/useSignalAudio.js
- Create: tests/signalExperience.test.js

**Interfaces:**

- Consumes: channel objects shaped as { id, number, color, frequency, primaryHref, secondaryHref }.
- Produces: SOUND_PREF_KEY, parseMutedPreference(value), selectActiveChannel(entries, fallbackId), resolvePreviewChannel(state), resolveRenderMode(state), validateChannels(channels), and createResonanceDetail(channel).
- Produces: useSignalAudio() returning { soundEnabled, soundAvailable, enableSound, toggleSound, playFrequency, stopFrequency }.

- [ ] **Step 1: Write the failing pure-behavior tests**

Create tests/signalExperience.test.js:

~~~js
const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const makeChannel = (id, number, frequency) => ({
  id,
  number,
  color: "#8cf0c6",
  frequency,
  primaryHref: "https://example.com/" + id,
  secondaryHref: "https://example.com/" + id + "/secondary",
});
const channels = [
  makeChannel("books", "01", 261.63),
  makeChannel("apps", "02", 329.63),
  makeChannel("art", "03", 392),
  makeChannel("frequency", "04", 523.25),
  makeChannel("music", "05", 196),
];

test("mute preference defaults to silent", () => {
  assert.equal(signal.SOUND_PREF_KEY, "vanta-signal-muted");
  assert.equal(signal.parseMutedPreference("1"), true);
  assert.equal(signal.parseMutedPreference("0"), false);
  assert.equal(signal.parseMutedPreference(null), false);
});

test("active channel uses strongest visibility then nearest reading line", () => {
  assert.equal(
    signal.selectActiveChannel([
      { id: "books", isIntersecting: true, intersectionRatio: 0.32, top: 90 },
      { id: "apps", isIntersecting: true, intersectionRatio: 0.61, top: 260 },
    ], "books"),
    "apps"
  );
  assert.equal(
    signal.selectActiveChannel([
      { id: "books", isIntersecting: true, intersectionRatio: 0.5, top: -210 },
      { id: "apps", isIntersecting: true, intersectionRatio: 0.5, top: 48 },
    ], "books"),
    "apps"
  );
  assert.equal(signal.selectActiveChannel([], "books"), "books");
});

test("preview state overrides and restores scroll state", () => {
  assert.equal(signal.resolvePreviewChannel({
    scrollChannel: "books",
    previewChannel: "art",
  }), "art");
  assert.equal(signal.resolvePreviewChannel({
    scrollChannel: "books",
    previewChannel: null,
  }), "books");
});

test("render policy covers every runtime mode", () => {
  const mode = (overrides) => signal.resolveRenderMode({
    webglAvailable: true,
    reducedMotion: false,
    isMobile: false,
    visible: true,
    ...overrides,
  });
  assert.equal(mode({ webglAvailable: false }), "css-fallback");
  assert.equal(mode({ visible: false }), "paused");
  assert.equal(mode({ reducedMotion: true }), "static");
  assert.equal(mode({ isMobile: true }), "static");
  assert.equal(mode({}), "continuous");
});

test("channel validation rejects incomplete or duplicate data", () => {
  assert.equal(signal.validateChannels(channels), true);
  assert.throws(() => signal.validateChannels(channels.slice(0, 4)), /five/);
  assert.throws(
    () => signal.validateChannels([...channels.slice(0, 4), channels[0]]),
    /unique/
  );
});

test("resonance detail exposes the stable event contract", () => {
  assert.deepEqual(signal.createResonanceDetail(channels[4]), {
    channelId: "music",
    color: "#8cf0c6",
    frequency: 196,
    intensity: 1,
  });
});
~~~

- [ ] **Step 2: Run the targeted test and verify the missing-module failure**

Run: npm test -- tests/signalExperience.test.js

Expected: FAIL with MODULE_NOT_FOUND for ../lib/signalExperience.

- [ ] **Step 3: Implement the pure signal contract**

Create lib/signalExperience.js:

~~~js
const SOUND_PREF_KEY = "vanta-signal-muted";
const parseMutedPreference = (value) => value === "1";

const selectActiveChannel = (entries, fallbackId) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort(
      (left, right) =>
        right.intersectionRatio - left.intersectionRatio ||
        Math.abs(left.top) - Math.abs(right.top)
    );
  return visible[0]?.id ?? fallbackId;
};

const resolvePreviewChannel = ({ scrollChannel, previewChannel }) =>
  previewChannel ?? scrollChannel;

const resolveRenderMode = ({
  webglAvailable,
  reducedMotion,
  isMobile,
  visible,
}) => {
  if (!webglAvailable) return "css-fallback";
  if (!visible) return "paused";
  if (reducedMotion || isMobile) return "static";
  return "continuous";
};

const validateChannels = (channels) => {
  if (!Array.isArray(channels) || channels.length !== 5) {
    throw new Error("Signal experience requires exactly five channels.");
  }
  const ids = new Set();
  channels.forEach((channel, index) => {
    if (!channel.id || ids.has(channel.id)) {
      throw new Error("Each signal requires a unique channel id.");
    }
    ids.add(channel.id);
    if (channel.number !== String(index + 1).padStart(2, "0")) {
      throw new Error("Signal channel numbers must run from 01 through 05.");
    }
    if (!Number.isFinite(channel.frequency) || channel.frequency <= 0) {
      throw new Error("Every signal requires a positive frequency.");
    }
    [channel.primaryHref, channel.secondaryHref].forEach((href) => {
      if (!URL.canParse(href)) {
        throw new Error("Every signal requires two valid evidence URLs.");
      }
    });
  });
  return true;
};

const createResonanceDetail = (channel) => ({
  channelId: channel.id,
  color: channel.color,
  frequency: channel.frequency,
  intensity: 1,
});

module.exports = {
  SOUND_PREF_KEY,
  createResonanceDetail,
  parseMutedPreference,
  resolvePreviewChannel,
  resolveRenderMode,
  selectActiveChannel,
  validateChannels,
};
~~~

- [ ] **Step 4: Run the targeted test and verify all six cases pass**

Run: npm test -- tests/signalExperience.test.js

Expected: 6 passing tests and zero failures.

- [ ] **Step 5: Add the browser-only audio hook**

Create hooks/useSignalAudio.js. The context is created only inside enableSound, which is called from a button gesture:

~~~js
import { useCallback, useEffect, useRef, useState } from "react";
import signalExperience from "../lib/signalExperience";

const { SOUND_PREF_KEY } = signalExperience;

export default function useSignalAudio() {
  const contextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(true);

  const getContextFromGesture = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setSoundAvailable(false);
      return null;
    }
    contextRef.current ??= new AudioContext();
    return contextRef.current;
  }, []);

  const stopFrequency = useCallback(() => {
    const context = contextRef.current;
    const oscillator = oscillatorRef.current;
    const gain = gainRef.current;
    if (!context || !oscillator || !gain) return;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.12);
    oscillator.stop(context.currentTime + 0.14);
    oscillatorRef.current = null;
    gainRef.current = null;
  }, []);

  const playFrequency = useCallback(
    (frequency) => {
      const context = contextRef.current;
      if (!soundEnabled || !context || !Number.isFinite(frequency)) return;
      stopFrequency();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, context.currentTime + 0.08);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillatorRef.current = oscillator;
      gainRef.current = gain;
    },
    [soundEnabled, stopFrequency]
  );

  const persistMuted = useCallback((muted) => {
    try {
      window.localStorage.setItem(SOUND_PREF_KEY, muted ? "1" : "0");
    } catch {
      // Storage is optional; current-session state remains authoritative.
    }
  }, []);

  const enableSound = useCallback(async () => {
    const context = getContextFromGesture();
    if (!context) return false;
    try {
      await context.resume();
      setSoundEnabled(true);
      persistMuted(false);
      return true;
    } catch {
      setSoundAvailable(false);
      setSoundEnabled(false);
      return false;
    }
  }, [getContextFromGesture, persistMuted]);

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      stopFrequency();
      setSoundEnabled(false);
      persistMuted(true);
      return;
    }
    await enableSound();
  }, [enableSound, persistMuted, soundEnabled, stopFrequency]);

  useEffect(
    () => () => {
      stopFrequency();
      contextRef.current?.close();
      contextRef.current = null;
    },
    [stopFrequency]
  );

  return {
    soundEnabled,
    soundAvailable,
    enableSound,
    toggleSound,
    playFrequency,
    stopFrequency,
  };
}
~~~

- [ ] **Step 6: Run the full baseline suite**

Run: npm test

Expected: the new signal tests and existing pedestal-model test pass.

- [ ] **Step 7: Commit the signal foundation**

Stage only the two runtime files and tests/signalExperience.test.js. Use:

~~~text
Require an intentional gesture before the portfolio can make sound

The controller keeps channel selection deterministic while one audio hook
owns oscillator cleanup and the silent session default.

Constraint: Web Audio contexts may only resume from a user gesture
Confidence: high
Scope-risk: narrow
Tested: npm test
Not-tested: Browser audio-device behavior
~~~

---

### Task 2: Accessible frequency rail and project channels

**Files:**

- Create: components/FrequencyRail.js
- Create: components/ProjectChannel.js
- Create: tests/signalComponents.test.js

**Interfaces:**

- Consumes: channels, activeId, onPreview(id), and onPreviewEnd().
- Produces: anchor navigation to #signal-{id} and semantic channel sections exposing both evidence links.

**User-approved behavior-level replacement (2026-07-28):** The source-regex contract in Steps 1-2 is superseded and must not be created or run. Instead, modify `lib/signalExperience.js` and test the real production decisions through exported pure functions:

- `createFrequencyRailItems(channels, activeId)` returns the hero entry followed by five channel entries with stable `href`, `number`, `label`, and `current` values.
- `createProjectChannelView(project, index, active)` returns the section id, heading id, ordering direction, active state, frequency label, and both real evidence-link descriptors.
- `tests/signalComponents.test.js` requires the production signal module, passes literal channel fixtures, and asserts the returned behavior, ordering, active-state changes, and evidence destinations without reading component source.
- `FrequencyRail` and `ProjectChannel` consume these helpers, so the tests cover decisions used by the shipped components. Pointer/focus event wiring is verified against the rendered application during Task 6 browser QA.

Run the new test before implementation and confirm it fails because the helpers do not exist. The fenced source-regex example below is retained only as historical plan context and is not a requirement.

- [ ] **Step 1 (superseded): Do not write semantic source-regex contracts**

Create tests/signalComponents.test.js:

~~~js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", "components", file), "utf8");

test("frequency rail exposes anchors and current-channel state", () => {
  const source = read("FrequencyRail.js");
  assert.match(source, /aria-label="Signal channels"/);
  assert.match(source, /aria-current=/);
  assert.match(source, /"#signal-" \+ channel\.id/);
  assert.match(source, /onFocus=/);
  assert.match(source, /onBlur=/);
});

test("project channel exposes observer state and evidence links", () => {
  const source = read("ProjectChannel.js");
  assert.match(source, /data-signal-channel/);
  assert.match(source, /project\.primaryHref/);
  assert.match(source, /project\.secondaryHref/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /onFocusCapture=/);
  assert.match(source, /onBlurCapture=/);
});
~~~

- [ ] **Step 2 (superseded): Do not test for missing component files**

Run: npm test -- tests/signalComponents.test.js

Expected: FAIL with ENOENT for FrequencyRail.js.

- [ ] **Step 3: Implement FrequencyRail**

Create components/FrequencyRail.js:

~~~jsx
import styles from "../styles/Home.module.css";

export default function FrequencyRail({
  channels,
  activeId,
  onPreview,
  onPreviewEnd,
}) {
  return (
    <nav className={styles.frequencyRail} aria-label="Signal channels">
      <ol className={styles.frequencyRailList}>
        <li className={styles.frequencyRailItem}>
          <a
            href="#top"
            className={styles.frequencyRailLink}
            aria-current={activeId === "hero" ? "location" : undefined}
          >
            <span>00</span>
            <span className={styles.frequencyRailLabel}>Signal</span>
          </a>
        </li>
        {channels.map((channel) => (
          <li key={channel.id} className={styles.frequencyRailItem}>
            <a
              href={"#signal-" + channel.id}
              className={styles.frequencyRailLink}
              aria-current={activeId === channel.id ? "location" : undefined}
              onMouseEnter={() => onPreview(channel.id)}
              onMouseLeave={onPreviewEnd}
              onFocus={() => onPreview(channel.id)}
              onBlur={onPreviewEnd}
            >
              <span>{channel.number}</span>
              <span className={styles.frequencyRailLabel}>{channel.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
~~~

- [ ] **Step 4: Implement ProjectChannel**

Create components/ProjectChannel.js:

~~~jsx
import Reveal from "./Reveal";
import styles from "../styles/Home.module.css";

export default function ProjectChannel({
  project,
  index,
  active,
  onPreview,
  onPreviewEnd,
}) {
  const preview = () => onPreview(project.id);
  const classes = [
    styles.projectChannel,
    index % 2 ? styles.projectChannelReverse : "",
    active ? styles.projectChannelActive : "",
  ].filter(Boolean).join(" ");

  return (
    <Reveal
      as="section"
      id={"signal-" + project.id}
      className={classes}
      aria-labelledby={"signal-title-" + project.id}
      data-signal-channel={project.id}
      onMouseEnter={preview}
      onMouseLeave={onPreviewEnd}
      onFocusCapture={preview}
      onBlurCapture={onPreviewEnd}
    >
      <div className={styles.channelMeta}>
        <span>{project.number} / {project.note}</span>
        <span>{project.frequency.toFixed(2)} Hz</span>
      </div>
      <div className={styles.channelCopy}>
        <h2 id={"signal-title-" + project.id}>{project.title}</h2>
        <p>{project.description}</p>
        <div className={styles.channelLinks}>
          <a href={project.primaryHref} target="_blank" rel="noopener noreferrer">
            {project.primaryLabel}<span aria-hidden="true">!�</span>
          </a>
          <a href={project.secondaryHref} target="_blank" rel="noopener noreferrer">
            {project.secondaryLabel}<span aria-hidden="true">!�</span>
          </a>
        </div>
      </div>
      <div
        className={styles.channelArtifact}
        data-artifact={project.visual}
        aria-hidden="true"
      >
        <span>{project.frequency.toFixed(2)} HZ / SIGNAL ACTIVE</span>
      </div>
    </Reveal>
  );
}
~~~

- [ ] **Step 5: Run component tests and the production compiler**

Run: npm test -- tests/signalComponents.test.js

Expected: 2 passing tests.

Run: npm run build

Expected: a successful Next.js build. The class names compile before Task 5 supplies their final CSS.

- [ ] **Step 6: Commit the semantic channel components**

Stage the two new components and tests/signalComponents.test.js. Use:

~~~text
Make every frequency channel navigable before adding spectacle

The rail and channel primitives expose all project evidence through ordinary
anchors and semantic sections for keyboard, pointer, and touch users.

Constraint: No React testing dependency may be added
Confidence: high
Scope-risk: narrow
Directive: Keep both evidence links visible without hover
Tested: npm test; npm run build
~~~

---

### Task 3: Harden WebGL and cursor runtime behavior

**Files:**

- Create: tests/renderLoopContracts.test.js
- Modify: components/VantaEffect.js:26-256
- Modify: components/DisplayPedestal.js:54-615
- Modify: components/CustomCursor.js:7-108

**Interfaces:**

- Consumes: resolveRenderMode from Task 1 and DisplayPedestal onResonance(detail) from Task 3.
- Produces: CSS fallback, static, paused, and continuous runtime modes with deterministic cleanup.
- Removes: DisplayPedestal private AudioContext, speaker icons, preference state, and audio toggle.

**User-approved behavior-level replacement (2026-07-28):** The source-regex contract in Steps 1-2 is superseded. Extend `lib/signalExperience.js` with pure production policies used by the three runtime components:

- `resolveWebGLPixelRatio(devicePixelRatio, isMobile)` normalizes invalid ratios and caps desktop at 2 and mobile at 1.5.
- `resolvePedestalMode({ webglAvailable, reducedMotion, inViewport, visible })` returns `css-fallback`, `paused`, `static`, or `continuous` with hidden/out-of-view states paused and reduced motion static.
- `resolveCursorEnabled({ finePointer, reducedMotion, visible })` enables the custom cursor only for a visible fine-pointer document without reduced motion.
- `tests/renderLoopContracts.test.js` exercises these functions plus `resolveRenderMode` with literal state transitions, including desktop/mobile changes without reload, hidden documents, reduced motion, viewport exit/re-entry, invalid device pixel ratios, and WebGL fallback.

VantaEffect, DisplayPedestal, and CustomCursor must consume these policies rather than duplicate them. Run the behavior test first and confirm missing-function failures. Runtime listener cleanup and actual animation cancellation remain part of Task 6 browser QA. The fenced source-regex example below is historical context only.

- [ ] **Step 1 (superseded): Do not write render-loop source-regex contracts**

Create tests/renderLoopContracts.test.js:

~~~js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", "components", file), "utf8");

test("vanta owns visibility, mobile-static, and fallback modes", () => {
  const source = read("VantaEffect.js");
  ["visibilitychange", "resolveRenderMode", "max-width: 720px",
   "dataset.webgl", "cancelAnimationFrame"].forEach((text) =>
    assert.match(source, new RegExp(text))
  );
});

test("pedestal is controlled and pauses outside the hero", () => {
  const source = read("DisplayPedestal.js");
  assert.match(source, /onResonance/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /1\.5/);
  assert.doesNotMatch(source, /AudioContext|SpeakerOnIcon|SpeakerOffIcon/);
});

test("custom cursor stops for reduced motion and hidden documents", () => {
  const source = read("CustomCursor.js");
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /cancelAnimationFrame/);
});
~~~

- [ ] **Step 2 (superseded): Do not infer runtime behavior from source strings**

Run: npm test -- tests/renderLoopContracts.test.js

Expected: FAIL because Vanta lacks visibility/mobile modes, pedestal owns audio, and cursor ignores reduced motion.

- [ ] **Step 3: Convert Vanta to the approved palette and runtime modes**

Import signalExperience and destructure resolveRenderMode. In the fragment shader, delete deepBlue, cyan, violet, pink, sweep, and sweep2. Replace their color calculation with:

~~~glsl
vec3 signalBlack = vec3(0.0235, 0.0431, 0.0353);
vec3 signalMint = vec3(0.5490, 0.9412, 0.7765);
vec3 calibrationGold = vec3(0.8941, 0.7216, 0.3647);
vec3 signalColor = mix(signalMint, calibrationGold, 0.16 + pulse * 0.12);
float intensity = clamp(rings * 0.52 + pulse * 0.22 + halo * 0.24, 0.0, 1.0);
vec3 color = mix(signalBlack, signalColor, intensity * fade);
color += resonanceColor * resonanceRing * resonance * 0.46;
~~~

When WebGLRenderer construction fails, set container.dataset.webgl = "fallback" before disposing geometry/material. Set it to "active" after the canvas mounts. Use matchMedia queries for prefers-reduced-motion and (max-width: 720px).

Replace the always-scheduled animate loop with:

~~~js
let animationId = 0;
let visible = !document.hidden;
const renderMode = () => resolveRenderMode({
  webglAvailable: !hasRenderError,
  reducedMotion: mediaQuery.matches,
  isMobile: mobileQuery.matches,
  visible,
});
const stopLoop = () => {
  if (animationId) window.cancelAnimationFrame(animationId);
  animationId = 0;
};
const frame = () => {
  if (renderMode() !== "continuous") {
    stopLoop();
    return;
  }
  uniforms.time.value += 0.05;
  if (uniforms.resonance.value > 0.001) uniforms.resonance.value *= 0.9;
  safeRender();
  animationId = window.requestAnimationFrame(frame);
};
const syncLoop = () => {
  const mode = renderMode();
  if (mode === "continuous" && !animationId) {
    animationId = window.requestAnimationFrame(frame);
  } else if (mode !== "continuous") {
    stopLoop();
    if (mode === "static") safeRender();
  }
};
const onVisibilityChange = () => {
  visible = !document.hidden;
  syncLoop();
};
const onRuntimeChange = () => syncLoop();
document.addEventListener("visibilitychange", onVisibilityChange);
mediaQuery.addEventListener("change", onRuntimeChange);
mobileQuery.addEventListener("change", onRuntimeChange);
syncLoop();
~~~

handleResonance updates channel color and intensity, then calls safeRender immediately in static mode. Cleanup removes all three listeners and calls stopLoop before disposing Three.js resources.

- [ ] **Step 4: Make DisplayPedestal visual-only and viewport-aware**

Delete RESONANCE_NOTES, AUDIO_PREF_KEY, every audio function, speaker icon, audio state/ref, toggleAudio, and resonanceToggle markup. Change the signature to:

~~~js
const DisplayPedestal = ({ className = "", onResonance = () => {} }) => {
~~~

In swapModel, always emit visual intent independent of sound:

~~~js
const nextModel = displayPedestalModels[nextIndex];
onResonance({
  channelId: "hero-model-" + nextIndex,
  color: nextModel.primary,
  frequency: [261.63, 329.63, 392, 440][nextIndex],
  intensity: 1,
});
~~~

Wrap WebGLRenderer construction in try/catch. On failure set host.dataset.webgl = "fallback" and return without mounting a canvas. On success:

~~~js
const mobileQuery = window.matchMedia("(max-width: 720px)");
renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.5 : 2)
);
host.dataset.webgl = "active";
~~~

Keep the existing reduced-motion on-demand renders. Add an IntersectionObserver at threshold 0.05 and a visibilitychange listener. The ambient loop runs only when !isReducedMotion && isInView && !document.hidden. syncLoop cancels the frame when false and restarts it once when true. Cleanup disconnects the observer and removes the visibility listener before disposing the scene.

- [ ] **Step 5: Stop the custom cursor when motion is reduced or the document is hidden**

Replace the one-time capability effect with:

~~~js
useEffect(() => {
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncEnabled = () =>
    setEnabled(pointerQuery.matches && !motionQuery.matches && !document.hidden);
  syncEnabled();
  pointerQuery.addEventListener("change", syncEnabled);
  motionQuery.addEventListener("change", syncEnabled);
  document.addEventListener("visibilitychange", syncEnabled);
  return () => {
    pointerQuery.removeEventListener("change", syncEnabled);
    motionQuery.removeEventListener("change", syncEnabled);
    document.removeEventListener("visibilitychange", syncEnabled);
  };
}, []);
~~~

The existing enabled effect already cancels its animation frame and removes the has-custom-cursor class on cleanup; keep that behavior unchanged.

- [ ] **Step 6: Run runtime tests and build**

Run: npm test -- tests/renderLoopContracts.test.js

Expected: 3 passing tests.

Run: npm test

Expected: full suite passes.

Run: npm run build

Expected: successful production build.

- [ ] **Step 7: Commit runtime hardening**

Stage the three components and tests/renderLoopContracts.test.js. Use:

~~~text
Spend animation frames only while visitors can see them

WebGL and cursor loops now share explicit reduced-motion, mobile, viewport,
visibility, and fallback policies while the pedestal delegates all sound.

Constraint: Reduced motion must stop continuous rendering
Confidence: high
Scope-risk: moderate
Directive: Visual resonance must remain independent from sound availability
Tested: npm test; npm run build
Not-tested: Low-end physical GPU behavior
~~~

---

### Task 4: Compose the home page as one signal instrument

**Files:**

- Create: tests/homeSignalLayout.test.js
- Modify: pages/index.js:1-448
- Modify: components/Navbar.js:1-75

**Interfaces:**

- Consumes: Task 1 signal functions/audio hook and Task 2 components.
- Produces: activeChannelId, previewChannelId, effectiveChannelId, and the vanta:resonance event stream.
- Preserves: all ten project evidence URLs, four footer destinations, JSON-LD, canonical URL, email, skip link, and back-to-top control.

**User-approved behavior-level replacement (2026-07-28):** The source-regex test in Steps 1-2 is superseded. `tests/homeSignalLayout.test.js` must start the repository's installed Next development server on an available loopback port, wait until it responds, fetch `/`, and stop the child process in teardown. Without adding a dependency, assert the rendered HTTP response:

- succeeds and identifies the five-medium Resonant Instrument with both explicit entry actions;
- exposes the signal-channel navigation and five rendered project sections;
- contains all ten preserved project evidence URLs plus the canonical URL, email, and footer destinations;
- omits the retired About/marquee/card/Giphy copy from the rendered experience;
- begins in a silent visual state without claiming that sound is already enabled.

Run this integration test before implementation and confirm it fails against the old rendered home page because the new instrument headline/actions and channel structure are absent. Do not read `pages/index.js` in the test. The fenced source-regex example below is historical context only.

- [ ] **Step 1 (superseded): Do not inspect home-page source text**

Create tests/homeSignalLayout.test.js:

~~~js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const home = fs.readFileSync(
  path.join(__dirname, "..", "pages", "index.js"),
  "utf8"
);

test("home uses the approved signal primitives and explicit sound entry", () => {
  ["useSignalAudio", "FrequencyRail", "ProjectChannel",
   "Enter the instrument", "Explore without sound"].forEach((text) =>
    assert.match(home, new RegExp(text))
  );
  ["SpotlightCard", "Marquee", "ScrollProgress", "giphy.com"].forEach((text) =>
    assert.doesNotMatch(home, new RegExp(text))
  );
});

test("all existing project evidence remains in the canonical page data", () => {
  [
    "https://a.co/d/078d1kaa",
    "https://woodyard.streamlit.app/",
    "https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics",
    "https://github.com/topherchris420/james_library",
    "https://oncyber.io/stanfordgsb",
    "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
    "https://woodyard.dappling.network",
    "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7",
    "https://chriswoodyard.bandcamp.com/",
    "https://chriswoodyard.bandcamp.com/track/creators-innovators",
  ].forEach((url) => assert.match(home, new RegExp(url.replace(/[.*+?^$()|[\]{}]/g, "\\$&"))));
});
~~~

- [ ] **Step 2 (superseded): Use the rendered-page integration failure described above**

Run: npm test -- tests/homeSignalLayout.test.js

Expected: FAIL because the page still imports SpotlightCard, Marquee, and ScrollProgress.

- [ ] **Step 3: Enrich the canonical project data and replace imports**

In pages/index.js, import useEffect, useState, FrequencyRail, ProjectChannel, useSignalAudio, and the Task 1 module. Remove Image, ScrollProgress, Marquee, and SpotlightCard imports plus marqueeItems and the module-level Web Audio singleton.

Add these exact fields to the existing five project objects without changing their current labels, descriptions, or URLs:

| title | id | note | color | visual |
| --- | --- | --- | --- | --- |
| Books | books | C4 | #8cf0c6 | waveform |
| Apps | apps | E4 | #8cf0c6 | nodes |
| Art | art | G4 | #8cf0c6 | artwork |
| Frequency | frequency | C5 | #8cf0c6 | orbit |
| Music | music | G3 | #8cf0c6 | spectrum |

Immediately after projectSections, validate the live data:

~~~js
const {
  createResonanceDetail,
  resolvePreviewChannel,
  selectActiveChannel,
  validateChannels,
} = signalExperience;

validateChannels(projectSections);
~~~

Update the description and Open Graph copy to: "Christopher Woodyard builds sound-driven wellness, consciousness engines, immersive art, writing, and music through Vers3Dynamics." Keep siteUrl unchanged.

- [ ] **Step 4: Add page-owned channel and sound state**

Inside Home, before return, add:

~~~js
const [scrollChannelId, setScrollChannelId] = useState("hero");
const [previewChannelId, setPreviewChannelId] = useState(null);
const effectiveChannelId = resolvePreviewChannel({
  scrollChannel: scrollChannelId,
  previewChannel: previewChannelId,
});
const {
  soundEnabled,
  soundAvailable,
  enableSound,
  toggleSound,
  playFrequency,
  stopFrequency,
} = useSignalAudio();

useEffect(() => {
  const nodes = Array.from(document.querySelectorAll("[data-signal-channel]"));
  if (!nodes.length || !("IntersectionObserver" in window)) return undefined;
  const visible = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visible.set(entry.target.dataset.signalChannel, {
      id: entry.target.dataset.signalChannel,
      isIntersecting: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      top: entry.boundingClientRect.top,
    }));
    setScrollChannelId((previous) =>
      selectActiveChannel(Array.from(visible.values()), previous)
    );
  }, {
    rootMargin: "-34% 0px -44% 0px",
    threshold: [0.2, 0.35, 0.5, 0.65],
  });
  nodes.forEach((node) => observer.observe(node));
  return () => observer.disconnect();
}, []);

useEffect(() => {
  const channel = projectSections.find(({ id }) => id === effectiveChannelId);
  if (!channel) return undefined;
  window.dispatchEvent(new CustomEvent("vanta:resonance", {
    detail: createResonanceDetail(channel),
  }));
  playFrequency(channel.frequency);
  return stopFrequency;
}, [effectiveChannelId, playFrequency, stopFrequency]);
~~~

Use setPreviewChannelId for both Task 2 components. Sound-disabled playFrequency calls are intentionally no-ops.

- [ ] **Step 5: Replace the old main-page composition**

Keep Head, JSON-LD, skip link, CustomCursor, Navbar, VantaEffect, and ScrollToTop. Remove ScrollProgress, the poster image layer, standalone About section, marquee, card grid, and Giphy iframe. Use this structural core:

~~~jsx
<main id="main-content" tabIndex={-1} className={styles.main}>
  <section className={styles.signalHero} aria-labelledby="signal-title">
    <div className={styles.heroCopy}>
      <p className={styles.instrumentLabel}>
        Christopher Woodyard / signal architect
      </p>
      <h1 id="signal-title" className={styles.signalTitle}>
        Five mediums.<span>One signal.</span>
      </h1>
      <p className={styles.signalSummary}>
        Sound-driven wellness, consciousness engines, immersive art,
        writing, and music built as one connected practice.
      </p>
      <div className={styles.heroActions}>
        <button
          type="button"
          className={styles.signalPrimary}
          onClick={async () => {
            await enableSound();
            document.querySelector("#work")?.scrollIntoView();
          }}
        >
          Enter the instrument
        </button>
        <a href="#work" className={styles.signalTextLink}>
          Explore without sound
        </a>
      </div>
      <nav className={styles.identityLinks} aria-label="Christopher's work">
        <a href="https://vers3dynamics.com/">Vers3Dynamics</a>
        <a href="https://rainlabteam.vercel.app/">R.A.I.N. Lab</a>
        <a href="https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976">
          Papers
        </a>
      </nav>
    </div>
    <DisplayPedestalNoSSR
      className={styles.heroStage}
      onResonance={(detail) =>
        window.dispatchEvent(new CustomEvent("vanta:resonance", { detail }))
      }
    />
  </section>

  <FrequencyRail
    channels={projectSections}
    activeId={effectiveChannelId}
    onPreview={setPreviewChannelId}
    onPreviewEnd={() => setPreviewChannelId(null)}
  />
  <button
    type="button"
    className={styles.soundControl}
    onClick={toggleSound}
    aria-pressed={soundEnabled}
    disabled={!soundAvailable}
  >
    {soundAvailable ? (soundEnabled ? "Sound on" : "Sound off") : "Sound unavailable"}
  </button>

  <section id="work" className={styles.signalChannels} aria-label="Selected work">
    {projectSections.map((project, index) => (
      <ProjectChannel
        key={project.id}
        project={project}
        index={index}
        active={effectiveChannelId === project.id}
        onPreview={setPreviewChannelId}
        onPreviewEnd={() => setPreviewChannelId(null)}
      />
    ))}
  </section>

  <Reveal as="footer" id="contact" className={styles.signalFooter}>
    <p className={styles.instrumentLabel}>Channel open / collaboration</p>
    <h2>Make something that resonates.</h2>
    <a href="mailto:christopher@vers3dynamics.com" className={styles.signalPrimary}>
      christopher@vers3dynamics.com
    </a>
    <nav className={styles.footerLinks} aria-label="Elsewhere">
      {elsewhereLinks.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      ))}
    </nav>
    <p>� {new Date().getFullYear()} Vers3Dynamics / R.A.I.N. Lab</p>
  </Reveal>
</main>
~~~

The identity and footer external links use target="_blank" and rel="noopener noreferrer". Keep the mail link in the same tab.

- [ ] **Step 6: Make Navbar destinations valid on home and 404**

Change navLinks to Signal/#top, Work/#work, and Contact/#contact. Import useRouter from next/router, then use:

~~~js
const { pathname } = useRouter();
const destination = (hash) => (pathname === "/" ? hash : "/" + hash);
~~~

Apply destination(link.href) to brand and nav href values. Run the section IntersectionObserver only when pathname === "/" so the 404 never observes absent local sections.

- [ ] **Step 7: Run composition tests and build**

Run: npm test

Expected: all signal, component, layout, and pedestal tests pass.

Run: npm run build

Expected: successful production build with no missing imports.

- [ ] **Step 8: Commit the page composition**

Stage pages/index.js, components/Navbar.js, and tests/homeSignalLayout.test.js. Use:

~~~text
Let one active channel conduct the entire portfolio

The home page now derives navigation, visual resonance, and optional sound
from one scroll state while preserving every external evidence link.

Constraint: projectSections remains the content source of truth
Rejected: Keep the standalone About section | it interrupted the approved instrument sequence
Confidence: high
Scope-risk: moderate
Directive: Channel previews must restore the scroll-selected state on exit
Tested: npm test; npm run build
~~~

---

### Task 5: Install the Resonant Instrument visual system and remove the retired UI

**Files:**
- Modify: tests/homeSignalLayout.test.js
- Modify: pages/_app.js
- Modify: pages/_document.js
- Modify: styles/globals.css
- Modify: styles/Home.module.css
- Modify: pages/404.js
- Modify: styles/NotFound.module.css
- Delete: components/Marquee.js
- Delete: components/Marquee.module.css
- Delete: components/SpotlightCard.js
- Delete: components/SpotlightCard.module.css
- Delete: components/ScrollProgress.js
- Delete: components/ScrollProgress.module.css

**User-approved behavior-level replacement (2026-07-28):** Do not create `tests/designContract.test.js`; the source-string test in Step 1 is superseded. Extend the rendered-page integration suite so an unmatched route returns the 404 recovery experience with a 404 response, one clear recovery destination to `/`, and no second work-navigation CTA. The old 404 has two recovery actions, so this test must fail before the Task 5 implementation. Font roles, palette values, layout selectors, and purely visual CSS are intentional design decisions: verify them through `npm run build` and the Task 6 browser/visual-verdict loop rather than change-detector tests. Retired-file/reference removal is verified with the explicit `rg` cleanup command in Task 6, not as a unit test.

- [ ] **Step 1 (superseded): Write the rendered 404 recovery behavior test described above**

Create tests/designContract.test.js:

~~~js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("the global visual language uses the approved fonts and palette", () => {
  const app = read("pages/_app.js");
  const globals = read("styles/globals.css");

  assert.match(app, /Syne/);
  assert.match(app, /Space_Grotesk/);
  assert.doesNotMatch(app, /\bInter\b/);

  ["#060b09", "#0b1210", "#edf9f4", "#a5b6ae", "#8cf0c6", "#e4b65c"]
    .forEach((token) => assert.equal(globals.includes(token), true, token));
  ["--cyan", "--violet", "--pink", "--gradient"]
    .forEach((token) => assert.equal(globals.includes(token), false, token));
});

test("home styles describe the instrument, not the retired card grid", () => {
  const home = read("styles/Home.module.css");
  [
    ".signalHero",
    ".frequencyRail",
    ".signalChannels",
    ".projectChannel",
    ".channelArtifact",
    ".soundControl",
    ".signalFooter",
    "@media (max-width: 720px)",
    "prefers-reduced-motion",
  ].forEach((selector) => assert.equal(home.includes(selector), true, selector));
  [
    ".projectGrid",
    ".projectCard",
    ".marquee",
    ".giphyEmbed",
    ".scrollProgress",
  ].forEach((selector) => assert.equal(home.includes(selector), false, selector));
});

test("retired presentation components are deleted", () => {
  [
    "components/Marquee.js",
    "components/Marquee.module.css",
    "components/SpotlightCard.js",
    "components/SpotlightCard.module.css",
    "components/ScrollProgress.js",
    "components/ScrollProgress.module.css",
  ].forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(root, relativePath)), false, relativePath);
  });
});
~~~

Run: npm test -- tests/homeSignalLayout.test.js

Expected: FAIL because the old 404 renders two recovery actions.

- [ ] **Step 2: Install the approved fonts and root tokens**

In pages/_app.js, replace Inter with Syne and keep Space Grotesk:

~~~js
import { Space_Grotesk, Syne } from "next/font/google";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
~~~

Apply both variables to the app root. Change the theme color in pages/_document.js to #060b09.

Replace the old global color tokens with:

~~~css
:root {
  --ink: #060b09;
  --surface: #0b1210;
  --paper: #edf9f4;
  --muted: #a5b6ae;
  --signal: #8cf0c6;
  --amber: #e4b65c;
  --line: rgba(237, 249, 244, 0.16);
  --font-display: "Syne", sans-serif;
  --font-body: "Space Grotesk", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
~~~

Keep the skip-link, selection, visible focus, base reset, and reduced-motion rules. The body uses --font-body and --ink. Headings use --font-display. Focus rings use --signal and must remain visible against both root surfaces.

- [ ] **Step 3: Replace Home.module.css with the instrument layout**

Implement these named regions and constraints:

~~~css
.container {
  position: relative;
  min-height: 100vh;
  overflow: clip;
  color: var(--paper);
  background:
    linear-gradient(rgba(140, 240, 198, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140, 240, 198, 0.025) 1px, transparent 1px),
    var(--ink);
  background-size: 44px 44px;
}

.main {
  position: relative;
  z-index: 2;
}

.signalHero {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 7rem);
  padding: clamp(7rem, 12vw, 11rem) clamp(1.25rem, 6vw, 7rem) 5rem;
}

.signalTitle {
  max-width: 10ch;
  margin: 0;
  font: 800 clamp(4rem, 10vw, 9.5rem) / 0.82 var(--font-display);
  letter-spacing: -0.075em;
  text-transform: uppercase;
}

.signalTitle span {
  display: block;
  color: transparent;
  -webkit-text-stroke: 1px var(--signal);
  text-stroke: 1px var(--signal);
}

.frequencyRail {
  position: fixed;
  z-index: 12;
  top: 50%;
  right: clamp(0.75rem, 2vw, 2rem);
  display: grid;
  gap: 0.55rem;
  transform: translateY(-50%);
}

.signalChannels {
  border-top: 1px solid var(--line);
}

.projectChannel {
  min-height: 72vh;
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr) minmax(280px, 0.8fr);
  align-items: center;
  gap: clamp(1.5rem, 5vw, 6rem);
  padding: clamp(4rem, 9vw, 9rem) clamp(1.25rem, 8vw, 9rem);
  border-bottom: 1px solid var(--line);
  opacity: 0.58;
  transition: opacity 240ms ease;
}

.projectChannel[data-active="true"] {
  opacity: 1;
}

.projectChannel:nth-child(even) .channelArtifact {
  order: -1;
}

.channelArtifact {
  position: relative;
  min-height: min(50vw, 34rem);
  overflow: hidden;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 88%, var(--signal));
}

.channelArtifact::before,
.channelArtifact::after {
  content: "";
  position: absolute;
  inset: 12%;
  border: 1px solid color-mix(in srgb, var(--signal) 55%, transparent);
  transform: rotate(9deg);
}

.projectChannel[data-active="true"] .channelArtifact::after {
  transform: rotate(-7deg) scale(0.72);
}

.soundControl {
  position: fixed;
  z-index: 14;
  right: clamp(0.75rem, 2vw, 2rem);
  bottom: 1rem;
  font: 600 0.68rem / 1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.signalFooter {
  min-height: 72vh;
  display: grid;
  align-content: center;
  gap: 2rem;
  padding: clamp(5rem, 10vw, 10rem) clamp(1.25rem, 8vw, 9rem);
  background: var(--signal);
  color: var(--ink);
}

@media (max-width: 720px) {
  .signalHero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 8rem;
  }

  .signalTitle {
    font-size: clamp(3.5rem, 18vw, 6rem);
  }

  .frequencyRail {
    position: sticky;
    top: 0;
    right: auto;
    display: flex;
    overflow-x: auto;
    transform: none;
    background: color-mix(in srgb, var(--ink) 88%, transparent);
    backdrop-filter: blur(16px);
  }

  .projectChannel {
    min-height: auto;
    grid-template-columns: 1fr;
    padding-block: 5rem;
  }

  .projectChannel:nth-child(even) .channelArtifact {
    order: initial;
  }
}

@media (prefers-reduced-motion: reduce) {
  .projectChannel,
  .channelArtifact::before,
  .channelArtifact::after {
    transition: none;
  }
}
~~~

Complete the selectors used by Task 2 and Task 4 components, including nav, hero copy, labels, channel metadata, action links, artifact variants, footer links, DisplayPedestal host, ScrollToTop, and CustomCursor. Keep animation to transform and opacity. Do not add a generic card shell, gradient headline, pill cloud, or decorative copy.

- [ ] **Step 4: Align the 404 page and delete retired components**

Restyle pages/404.js and styles/NotFound.module.css with the same typography and six tokens. It remains a quiet recovery page: one signal label, one large 404 heading, a concise message, and one route back to "/". Do not add audio, WebGL, or a second navigation system.

Delete the six Marquee, SpotlightCard, and ScrollProgress files listed above after their imports are gone. Do not leave commented code or orphaned selectors.

- [ ] **Step 5: Run rendered behavior tests, full tests, and build**

Run: npm test -- tests/homeSignalLayout.test.js

Expected: rendered home and 404 behavior tests pass.

Run: npm test

Expected: all tests pass.

Run: npm run build

Expected: successful production build with no CSS module or font errors.

- [ ] **Step 6: Commit the visual system**

Stage the Task 5 files. Use:

~~~text
Give the portfolio one unmistakable signal language

The approved type, palette, spatial rhythm, and channel artifacts replace
the generic card-and-gradient vocabulary while retaining the existing work.

Constraint: no new runtime dependency or image asset
Rejected: Add a generative art package | native CSS and existing WebGL already provide the instrument vocabulary
Confidence: high
Scope-risk: moderate
Directive: Preserve the six-token palette and asymmetrical channel rhythm
Tested: npm test; npm run build; visual-verdict browser checks
~~~

---

### Task 6: Visual QA, accessibility proof, and product documentation

**Files:**
- Modify: PRODUCT.md
- Create or update: .omx/state/vanta/ralph-progress.json

- [ ] **Step 1: Prove the repository is free of retired references**

Run: rg -n "Marquee|SpotlightCard|ScrollProgress|projectGrid|projectCard|giphy" pages components styles tests

Expected: no matches.

Run: npm test

Expected: all tests pass.

Run: npm run build

Expected: successful production build with no warnings introduced by this redesign.

- [ ] **Step 2: Start the app and run the required visual-verdict loop**

Start the development server on an available local port. Invoke $visual-verdict before every visual edit and persist each verdict in .omx/state/vanta/ralph-progress.json as required by AGENTS.md.

Capture and judge at least:
- Desktop: 1440 x 900 at hero, Books, Frequency, and footer positions.
- Mobile: 390 x 844 at hero, horizontal rail, one project channel, and footer.
- Reduced motion: desktop and mobile with prefers-reduced-motion enabled.

The verdict must explicitly check:
- The first viewport reads as an instrument, not a SaaS landing page.
- Exactly one channel is visually primary.
- The right rail on desktop and sticky horizontal rail on mobile agree with the active channel.
- The model and Vanta surface share the active mint/amber resonance language.
- Project evidence remains legible and is never hidden behind the rail or sound control.
- Mobile artifacts are static and do not create horizontal page overflow.

If any verdict fails, make one bounded visual correction, rerun the rendered integration test and build, then capture a fresh verdict before the next edit.

- [ ] **Step 3: Run keyboard, audio, fallback, and runtime QA**

Using the browser workflow, verify:
- Tab order reaches skip link, brand/nav, hero actions, identity links, rail buttons, sound button, both links for each project, ScrollToTop, mail link, and footer links.
- Enter and Space operate every button; focus is visible on dark and mint surfaces.
- Hover/focus preview restores the scroll-selected channel on exit.
- Reload begins silent. Only Enter the instrument or Sound off/on creates or resumes AudioContext.
- Sound unavailable disables only the sound control; all navigation and project links still work.
- When WebGLRenderer throws or WebGL is unavailable, the CSS fallback remains composed and usable.
- A hidden tab and reduced-motion mode stop continuous Vanta, pedestal, and cursor animation loops.
- Switching to desktop restores full rendering without requiring a reload.
- Browser console contains zero uncaught errors.

- [ ] **Step 4: Update PRODUCT.md to match the shipped experience**

Document:
- The five-channel Resonant Instrument sequence and active-channel contract.
- Silent entry and gesture-only audio.
- Desktop, mobile, reduced-motion, hidden-tab, and WebGL-fallback policies.
- Exact palette and Syne/Space Grotesk type roles.
- Existing project URLs as the source-of-truth evidence set.
- Commands: npm test and npm run build.

Remove descriptions of the retired About/marquee/card/Giphy composition.

- [ ] **Step 5: Final verification and documentation commit**

Run: npm test

Expected: all tests pass.

Run: npm run build

Expected: successful production build.

Run: git diff --check

Expected: no whitespace errors.

Run: git status --short

Expected: only the intended PRODUCT.md and visual-verdict state artifact before commit.

Commit with:

~~~text
Make the Resonant Instrument safe to maintain

The product contract and final browser evidence now describe the shipped
channel, sound, motion, and fallback behavior.

Constraint: visual-verdict evidence is required for every visual iteration
Confidence: high
Scope-risk: narrow
Directive: Re-run desktop, mobile, and reduced-motion verdicts after visual changes
Tested: npm test; npm run build; desktop and mobile browser QA; reduced-motion QA
Not-tested: physical assistive-technology hardware
~~~

- [ ] **Step 6: Confirm the completed branch**

Run:
- git status --short
- git log --oneline --decorate -6
- git diff origin/main...HEAD --stat

Expected: clean worktree, six focused Lore commits including the approved design spec and implementation plan, and only Resonant Instrument files in the branch diff.

---

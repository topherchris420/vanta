import { useEffect, useRef } from "react";
import { createStudio } from "../../lib/studio/scene";
import { supportsWebGL } from "../../lib/runtimeCapabilities";

// The canvas host. It builds the scene once, hands its API to the page
// through `apiRef`, and turns pointer and keyboard input into walking and
// looking. Every decision about what happens next belongs to the page.

const MOVE_KEYS = {
  KeyW: ["forward", 1],
  ArrowUp: ["forward", 1],
  KeyS: ["forward", -1],
  ArrowDown: ["forward", -1],
  KeyA: ["strafe", -1],
  KeyD: ["strafe", 1],
  ArrowLeft: ["turn", 1],
  ArrowRight: ["turn", -1],
};

const isTypingTarget = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const readFonts = () => {
  const style = getComputedStyle(document.documentElement.querySelector("[data-studio-root]") ?? document.body);
  const pick = (name, fallback) => (style.getPropertyValue(name) || "").trim() || fallback;
  return {
    display: pick("--font-display", "sans-serif"),
    body: pick("--font-body", "sans-serif"),
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  };
};

export default function StudioStage({
  apiRef,
  layout,
  practice,
  documents,
  tierId,
  reducedMotion,
  isMobile,
  controlsEnabled,
  events,
  className,
}) {
  const hostRef = useRef(null);
  const eventsRef = useRef(events);
  const controlsRef = useRef(controlsEnabled);
  eventsRef.current = events;
  controlsRef.current = controlsEnabled;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const call = (name, ...args) => eventsRef.current?.[name]?.(...args);

    if (!supportsWebGL()) {
      call("onFailure", "unsupported");
      return undefined;
    }

    let studio;
    try {
      studio = createStudio({
        host,
        layout,
        practice,
        documents,
        tierId,
        reducedMotion,
        isMobile,
        fonts: readFonts(),
        events: {
          onZone: (zone) => call("onZone", zone),
          onTarget: (object) => call("onTarget", object),
          onArrive: (id) => call("onArrive", id),
          onTierChange: (tier, reason) => call("onTierChange", tier, reason),
          onFailure: (reason) => call("onFailure", reason),
        },
      });
    } catch (error) {
      console.warn("Unable to build the studio.", error);
      call("onFailure", "construction");
      return undefined;
    }
    apiRef.current = studio;
    call("onReady", studio);

    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) studio.refreshLabels(readFonts());
    });

    // Pointer: drag to look, tap or click to use what is under it.
    const drag = { id: null, x: 0, y: 0, startX: 0, startY: 0, time: 0, moved: 0 };
    const toNdc = (event) => {
      const bounds = host.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
      };
    };
    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      drag.id = event.pointerId;
      drag.x = drag.startX = event.clientX;
      drag.y = drag.startY = event.clientY;
      drag.time = performance.now();
      drag.moved = 0;
      host.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (event.pointerType === "mouse" && drag.id === null) {
        const point = toNdc(event);
        studio.hover(point.x, point.y);
        return;
      }
      if (event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (controlsRef.current) {
        const scale = event.pointerType === "touch" ? 1.5 : 1;
        studio.look(dx * scale, dy * scale);
      }
    };
    const onPointerUp = (event) => {
      if (event.pointerId !== drag.id) return;
      drag.id = null;
      host.releasePointerCapture?.(event.pointerId);
      const quick = performance.now() - drag.time < 600;
      if (drag.moved < 8 && quick) {
        const object = studio.pick(toNdc(event).x, toNdc(event).y);
        call("onPick", object);
      }
    };
    const onPointerLeave = () => studio.hover(null);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    host.addEventListener("pointerleave", onPointerLeave);

    // Keyboard: walking only. Everything else is the page's.
    const held = new Map();
    const syncInput = () => {
      const intent = { forward: 0, strafe: 0, turn: 0 };
      held.forEach(([axis, value]) => {
        intent[axis] = Math.max(-1, Math.min(1, intent[axis] + value));
      });
      studio.setInput({ ...intent, run: held.has("ShiftLeft") || held.has("ShiftRight") });
    };
    const onKeyDown = (event) => {
      if (!controlsRef.current || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        held.set(event.code, ["forward", 0]);
        syncInput();
        return;
      }
      const binding = MOVE_KEYS[event.code];
      if (!binding) return;
      event.preventDefault();
      held.set(event.code, binding);
      syncInput();
    };
    const onKeyUp = (event) => {
      if (!held.has(event.code)) return;
      held.delete(event.code);
      syncInput();
    };
    const releaseAll = () => {
      held.clear();
      syncInput();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
      host.removeEventListener("pointerleave", onPointerLeave);
      apiRef.current = null;
      studio.dispose();
    };
    // The scene is built once per mount; later changes go through the API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving walk mode drops any held movement key.
  useEffect(() => {
    if (!controlsEnabled) apiRef.current?.setInput({ forward: 0, strafe: 0, turn: 0, run: false });
  }, [controlsEnabled, apiRef]);

  return <div ref={hostRef} className={className} data-studio-canvas="" style={className ? undefined : { position: "absolute", inset: 0 }} />;
}

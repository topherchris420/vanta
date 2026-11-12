import { useEffect, useRef } from "react";
import styles from "../../styles/Studio.module.css";
import HorizonMark from "../HorizonMark";

// The prompt sits on the thing it is about. Its position is read from the
// scene every frame and written straight to the element, so walking never
// re-renders React.
function AnchoredPrompt({ apiRef, label, onInteract, touch }) {
  const anchorRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const element = anchorRef.current;
      const point = apiRef.current?.projectTarget?.();
      if (element && point) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const x = Math.min(Math.max(point.x - width / 2, 12), point.width - width - 12);
        const y = Math.min(Math.max(point.y + 26, 84), point.height - height - 20);
        element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        element.dataset.placed = "true";
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [apiRef]);
  return (
    <div ref={anchorRef} className={styles.promptAnchor}>
      <button type="button" className={styles.prompt} onClick={onInteract}>
        {!touch && <kbd>E</kbd>}
        <span>{label}</span>
      </button>
    </div>
  );
}

const TIER_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "high", label: "High" },
  { value: "medium", label: "Balanced" },
  { value: "low", label: "Light" },
];

// Where you are, what you can use, and the few controls that are always
// within reach. The room readout mirrors the home page's console.
export default function StudioHud({
  zone,
  chord,
  target,
  interactLabel,
  onInteract,
  soundControl,
  discoveries,
  totalDiscoveries,
  panels,
  onToggle,
  tierChoice,
  onTier,
  touch,
  showPrompt,
  canMap = true,
  apiRef,
}) {
  const tuned = zone?.kind === "channel";
  return (
    <>
      <header className={styles.hudTop}>
        <a href="/" className={styles.hudBrand} aria-label="Leave the studio for the portfolio page">
          <HorizonMark className={styles.hudMark} />
          <span>Vanta</span>
        </a>
        <p className={styles.hudReadout} data-tuned={tuned ? "true" : "false"} data-chord={chord ? "true" : "false"}>
          {chord ? (
            <>
              <span className={styles.hudNumber}>∿</span>
              <span>{chord.name}</span>
              <span className={styles.hudFrequency}>
                {chord.channelIds.length} {chord.channelIds.length === 1 ? "note" : "notes"}
              </span>
            </>
          ) : tuned ? (
            <>
              <span className={styles.hudNumber}>{zone.number}</span>
              <span>{zone.name}</span>
              <span className={styles.hudFrequency}>
                {zone.note} · {zone.frequency.toFixed(2)} Hz
              </span>
            </>
          ) : (
            <>
              <span className={styles.hudNumber}>00</span>
              <span>{zone?.name ?? "The Hall"}</span>
              <span className={styles.hudFrequency}>Standby</span>
            </>
          )}
        </p>
        <div className={styles.hudControls}>
          {soundControl}
          {canMap && (
            <button type="button" className={styles.hudButton} aria-pressed={panels.map} onClick={() => onToggle("map")}>
              Map
            </button>
          )}
          <button
            type="button"
            className={styles.hudButton}
            aria-pressed={panels.index}
            aria-controls="studio-index"
            onClick={() => onToggle("index")}
          >
            Index
          </button>
          <button type="button" className={styles.hudButton} aria-pressed={panels.help} onClick={() => onToggle("help")}>
            Help
          </button>
        </div>
      </header>

      {showPrompt && target && (
        <AnchoredPrompt apiRef={apiRef} label={interactLabel} onInteract={onInteract} touch={touch} />
      )}

      <button
        type="button"
        className={styles.found}
        aria-pressed={panels.found}
        onClick={() => onToggle("found")}
      >
        <span className={styles.foundCount}>
          {discoveries.size}/{totalDiscoveries}
        </span>{" "}
        found
      </button>

      {panels.help && (
        <section className={styles.helpCard} aria-labelledby="help-title">
          <h2 id="help-title">Getting around</h2>
          <dl>
            <div><dt>Walk</dt><dd>W A S D or the arrow keys; Shift to hurry. On a phone, the pad.</dd></div>
            <div><dt>Look</dt><dd>Drag anywhere on the room.</dd></div>
            <div><dt>Use</dt><dd>Click or tap what you want, or press E for what is in front of you.</dd></div>
            <div><dt>Leave</dt><dd>Escape, or Back to the studio, always returns you to your feet.</dd></div>
            <div><dt>Lost?</dt><dd>The map sends you to any room; the index lists everything as text.</dd></div>
          </dl>
          <div className={styles.control}>
            <label htmlFor="studio-quality">Graphics</label>
            <select id="studio-quality" value={tierChoice} onChange={(event) => onTier(event.target.value)}>
              {TIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={styles.textButton} onClick={() => onToggle("help")}>
            Close
          </button>
        </section>
      )}
    </>
  );
}

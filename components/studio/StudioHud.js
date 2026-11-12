import styles from "../../styles/Studio.module.css";
import HorizonMark from "../HorizonMark";

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
        <button type="button" className={styles.prompt} onClick={onInteract}>
          {!touch && <kbd>E</kbd>}
          <span>{interactLabel}</span>
        </button>
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

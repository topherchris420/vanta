import styles from "../../styles/Studio.module.css";

// The one sound switch, worded exactly as on the home page.
export default function SoundControl({ soundEnabled, soundAvailable, onToggle, className = "" }) {
  const state = !soundAvailable ? "unavailable" : soundEnabled ? "on" : "off";
  const label = { unavailable: "Sound unavailable", on: "Sound on", off: "Sound off" }[state];
  return (
    <button
      type="button"
      className={`${styles.soundControl} ${className}`.trim()}
      onClick={onToggle}
      aria-pressed={soundEnabled}
      disabled={!soundAvailable}
      data-sound={state}
    >
      <span className={styles.soundGlyph} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {label}
    </button>
  );
}

import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

const { createSignalConsoleView } = signalExperience;

// The single fixed console: a live readout of the conducting channel plus the
// one sound control. The readout is decorative for assistive tech because the
// frequency rail already reports location through aria-current.
export default function SignalConsole({
  channels,
  activeId,
  soundEnabled,
  soundAvailable,
  thread = null,
  chordSize = 0,
  onToggleSound,
}) {
  const view = createSignalConsoleView({
    channels,
    activeId,
    soundEnabled,
    soundAvailable,
    thread,
    chordSize,
  });

  return (
    <div
      className={styles.signalConsole}
      data-tuned={view.tuned ? "true" : "false"}
    >
      <div className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
        {soundEnabled ? "Audio output enabled" : "Audio output disabled"}
      </div>
      <p className={styles.consoleReadout} aria-hidden="true">
        <span className={styles.consoleChannel}>
          <span className={styles.consoleNumber}>{view.channelNumber}</span>
          {view.channelLabel}
        </span>
        <span className={styles.consoleFrequency}>{view.frequencyLabel}</span>
      </p>
      <button
        type="button"
        className={styles.soundControl}
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        disabled={!soundAvailable}
        data-sound={view.soundState}
      >
        <span className={styles.soundGlyph} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {view.soundLabel}
      </button>
    </div>
  );
}

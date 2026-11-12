import { useEffect, useRef, useState } from "react";
import styles from "../../../styles/Studio.module.css";
import instruments from "../../../lib/studio/instruments";

const { IN_TUNE_CENTS, beatRate, createTuningGame, detune, isStringInTune, tuneString } = instruments;

// Resolve: the five strings of the chord arrive out of tune. Each strobe
// drifts while its string is off and stands still when it is right; with
// sound on, Listen plays the string against its true note so the beating can
// be heard. Bring all five in and the chord resolves.
export default function Resolve({ channels, audio, reducedMotion, onResolved }) {
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 100000));
  const [game, setGame] = useState(() => createTuningGame(channels, seed));
  const [showCents, setShowCents] = useState(false);
  const strobes = useRef(new Map());
  const gameRef = useRef(game);
  gameRef.current = game;
  const reported = useRef(false);

  useEffect(() => {
    setGame(createTuningGame(channels, seed));
    reported.current = false;
  }, [channels, seed]);

  useEffect(() => {
    if (game.resolved && !reported.current) {
      reported.current = true;
      onResolved?.(game);
    }
  }, [game, onResolved]);

  // Strobes drift in proportion to how far off each string is.
  useEffect(() => {
    if (reducedMotion) return undefined;
    let frame = 0;
    let last = 0;
    const angles = new Map();
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      gameRef.current.strings.forEach((string) => {
        const element = strobes.current.get(string.id);
        if (!element) return;
        const angle = (angles.get(string.id) ?? 0) + string.cents * 7 * dt;
        angles.set(string.id, angle);
        element.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const tune = (id, cents) => setGame((current) => tuneString(current, id, cents));
  const inTune = game.strings.filter(isStringInTune).length;

  return (
    <div className={styles.resolve}>
      <p className={styles.panelLede}>
        Five strings, one for each room, arrive out of tune. Bring each one in until its strobe stands
        still. {audio.soundEnabled ? "Listen plays a string against its true note: the slower the beating, the closer you are." : "Switch sound on to tune by ear as well."}
      </p>
      <ol className={styles.strings}>
        {game.strings.map((string) => {
          const tuned = isStringInTune(string);
          const beats = beatRate(string.target, string.cents);
          return (
            <li key={string.id} className={styles.string} data-tuned={tuned ? "true" : "false"}>
              <span className={styles.stringNote}>
                {string.note}
                <span className={styles.meta}> {string.title}</span>
              </span>
              <span className={styles.strobe} aria-hidden="true">
                <span ref={(element) => element && strobes.current.set(string.id, element)} />
              </span>
              <span className={styles.stringState} aria-live="polite">
                {tuned
                  ? "In tune"
                  : `${showCents ? `${string.cents > 0 ? "+" : ""}${string.cents}¢, ` : ""}${string.cents > 0 ? "sharp" : "flat"}, beating ${beats.toFixed(1)} times a second`}
              </span>
              <span className={styles.stringControls}>
                <button type="button" onClick={() => tune(string.id, -10)} disabled={game.resolved} aria-label={`${string.note} down ten cents`}>−10</button>
                <button type="button" onClick={() => tune(string.id, -1)} disabled={game.resolved} aria-label={`${string.note} down one cent`}>−1</button>
                <button type="button" onClick={() => tune(string.id, 1)} disabled={game.resolved} aria-label={`${string.note} up one cent`}>+1</button>
                <button type="button" onClick={() => tune(string.id, 10)} disabled={game.resolved} aria-label={`${string.note} up ten cents`}>+10</button>
                <button
                  type="button"
                  onClick={() => audio.pluck(detune(string.target, string.cents), string.target)}
                  disabled={!audio.soundEnabled}
                >
                  Listen
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p className={styles.readout} aria-live="polite">
        {game.resolved
          ? `Resolved in ${game.moves} moves. G3 · C4 · E4 · G4 · C5, one chord.`
          : `${inTune} of 5 in tune, within ${IN_TUNE_CENTS} cents. ${game.moves} moves.`}
      </p>
      <div className={styles.buttonRow}>
        <button type="button" onClick={() => setSeed(1 + Math.floor(Math.random() * 100000))}>
          New tuning
        </button>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showCents} onChange={(event) => setShowCents(event.target.checked)} />
          Show cents
        </label>
      </div>
    </div>
  );
}

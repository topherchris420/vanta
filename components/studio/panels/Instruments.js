import { useEffect, useRef, useState } from "react";
import styles from "../../../styles/Studio.module.css";
import instruments from "../../../lib/studio/instruments";
import { ExternalLink } from "../Prose";

const {
  CHLADNI_MODES,
  CHLADNI_RANGE,
  KEY_BINDINGS,
  SYNTH_LIMITS,
  WAVEFORMS,
  chladniModeAt,
  createKeyboard,
  midiToName,
} = instruments;

// A logarithmic slider: what a frequency or time control should feel like.
function LogSlider({ id, label, value, min, max, onChange, format, step = 1000 }) {
  const position = Math.round((Math.log(value / min) / Math.log(max / min)) * step);
  return (
    <div className={styles.control}>
      <label htmlFor={id}>
        {label} <output htmlFor={id}>{format(value)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={step}
        value={position}
        aria-valuetext={format(value)}
        onChange={(event) => onChange(min * Math.pow(max / min, Number(event.target.value) / step))}
      />
    </div>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className={styles.control} role="group" aria-label={label}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.segmented}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SHAPES = WAVEFORMS.map((shape) => ({ value: shape, label: shape[0].toUpperCase() + shape.slice(1) }));
const hz = (value) => `${value.toFixed(value < 100 ? 2 : 1)} Hz`;

/* --------------------------------------------------------- signal generator */

const RATIOS = [
  { value: 1, label: "1:1", name: "unison" },
  { value: 2, label: "2:1", name: "octave" },
  { value: 1.5, label: "3:2", name: "fifth, G over C" },
  { value: 4 / 3, label: "4:3", name: "fourth" },
  { value: 1.25, label: "5:4", name: "major third, E over C" },
  { value: Math.SQRT2, label: "√2", name: "never closes" },
];

export function ScopePanel({ scope, setScope, soundEnabled, channels }) {
  return (
    <div className={styles.instrument}>
      <p className={styles.panelLede}>
        A function generator on the bench, wired to the oscilloscope beside it. Every change shows on
        the scope at once; with sound on you can also send it to the speaker.
      </p>
      <LogSlider
        id="scope-frequency"
        label="Frequency"
        value={scope.frequency}
        min={40}
        max={2000}
        format={hz}
        onChange={(frequency) => setScope({ frequency })}
      />
      <Segmented label="Waveform" options={SHAPES} value={scope.shape} onChange={(shape) => setScope({ shape })} />
      <div className={styles.control}>
        <label htmlFor="scope-amplitude">
          Amplitude <output htmlFor="scope-amplitude">{Math.round(scope.amplitude * 100)}%</output>
        </label>
        <input
          id="scope-amplitude"
          type="range"
          min={5}
          max={100}
          value={Math.round(scope.amplitude * 100)}
          onChange={(event) => setScope({ amplitude: Number(event.target.value) / 100 })}
        />
      </div>
      <Segmented
        label="Display"
        options={[
          { value: "time", label: "Time" },
          { value: "xy", label: "X–Y" },
        ]}
        value={scope.mode}
        onChange={(mode) => setScope({ mode })}
      />
      {scope.mode === "xy" && (
        <div className={styles.control} role="group" aria-label="Ratio between the two axes">
          <span className={styles.controlLabel}>Ratio between the axes</span>
          <div className={styles.segmented}>
            {RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                aria-pressed={scope.ratioLabel === ratio.label}
                title={ratio.name}
                onClick={() => setScope({ ratio: ratio.value, ratioLabel: ratio.label })}
              >
                {ratio.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            Whole-number ratios close into a figure. The notes of the chord are such ratios: G over C is
            3:2, E over C is 5:4.
          </p>
        </div>
      )}
      <div className={styles.control} role="group" aria-label="Tune to a room">
        <span className={styles.controlLabel}>Tune to a room</span>
        <div className={styles.segmented}>
          {channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              aria-pressed={Math.abs(scope.frequency - channel.frequency) < 0.01}
              onClick={() => setScope({ frequency: channel.frequency })}
            >
              {channel.note}
            </button>
          ))}
        </div>
      </div>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={scope.output && soundEnabled}
          disabled={!soundEnabled}
          onChange={(event) => setScope({ output: event.target.checked })}
        />
        Send to the speaker
        {!soundEnabled && <span className={styles.hint}> Switch sound on first.</span>}
      </label>
      <p className={styles.footnote}>
        Artistic simulation. The trace is computed from these settings, not measured from any signal.
      </p>
    </div>
  );
}

/* ----------------------------------------------------------- resonance plate */

export function PlatePanel({ plate, setPlate, soundEnabled, onScatter, patched, cymatics }) {
  const mode = chladniModeAt(plate.frequency);
  const index = CHLADNI_MODES.findIndex((entry) => entry.m === mode.m && entry.n === mode.n);
  const jump = (delta) => {
    const next = CHLADNI_MODES[Math.min(Math.max(index + delta, 0), CHLADNI_MODES.length - 1)];
    setPlate({ frequency: next.frequency });
  };
  return (
    <div className={styles.instrument}>
      <p className={styles.panelLede}>
        An aluminium plate on a driver, with sand on it. Drive it at one of its modes and the sand
        leaves the parts that move and gathers on the lines that stay still.
      </p>
      <LogSlider
        id="plate-frequency"
        label="Driving frequency"
        value={plate.frequency}
        min={CHLADNI_RANGE[0] * 0.9}
        max={CHLADNI_RANGE[1]}
        format={hz}
        onChange={(frequency) => setPlate({ frequency })}
      />
      <div className={styles.readout} aria-live="polite">
        <span>
          Mode ({mode.m}, {mode.n}) at {hz(mode.frequency)}
        </span>
        <span className={styles.meter} aria-hidden="true">
          <span style={{ transform: `scaleX(${mode.resonance.toFixed(3)})` }} />
        </span>
        <span>{mode.resonance > 0.6 ? "On resonance" : mode.resonance > 0.15 ? "Near resonance" : "Off resonance: the sand barely moves"}</span>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" onClick={() => jump(-1)} disabled={index <= 0}>
          ← Lower mode
        </button>
        <button type="button" onClick={() => jump(1)} disabled={index >= CHLADNI_MODES.length - 1}>
          Higher mode →
        </button>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.primarySmall} aria-pressed={plate.drive} onClick={() => setPlate({ drive: !plate.drive })}>
          {plate.drive ? "Stop driving" : "Drive the plate"}
        </button>
        <button type="button" onClick={onScatter}>
          Scatter the sand
        </button>
      </div>
      {patched && (
        <p className={styles.hint}>
          The patch cable is in: notes played on the synthesizer drive this plate too.
        </p>
      )}
      {plate.drive && !soundEnabled && <p className={styles.hint}>Driving silently. Switch sound on to hear the tone.</p>}
      <p className={styles.footnote}>
        Model, not measurement: the textbook pattern for an idealised free square plate,
        cos(nπx)cos(mπy) − cos(mπx)cos(nπy), with frequencies scaled for display. Real plates differ.
        {cymatics && (
          <>
            {" "}
            The live version is <ExternalLink href={cymatics.href}>Cymatics</ExternalLink>.
          </>
        )}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- synthesizer */

export function SynthPanel({ channels, params, setParams, held, onNoteOn, onNoteOff, soundEnabled, patched }) {
  const { keys, whiteCount } = createKeyboard(channels);
  const dragging = useRef(null);
  const heldRef = useRef(held);
  heldRef.current = held;

  // The computer keyboard plays two octaves while the synth is open.
  useEffect(() => {
    const down = new Set();
    const onKeyDown = (event) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) && event.target.type !== "range") return;
      const midi = KEY_BINDINGS[event.key.toLowerCase()];
      if (midi === undefined) return;
      event.preventDefault();
      down.add(midi);
      onNoteOn(midi);
    };
    const onKeyUp = (event) => {
      const midi = KEY_BINDINGS[event.key.toLowerCase()];
      if (midi === undefined || !down.has(midi)) return;
      down.delete(midi);
      onNoteOff(midi);
    };
    const releaseAll = () => {
      down.forEach((midi) => onNoteOff(midi));
      down.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
      releaseAll();
    };
  }, [onNoteOn, onNoteOff]);

  const press = (midi) => {
    if (dragging.current !== null && dragging.current !== midi) onNoteOff(dragging.current);
    dragging.current = midi;
    onNoteOn(midi);
  };
  const lift = () => {
    if (dragging.current !== null) onNoteOff(dragging.current);
    dragging.current = null;
  };

  return (
    <div className={styles.instrument}>
      <p className={styles.panelLede}>
        Two octaves, C3 to C5. The five keys marked in mint are the five rooms. Play them together and
        the room plays its chord back.
      </p>
      <div className={styles.keyboard} style={{ "--white-count": whiteCount }} onPointerUp={lift} onPointerLeave={lift}>
        {keys.map((key) => (
          <button
            key={key.midi}
            type="button"
            className={key.black ? styles.keyBlack : styles.keyWhite}
            style={{ "--slot": key.slot }}
            data-channel={key.channel || undefined}
            aria-pressed={held.includes(key.midi)}
            aria-label={`${key.name}${key.channelTitle ? `, the ${key.channelTitle} note` : ""}${key.binding ? `, key ${key.binding.toUpperCase()}` : ""}`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              press(key.midi);
            }}
            onPointerEnter={(event) => {
              if (event.buttons && dragging.current !== null) press(key.midi);
            }}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
                event.preventDefault();
                onNoteOn(key.midi);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === "Enter" || event.key === " ") onNoteOff(key.midi);
            }}
          >
            {!key.black && key.binding && <span className={styles.keyBinding}>{key.binding.toUpperCase()}</span>}
            {key.channel && <span className={styles.keyNote}>{key.name}</span>}
          </button>
        ))}
      </div>
      <p className={styles.readout} aria-live="polite">
        {held.length ? held.map(midiToName).join(" · ") : "Play from the computer keyboard (Z to M, Q to I) or with the pointer."}
      </p>
      <Segmented label="Waveform" options={SHAPES} value={params.shape} onChange={(shape) => setParams({ shape })} />
      <LogSlider
        id="synth-attack"
        label="Attack"
        value={params.attack}
        min={SYNTH_LIMITS.attack[0]}
        max={SYNTH_LIMITS.attack[1]}
        format={(value) => `${Math.round(value * 1000)} ms`}
        onChange={(attack) => setParams({ attack })}
      />
      <LogSlider
        id="synth-release"
        label="Release"
        value={params.release}
        min={SYNTH_LIMITS.release[0]}
        max={SYNTH_LIMITS.release[1]}
        format={(value) => `${value.toFixed(2)} s`}
        onChange={(release) => setParams({ release })}
      />
      <div className={styles.control}>
        <label htmlFor="synth-brightness">
          Tone <output htmlFor="synth-brightness">{Math.round(params.brightness * 100)}%</output>
        </label>
        <input
          id="synth-brightness"
          type="range"
          min={5}
          max={100}
          value={Math.round(params.brightness * 100)}
          onChange={(event) => setParams({ brightness: Number(event.target.value) / 100 })}
        />
      </div>
      {!soundEnabled && <p className={styles.hint}>Silent until you switch sound on. The room still answers what you play.</p>}
      {patched && <p className={styles.hint}>Patched: what you play here also drives the resonance plate on the Workbench.</p>}
    </div>
  );
}

/* -------------------------------------------------------------------- record */

export function RecordPanel({ artifact, work, recording }) {
  const progress = recording.duration ? Math.min(recording.time / recording.duration, 1) : 0;
  const bars = artifact.peaks;
  const width = bars.length * 4;
  return (
    <div className={styles.instrument}>
      <p className={styles.panelLede}>{work.body}</p>
      <svg className={styles.wave} viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" aria-hidden="true">
        {bars.map((peak, index) => {
          const height = Math.max(3, peak * 92);
          return (
            <rect
              key={index}
              x={index * 4 + 0.6}
              y={50 - height / 2}
              width="2.4"
              height={height}
              data-played={index / bars.length < progress ? "true" : "false"}
            />
          );
        })}
      </svg>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.primarySmall}
          onClick={recording.toggle}
          aria-pressed={recording.playing}
          disabled={recording.failed}
        >
          <span aria-hidden="true">{recording.playing ? "❚❚ " : "▶ "}</span>
          {recording.failed ? "Recording unavailable" : recording.playing ? "Pause" : `Listen, ${artifact.duration} seconds`}
        </button>
        <span className={styles.meta}>{artifact.credit}</span>
      </div>
      <p className={styles.footnote}>
        A {artifact.duration}-second excerpt, written and owned by Christopher Woodyard. It plays only when
        you ask, and the instruments fall quiet while it does.
      </p>
      <ul className={styles.evidence}>
        {work.evidence.map((entry) => (
          <li key={entry.href}>
            <ExternalLink href={entry.href}>{entry.label}</ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function useHoldButton(onStart, onEnd) {
  const [holding, setHolding] = useState(false);
  const start = () => {
    if (holding) return;
    setHolding(true);
    onStart();
  };
  const end = () => {
    if (!holding) return;
    setHolding(false);
    onEnd();
  };
  return {
    holding,
    props: {
      onPointerDown: (event) => {
        event.preventDefault();
        start();
      },
      onPointerUp: end,
      onPointerLeave: end,
      onPointerCancel: end,
      onKeyDown: (event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          start();
        }
      },
      onKeyUp: (event) => {
        if (event.key === "Enter" || event.key === " ") end();
      },
      onBlur: end,
    },
  };
}

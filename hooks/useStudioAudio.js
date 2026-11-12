import { useCallback, useEffect, useRef, useState } from "react";
import signalExperience from "../lib/signalExperience";
import instruments from "../lib/studio/instruments";

// The studio's sound, under the same contract as the home page: every visit
// starts silent, no AudioContext exists until the visitor asks for sound, and
// nothing in the studio needs sound to work. Chords are voiced and capped by
// lib/signalExperience.js; the synthesizer's level by lib/studio/instruments.js.

const { RELEASE_SECONDS, createChordVoicing, createStrum } = signalExperience;
const { brightnessToCutoff, midiToFrequency, voiceLevel } = instruments;

const GENERATOR_LEVEL = 0.07;
const DRIVE_LEVEL = 0.05;

const safeStop = (node, when) => {
  try {
    node.stop(when);
  } catch {
    // Already stopped.
  }
};

const fadeOut = (context, gain, nodes, seconds = RELEASE_SECONDS) => {
  const now = context.currentTime;
  try {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + seconds);
  } catch {
    // The context may be closing.
  }
  nodes.forEach((node) => safeStop(node, now + seconds + 0.02));
};

export default function useStudioAudio() {
  const contextRef = useRef(null);
  const masterRef = useRef(null);
  const strumsRef = useRef(new Set());
  const voicesRef = useRef(new Map());
  const synthBusRef = useRef(null);
  const generatorRef = useRef(null);
  const driveRef = useRef(null);
  const recordingRef = useRef(new WeakMap());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(true);
  const enabledRef = useRef(false);
  enabledRef.current = soundEnabled;

  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      setSoundAvailable(false);
      return null;
    }
    try {
      const context = new AudioCtx();
      const master = context.createGain();
      master.gain.value = 1;
      master.connect(context.destination);
      const synthBus = context.createGain();
      synthBus.gain.value = voiceLevel(1);
      synthBus.connect(master);
      contextRef.current = context;
      masterRef.current = master;
      synthBusRef.current = synthBus;
      return context;
    } catch {
      setSoundAvailable(false);
      return null;
    }
  }, []);

  const live = () => (enabledRef.current ? contextRef.current : null);

  // A panner for sounds that come from somewhere in the room.
  const placeAt = (context, position) => {
    if (!position) return masterRef.current;
    const panner = context.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1.2;
    panner.rolloffFactor = 1.1;
    const [x, y, z] = position;
    if (panner.positionX) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else {
      panner.setPosition(x, y, z);
    }
    panner.connect(masterRef.current);
    return panner;
  };

  /* ------------------------------------------------------------ chords */

  // A chord rolled from its lowest note, held for a breath, left to ring.
  const strum = useCallback((frequencies, { position } = {}) => {
    const context = live();
    const voicing = createStrum(frequencies);
    if (!context || !voicing.voices.length) return;
    try {
      const gain = context.createGain();
      const now = context.currentTime;
      const peak = now + voicing.attack;
      const end = peak + voicing.hold + voicing.ring;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(voicing.level, peak);
      gain.gain.setValueAtTime(voicing.level, peak + voicing.hold);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      gain.connect(placeAt(context, position));
      const oscillators = voicing.voices.map((voice) => {
        const oscillator = context.createOscillator();
        const level = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(voice.frequency, now);
        level.gain.setValueAtTime(voice.gain, now);
        oscillator.connect(level);
        level.connect(gain);
        oscillator.start(now + voice.delay);
        oscillator.stop(end + 0.05);
        return oscillator;
      });
      const entry = { gain, oscillators };
      strumsRef.current.add(entry);
      oscillators[oscillators.length - 1].onended = () => strumsRef.current.delete(entry);
    } catch {
      setSoundAvailable(false);
    }
  }, []);

  // A room's note when the visitor walks in: one voice, from its pendant.
  const bell = useCallback((frequency, position) => strum([frequency], { position }), [strum]);

  const releaseStrums = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    strumsRef.current.forEach((entry) => fadeOut(context, entry.gain, entry.oscillators));
    strumsRef.current.clear();
  }, []);

  /* --------------------------------------------------------------- synth */

  const updateSynthBus = () => {
    const context = contextRef.current;
    const bus = synthBusRef.current;
    if (!context || !bus) return;
    const level = voiceLevel(Math.max(voicesRef.current.size, 1));
    bus.gain.setTargetAtTime(level, context.currentTime, 0.015);
  };

  const noteOn = useCallback((midi, params) => {
    const context = live();
    if (!context || voicesRef.current.has(midi)) return;
    try {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      oscillator.type = params.shape;
      oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(brightnessToCutoff(params.brightness), 12000), now);
      filter.Q.value = 0.7;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + params.attack);
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(synthBusRef.current);
      oscillator.start(now);
      voicesRef.current.set(midi, { oscillator, envelope, release: params.release });
      updateSynthBus();
    } catch {
      setSoundAvailable(false);
    }
  }, []);

  const noteOff = useCallback((midi) => {
    const context = contextRef.current;
    const voice = voicesRef.current.get(midi);
    if (!context || !voice) return;
    voicesRef.current.delete(midi);
    fadeOut(context, voice.envelope, [voice.oscillator], voice.release);
    updateSynthBus();
  }, []);

  const allNotesOff = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    voicesRef.current.forEach((voice) => fadeOut(context, voice.envelope, [voice.oscillator]));
    voicesRef.current.clear();
    updateSynthBus();
  }, []);

  /* ------------------------------------------- generator and plate drive */

  // A sustained tone that follows its settings, used by the signal generator
  // and the resonance plate. `ref` holds { oscillator, gain }.
  const sustain = (ref, { on, frequency, shape = "sine", level, position }) => {
    const context = live();
    const current = ref.current;
    if (!on || !context) {
      if (current && contextRef.current) fadeOut(contextRef.current, current.gain, [current.oscillator]);
      ref.current = null;
      return;
    }
    try {
      const now = context.currentTime;
      if (!current) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(level, now + 0.08);
        oscillator.connect(gain);
        gain.connect(placeAt(context, position));
        oscillator.start(now);
        ref.current = { oscillator, gain };
        return;
      }
      current.oscillator.type = shape;
      current.oscillator.frequency.setTargetAtTime(frequency, now, 0.02);
      current.gain.gain.setTargetAtTime(level, now, 0.03);
    } catch {
      setSoundAvailable(false);
    }
  };

  const setGenerator = useCallback(({ on, frequency, shape, amplitude }) => {
    sustain(generatorRef, {
      on,
      frequency,
      shape,
      level: GENERATOR_LEVEL * Math.min(Math.max(amplitude ?? 1, 0), 1),
      position: [-9.5, 1.1, 2.4],
    });
  }, []);

  const setDrive = useCallback(({ on, frequency }) => {
    sustain(driveRef, { on, frequency, level: DRIVE_LEVEL, position: [-6.6, 1.0, 4.6] });
  }, []);

  // Resolve's strings: the mistuned note against its true pitch, so the
  // beating between them can be heard. Voiced and capped like any chord.
  const pluck = useCallback((frequency, reference) => {
    const context = live();
    if (!context) return;
    const voicing = createChordVoicing([frequency, reference]);
    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(voicing.level, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      gain.connect(masterRef.current);
      const oscillators = [frequency, reference].map((value) => {
        const oscillator = context.createOscillator();
        const level = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(value, now);
        level.gain.value = 0.5;
        oscillator.connect(level);
        level.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + 2.5);
        return oscillator;
      });
      const entry = { gain, oscillators };
      strumsRef.current.add(entry);
      oscillators[1].onended = () => strumsRef.current.delete(entry);
    } catch {
      setSoundAvailable(false);
    }
  }, []);

  /* ---------------------------------------------------------- recording */

  // Once sound is on, the record plays from the turntable: walk away and it
  // gets quieter. With sound off it plays as a plain element.
  const spatializeRecording = useCallback((element, position) => {
    const context = live();
    if (!context || !element || recordingRef.current.has(element)) return;
    try {
      const source = context.createMediaElementSource(element);
      source.connect(placeAt(context, position));
      recordingRef.current.set(element, source);
    } catch {
      // Already routed, or not allowed: it keeps playing as a plain element.
    }
  }, []);

  const setListener = useCallback(({ x, y, z, yaw }) => {
    const context = contextRef.current;
    if (!context) return;
    const listener = context.listener;
    const forward = [-Math.sin(yaw), 0, -Math.cos(yaw)];
    try {
      if (listener.positionX) {
        const now = context.currentTime;
        listener.positionX.setTargetAtTime(x, now, 0.05);
        listener.positionY.setTargetAtTime(y, now, 0.05);
        listener.positionZ.setTargetAtTime(z, now, 0.05);
        listener.forwardX.setTargetAtTime(forward[0], now, 0.05);
        listener.forwardY.setTargetAtTime(0, now, 0.05);
        listener.forwardZ.setTargetAtTime(forward[2], now, 0.05);
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      } else {
        listener.setPosition(x, y, z);
        listener.setOrientation(forward[0], 0, forward[2], 0, 1, 0);
      }
    } catch {
      // Spatial audio is a refinement; the sound still plays without it.
    }
  }, []);

  /* --------------------------------------------------------- the switch */

  const stopAll = useCallback(() => {
    releaseStrums();
    allNotesOff();
    sustain(generatorRef, { on: false });
    sustain(driveRef, { on: false });
  }, [releaseStrums, allNotesOff]);

  const enableSound = useCallback(async () => {
    const context = ensureContext();
    if (!context) return false;
    try {
      await context.resume();
      enabledRef.current = true;
      setSoundEnabled(true);
      return true;
    } catch {
      setSoundAvailable(false);
      return false;
    }
  }, [ensureContext]);

  const toggleSound = useCallback(async () => {
    if (enabledRef.current) {
      stopAll();
      enabledRef.current = false;
      setSoundEnabled(false);
      return false;
    }
    return enableSound();
  }, [enableSound, stopAll]);

  useEffect(
    () => () => {
      try {
        stopAll();
        contextRef.current?.close().catch(() => {});
      } catch {
        // Safe disposal.
      }
      contextRef.current = null;
    },
    [stopAll]
  );

  return {
    soundEnabled,
    soundAvailable,
    enableSound,
    toggleSound,
    stopAll,
    strum,
    bell,
    releaseStrums,
    noteOn,
    noteOff,
    allNotesOff,
    setGenerator,
    setDrive,
    pluck,
    spatializeRecording,
    setListener,
  };
}

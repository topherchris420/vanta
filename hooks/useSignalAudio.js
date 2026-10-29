import { useCallback, useEffect, useRef, useState } from "react";
import signalExperience from "../lib/signalExperience";

const { SOUND_PREF_KEY, RELEASE_SECONDS, createChordVoicing, createStrum } =
  signalExperience;

// Ramp a gain to silence and stop its oscillators once it gets there. Shared by
// the held sound and the strum, so every release sounds the same.
const release = (context, gain, voices) => {
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + RELEASE_SECONDS);
  voices.forEach((oscillator) => {
    try {
      oscillator.stop(now + RELEASE_SECONDS + 0.02);
    } catch {
      // Already stopped on its own schedule.
    }
  });
};

// Start one sine voice per note of a voicing, rolled into a shared gain.
const startVoices = (context, voicing, gain, now) =>
  voicing.voices.map((voice) => {
    const oscillator = context.createOscillator();
    const level = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(voice.frequency, now);
    level.gain.setValueAtTime(voice.gain, now);
    oscillator.connect(level);
    level.connect(gain);
    oscillator.start(now + voice.delay);
    return oscillator;
  });

export default function useSignalAudio() {
  const contextRef = useRef(null);
  // Every sounding oscillator shares one gain, so a single note and a chord
  // release through exactly the same envelope.
  const voicesRef = useRef([]);
  const gainRef = useRef(null);
  // The strum rings out on its own gain, but any change releases it too.
  const strumRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(true);

  const getContextFromGesture = useCallback(() => {
    if (typeof window === "undefined") {
      setSoundAvailable(false);
      return null;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;

      if (!AudioCtx) {
        setSoundAvailable(false);
        return null;
      }

      if (!contextRef.current) {
        contextRef.current = new AudioCtx();
      }
      return contextRef.current;
    } catch {
      setSoundAvailable(false);
      return null;
    }
  }, []);

  const stopFrequency = useCallback(() => {
    const context = contextRef.current;
    const voices = voicesRef.current;
    const gain = gainRef.current;
    const strum = strumRef.current;
    voicesRef.current = [];
    gainRef.current = null;
    strumRef.current = null;

    if (!context) return;

    try {
      if (gain && voices.length) release(context, gain, voices);
      if (strum) release(context, strum.gain, strum.voices);
    } catch {
      // Ignore audio stop errors
    }
  }, []);

  // One note or several, voiced by createChordVoicing.
  const playChord = useCallback(
    (frequencies) => {
      try {
        const context = contextRef.current;
        const voicing = createChordVoicing(frequencies);

        if (!soundEnabled || !context || !voicing.voices.length) return;

        stopFrequency();

        const gain = context.createGain();
        const now = context.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(voicing.level, now + voicing.attack);
        gain.connect(context.destination);

        voicesRef.current = startVoices(context, voicing, gain, now);
        gainRef.current = gain;
      } catch {
        setSoundAvailable(false);
        setSoundEnabled(false);
      }
    },
    [soundEnabled, stopFrequency]
  );

  const playFrequency = useCallback(
    (frequency) => playChord([frequency]),
    [playChord]
  );

  // The whole chord once, as the instrument's answer to being switched on. It
  // swells, holds for a breath, and rings out without being held.
  const strumChord = useCallback(
    (frequencies) => {
      try {
        const context = contextRef.current;
        const strum = createStrum(frequencies);

        if (!soundEnabled || !context || !strum.voices.length) return;

        stopFrequency();

        const gain = context.createGain();
        const now = context.currentTime;
        const peak = now + strum.attack;
        const end = peak + strum.hold + strum.ring;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(strum.level, peak);
        gain.gain.setValueAtTime(strum.level, peak + strum.hold);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        gain.connect(context.destination);

        const voices = startVoices(context, strum, gain, now);
        voices.forEach((oscillator) => oscillator.stop(end + 0.05));
        const entry = { gain, voices };
        voices[voices.length - 1].onended = () => {
          if (strumRef.current === entry) strumRef.current = null;
        };
        strumRef.current = entry;
      } catch {
        setSoundAvailable(false);
        setSoundEnabled(false);
      }
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
      try {
        if (contextRef.current && contextRef.current.state !== "closed") {
          contextRef.current.close().catch(() => {});
        }
      } catch {
        // Safe disposal
      } finally {
        contextRef.current = null;
      }
    },
    [stopFrequency]
  );

  return {
    soundEnabled,
    soundAvailable,
    enableSound,
    toggleSound,
    playFrequency,
    playChord,
    strumChord,
    stopFrequency,
  };
}

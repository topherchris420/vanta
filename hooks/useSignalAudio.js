import { useCallback, useEffect, useRef, useState } from "react";
import signalExperience from "../lib/signalExperience";

const { SOUND_PREF_KEY, RELEASE_SECONDS, createChordVoicing } = signalExperience;

export default function useSignalAudio() {
  const contextRef = useRef(null);
  // Every sounding oscillator shares one gain, so a single note and a chord
  // release through exactly the same envelope.
  const voicesRef = useRef([]);
  const gainRef = useRef(null);
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
    try {
      const context = contextRef.current;
      const voices = voicesRef.current;
      const gain = gainRef.current;

      if (!context || !voices.length || !gain) return;

      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + RELEASE_SECONDS);
      voices.forEach((oscillator) =>
        oscillator.stop(context.currentTime + RELEASE_SECONDS + 0.02)
      );
    } catch {
      // Ignore audio stop errors
    } finally {
      voicesRef.current = [];
      gainRef.current = null;
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

        voicesRef.current = voicing.voices.map((voice) => {
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
    stopFrequency,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import signalExperience from "../lib/signalExperience";

const { SOUND_PREF_KEY } = signalExperience;

export default function useSignalAudio() {
  const contextRef = useRef(null);
  const oscillatorRef = useRef(null);
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
      const oscillator = oscillatorRef.current;
      const gain = gainRef.current;

      if (!context || !oscillator || !gain) return;

      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.12);
      oscillator.stop(context.currentTime + 0.14);
    } catch {
      // Ignore audio stop errors
    } finally {
      oscillatorRef.current = null;
      gainRef.current = null;
    }
  }, []);

  const playFrequency = useCallback(
    (frequency) => {
      try {
        const context = contextRef.current;

        if (!soundEnabled || !context || !Number.isFinite(frequency)) return;

        stopFrequency();

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.09, context.currentTime + 0.08);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillatorRef.current = oscillator;
        gainRef.current = gain;
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
    stopFrequency,
  };
}

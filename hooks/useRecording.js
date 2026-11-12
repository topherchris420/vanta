import { useCallback, useEffect, useRef, useState } from "react";

// The one recording in the studio, shared by the turntable and the computer's
// music player. It never preloads and never autoplays: it plays when asked.
export default function useRecording(artifact) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch {
      setFailed(true);
    }
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const element = (
    <audio
      ref={audioRef}
      src={artifact.src}
      preload="none"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => {
        setPlaying(false);
        setTime(artifact.duration);
      }}
      onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
      onError={() => setFailed(true)}
    />
  );

  return { audioRef, element, playing, time, duration: artifact.duration, failed, toggle, pause };
}

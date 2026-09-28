import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

// Each channel shows one real artifact, in the form its medium asks for:
// language for writing, signals for instruments, a frame for worlds, paint
// and pattern for art, and a recording for music.

function Recording({ artifact, onPlaybackChange }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onPlaybackChange?.(playing);
  }, [playing, onPlaybackChange]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  const toggle = async () => {
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
  };

  const bars = artifact.peaks;
  const width = bars.length * 4;

  return (
    <div className={styles.artifactRecording}>
      <audio
        ref={audioRef}
        src={artifact.src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(1);
        }}
        onTimeUpdate={(event) => {
          const { currentTime, duration } = event.currentTarget;
          if (duration) setProgress(currentTime / duration);
        }}
        onError={() => setFailed(true)}
      />
      <svg
        className={styles.recordingWave}
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ "--progress": progress }}
      >
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
      <div className={styles.recordingControls}>
        <button
          type="button"
          className={styles.recordingButton}
          onClick={toggle}
          aria-pressed={playing}
          disabled={failed}
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          {failed
            ? "Recording unavailable"
            : playing
              ? "Pause"
              : `Listen, ${artifact.duration} seconds`}
        </button>
        <span className={styles.recordingCredit}>{artifact.credit}</span>
      </div>
    </div>
  );
}

function Figure({ panel, href }) {
  const image = (
    <img
      src={panel.src}
      width={panel.width}
      height={panel.height}
      alt={panel.alt}
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <figure className={styles.artifactFigure}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${panel.alt} (source, opens in new tab)`}>
          {image}
        </a>
      ) : (
        image
      )}
      <figcaption>{panel.caption}</figcaption>
    </figure>
  );
}

export default function ChannelArtifact({
  channel,
  statusLabel,
  frequencyLabel,
  onPlaybackChange,
}) {
  const { artifact } = channel;

  return (
    <div
      className={styles.channelArtifact}
      data-artifact={channel.visual}
      data-kind={artifact.kind}
    >
      <span className={styles.channelScan} aria-hidden="true" />
      <div className={styles.artifactBody}>
        {artifact.kind === "quote" && (
          <blockquote className={styles.artifactQuote}>
            <p>{artifact.text}</p>
            <footer>
              <a href={artifact.href} target="_blank" rel="noopener noreferrer">
                {artifact.source} <span aria-hidden="true">↗</span>
              </a>
            </footer>
          </blockquote>
        )}
        {artifact.kind === "figure" && (
          <Figure panel={artifact} href={artifact.href} />
        )}
        {artifact.kind === "gallery" && (
          <div className={styles.artifactGallery}>
            {artifact.panels.map((panel) => (
              <Figure key={panel.src} panel={panel} href={panel.href} />
            ))}
          </div>
        )}
        {artifact.kind === "recording" && (
          <Recording artifact={artifact} onPlaybackChange={onPlaybackChange} />
        )}
      </div>
      <span className={styles.channelStatus} aria-hidden="true">
        {frequencyLabel.toUpperCase()} / {statusLabel}
      </span>
    </div>
  );
}

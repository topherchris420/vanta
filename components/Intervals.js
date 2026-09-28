import Reveal from "./Reveal";
import styles from "../styles/Home.module.css";

// The chord, stated once. Each thread is a question that recurs across
// channels; tuning it lights those channels together on the rail and, with
// sound on, plays their notes as one chord. Hover and focus preview; a click
// holds the chord until it is released.
export default function Intervals({
  threads,
  works,
  channels,
  epigraph,
  heldThreadId,
  threadChannels,
  onPreview,
  onPreviewEnd,
  onToggleHold,
}) {
  const worksById = new Map(works.map((work) => [work.id, work]));

  // The section is a rest zone for the scroll tuner: between channels the
  // instrument is quiet, and only a tuned thread sounds here.
  return (
    <Reveal
      as="section"
      id="intervals"
      className={styles.intervals}
      aria-labelledby="intervals-title"
      data-signal-channel="rest"
    >
      <div className={styles.intervalsIntro}>
        <p className={styles.instrumentLabel}>Intervals</p>
        <h2 id="intervals-title">Same question, another instrument.</h2>
        <blockquote className={styles.epigraph}>
          <p>{epigraph.text}</p>
          <footer>
            <a href={epigraph.href} target="_blank" rel="noopener noreferrer">
              {epigraph.source} <span aria-hidden="true">↗</span>
            </a>
          </footer>
        </blockquote>
      </div>
      <ol className={styles.intervalList}>
        {threads.map((thread) => {
          const notes = channels.filter((channel) =>
            threadChannels(thread).includes(channel.id)
          );
          const held = heldThreadId === thread.id;
          return (
            <li
              key={thread.id}
              id={`interval-${thread.id}`}
              className={styles.interval}
              data-held={held ? "true" : "false"}
            >
              <button
                type="button"
                className={styles.intervalTune}
                aria-pressed={held}
                aria-describedby={`interval-notes-${thread.id}`}
                onMouseEnter={() => onPreview(thread.id)}
                onMouseLeave={onPreviewEnd}
                onFocus={() => onPreview(thread.id)}
                onBlur={onPreviewEnd}
                onClick={() => onToggleHold(thread.id)}
              >
                <span className={styles.intervalName}>{thread.name}</span>
                <span className={styles.intervalQuestion}>{thread.question}</span>
                <span
                  id={`interval-notes-${thread.id}`}
                  className={styles.intervalNotes}
                >
                  <span className={styles.visuallyHidden}>Spans </span>
                  {notes.map((channel) => `${channel.note} ${channel.title}`).join(" · ")}
                </span>
              </button>
              <p className={styles.intervalWorks}>
                {thread.works.map((id, index) => {
                  const work = worksById.get(id);
                  return (
                    <span key={id}>
                      {index > 0 && <span aria-hidden="true"> · </span>}
                      <a href={`#work-${id}`}>{work.title}</a>
                    </span>
                  );
                })}
              </p>
              {thread.coda && <p className={styles.intervalCoda}>{thread.coda}</p>}
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}

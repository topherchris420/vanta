import signalExperience from "../lib/signalExperience";
import ChannelArtifact from "./ChannelArtifact";
import Reveal from "./Reveal";
import styles from "../styles/Home.module.css";

const { createProjectChannelView, didFocusLeaveChannel } = signalExperience;

function Work({ work, channelsById, threads }) {
  const echoes = (work.alsoIn || []).map((id) => channelsById.get(id)).filter(Boolean);

  return (
    <li id={`work-${work.id}`} className={styles.work}>
      <div className={styles.workHead}>
        <h3>{work.title}</h3>
        {work.year && <span className={styles.workYear}>{work.year}</span>}
        <span className={styles.workStatus}>
          <span className={styles.visuallyHidden}>Status: </span>
          {work.status.join(" · ")}
        </span>
      </div>
      {work.question && <p className={styles.workQuestion}>{work.question}</p>}
      <p className={styles.workBody}>{work.body}</p>
      {work.detail && (
        <p
          className={
            work.detailKind === "trace" ? styles.workTrace : styles.workDetail
          }
        >
          {work.detail}
        </p>
      )}
      <div className={styles.channelLinks}>
        {work.evidence.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${work.title}: ${link.label} (opens in new tab)`}
          >
            {link.label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      {(echoes.length > 0 || threads.length > 0) && (
        <p className={styles.workEchoes}>
          {echoes.length > 0 && (
            <>
              <span>Also sounds in </span>
              {echoes.map((channel, index) => (
                <span key={channel.id}>
                  {index > 0 && " · "}
                  <a href={`#signal-${channel.id}`}>
                    {channel.number} {channel.title}
                  </a>
                </span>
              ))}
            </>
          )}
          {echoes.length > 0 && threads.length > 0 && (
            <span aria-hidden="true"> / </span>
          )}
          {threads.length > 0 && (
            <>
              <span>Carries </span>
              {threads.map((thread, index) => (
                <span key={thread.id}>
                  {index > 0 && " · "}
                  <a href={`#interval-${thread.id}`}>{thread.name}</a>
                </span>
              ))}
            </>
          )}
        </p>
      )}
    </li>
  );
}

export default function ProjectChannel({
  project,
  index,
  active,
  works,
  channelsById,
  threadsForWork,
  onPreview,
  onPreviewEnd,
  onPlaybackChange,
}) {
  const view = createProjectChannelView(project, index, active);
  const className = [
    styles.projectChannel,
    view.direction === "reverse" ? styles.projectChannelReverse : "",
    view.active ? styles.projectChannelActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const preview = () => onPreview(project.id);
  const endPreviewAfterFocusExit = (event) => {
    if (didFocusLeaveChannel(event.currentTarget, event.relatedTarget)) {
      onPreviewEnd();
    }
  };

  return (
    <Reveal
      as="section"
      id={view.sectionId}
      className={className}
      aria-labelledby={view.headingId}
      data-signal-channel={project.id}
      data-active={view.active ? "true" : "false"}
      style={{ "--title-em": view.titleEm }}
      onMouseEnter={preview}
      onMouseLeave={onPreviewEnd}
      onFocusCapture={preview}
      onBlurCapture={endPreviewAfterFocusExit}
    >
      <div className={styles.channelMeta}>
        <span>
          {project.number} / {project.note}
        </span>
        <span>{view.frequencyLabel}</span>
      </div>
      <div className={styles.channelCopy}>
        <h2 id={view.headingId}>{project.title}</h2>
        <p className={styles.channelLede}>{project.lede}</p>
        <ol className={styles.workList}>
          {works.map((work) => (
            <Work
              key={work.id}
              work={work}
              channelsById={channelsById}
              threads={threadsForWork(work.id)}
            />
          ))}
        </ol>
      </div>
      <ChannelArtifact
        channel={project}
        statusLabel={view.statusLabel}
        frequencyLabel={view.frequencyLabel}
        onPlaybackChange={onPlaybackChange}
      />
    </Reveal>
  );
}

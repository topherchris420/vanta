import signalExperience from "../lib/signalExperience";
import Reveal from "./Reveal";
import styles from "../styles/Home.module.css";

const { createProjectChannelView } = signalExperience;

export default function ProjectChannel({
  project,
  index,
  active,
  onPreview,
  onPreviewEnd,
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

  return (
    <Reveal
      as="section"
      id={view.sectionId}
      className={className}
      aria-labelledby={view.headingId}
      data-signal-channel={project.id}
      data-active={view.active ? "true" : "false"}
      onMouseEnter={preview}
      onMouseLeave={onPreviewEnd}
      onFocusCapture={preview}
      onBlurCapture={onPreviewEnd}
    >
      <div className={styles.channelMeta}>
        <span>
          {project.number} / {project.note}
        </span>
        <span>{view.frequencyLabel}</span>
      </div>
      <div className={styles.channelCopy}>
        <h2 id={view.headingId}>{project.title}</h2>
        <p>{project.description}</p>
        <div className={styles.channelLinks}>
          {view.evidenceLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
      <div
        className={styles.channelArtifact}
        data-artifact={project.visual}
        aria-hidden="true"
      >
        <span>{view.frequencyLabel.toUpperCase()} / SIGNAL ACTIVE</span>
      </div>
    </Reveal>
  );
}

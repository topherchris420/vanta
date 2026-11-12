import styles from "../../styles/Studio.module.css";
import { ExternalLink } from "./Prose";

// One work, the way the home page states it: the question first, what
// happened to it, the body, and every receipt. Nothing is added here.
export default function WorkDetail({ work, content, onFind, headingLevel = 3, compact = false }) {
  const channel = content.channelsById[work.channel];
  const threads = (content.threadsForWorkId[work.id] || []).map((id) =>
    content.threads.find((thread) => thread.id === id)
  );
  const Heading = `h${headingLevel}`;
  return (
    <article className={styles.work} aria-labelledby={`work-title-${work.id}`}>
      <p className={styles.eyebrow}>
        {channel.number} {channel.title} · {channel.note}
        {work.year ? ` · ${work.year}` : ""}
      </p>
      <Heading id={`work-title-${work.id}`} className={styles.workTitle}>
        {work.title}
      </Heading>
      <p className={styles.status}>{work.status.join(" · ")}</p>
      {work.question && <p className={styles.question}>{work.question}</p>}
      <p className={styles.body}>{work.body}</p>
      {work.detail && (
        <p className={work.detailKind === "trace" ? styles.trace : styles.detail}>{work.detail}</p>
      )}
      <ul className={styles.evidence} aria-label={`Receipts for ${work.title}`}>
        {work.evidence.map((entry) => (
          <li key={entry.href}>
            <ExternalLink href={entry.href}>{entry.label}</ExternalLink>
          </li>
        ))}
        {work.atlas && (
          <li>
            <a href={`/research?q=${encodeURIComponent(work.atlas)}`}>In the research atlas</a>
          </li>
        )}
        <li>
          <a href={`/#work-${work.id}`}>On the portfolio page</a>
        </li>
      </ul>
      {!compact && work.alsoIn && (
        <p className={styles.meta}>
          Also sounds in{" "}
          {work.alsoIn.map((id) => content.channelsById[id].title).join(" and ")}.
        </p>
      )}
      {!compact && threads.length > 0 && (
        <p className={styles.meta}>Carries {threads.map((thread) => thread.name).join(", ")}.</p>
      )}
      {onFind && content.objectForWork[work.id] && (
        <button type="button" className={styles.textButton} onClick={() => onFind(content.objectForWork[work.id])}>
          Find it in the studio
        </button>
      )}
    </article>
  );
}

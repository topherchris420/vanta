import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

const { createFrequencyRailItems } = signalExperience;

export default function FrequencyRail({
  channels,
  activeId,
  onPreview,
  onPreviewEnd,
}) {
  const items = createFrequencyRailItems(channels, activeId);

  return (
    <nav className={styles.frequencyRail} aria-label="Signal channels">
      <ol className={styles.frequencyRailList}>
        {items.map((item) => {
          const handlePreview = item.previewId
            ? () => onPreview(item.previewId)
            : undefined;

          return (
            <li key={item.id} className={styles.frequencyRailItem}>
              <a
                href={item.href}
                className={styles.frequencyRailLink}
                aria-current={item.current}
                onMouseEnter={handlePreview}
                onMouseLeave={onPreviewEnd}
                onFocus={handlePreview}
                onBlur={onPreviewEnd}
              >
                <span>{item.number}</span>
                <span className={styles.frequencyRailLabel}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

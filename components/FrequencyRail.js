import { useRef } from "react";
import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

const { createFrequencyRailItems, resolveRailKeyIndex } = signalExperience;

export default function FrequencyRail({
  channels,
  activeId,
  onPreview,
  onPreviewEnd,
}) {
  const items = createFrequencyRailItems(channels, activeId);
  const linkRefs = useRef([]);

  // Arrow keys move focus along the rail like a tuner dial; focus already
  // drives the preview, so tuning by keyboard previews exactly like hovering.
  const tune = (event) => {
    const index = linkRefs.current.indexOf(event.target);
    const nextIndex = resolveRailKeyIndex({
      key: event.key,
      index,
      count: items.length,
    });

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    linkRefs.current[nextIndex]?.focus();
  };

  return (
    <nav
      className={styles.frequencyRail}
      aria-label="Signal channels"
      aria-describedby="frequency-rail-hint"
    >
      <p id="frequency-rail-hint" className={styles.visuallyHidden}>
        Use the arrow keys to tune between channels.
      </p>
      <ol className={styles.frequencyRailList} onKeyDown={tune}>
        {items.map((item, index) => {
          const handlePreview = item.previewId
            ? () => onPreview(item.previewId)
            : undefined;

          return (
            <li key={item.id} className={styles.frequencyRailItem}>
              <a
                ref={(node) => {
                  linkRefs.current[index] = node;
                }}
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

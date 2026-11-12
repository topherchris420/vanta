import { useEffect, useRef } from "react";
import styles from "../../styles/Studio.module.css";

export default function TourCard({ stop, index, count, onPrevious, onNext, onEnd }) {
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);
  return (
    <section className={styles.tour} aria-labelledby="tour-title" aria-live="polite">
      <p className={styles.eyebrow}>
        Guided tour · {index + 1} of {count}
      </p>
      <h2 id="tour-title" ref={headingRef} tabIndex={-1}>
        {stop.title}
      </h2>
      <p>{stop.text}</p>
      <div className={styles.buttonRow}>
        <button type="button" onClick={onPrevious} disabled={index === 0}>
          <span aria-hidden="true">←</span> Back
        </button>
        {index < count - 1 ? (
          <button type="button" className={styles.primarySmall} onClick={onNext}>
            Next <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" className={styles.primarySmall} onClick={onEnd}>
            Explore on your own
          </button>
        )}
        <button type="button" className={styles.textButton} onClick={onEnd}>
          End the tour
        </button>
      </div>
    </section>
  );
}

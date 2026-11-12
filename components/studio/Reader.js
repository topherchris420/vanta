import { useEffect, useRef, useState } from "react";
import styles from "../../styles/Studio.module.css";
import { Blocks, ExternalLink } from "./Prose";

// A paged reader for the Library's volumes. Pages turn with the buttons or
// with the arrow keys while the reader has focus; the text column is set for
// reading, not for scanning.
export default function Reader({ volume, headingLevel = 3 }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const pageRef = useRef(null);
  const count = volume.pages.length;
  const Heading = `h${headingLevel}`;

  useEffect(() => {
    setPage(0);
  }, [volume.id]);

  const turn = (delta) => {
    const next = Math.min(Math.max(page + delta, 0), count - 1);
    if (next === page) return;
    setDirection(delta);
    setPage(next);
    pageRef.current?.scrollTo?.({ top: 0 });
  };

  const onKeyDown = (event) => {
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      turn(1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      turn(-1);
    }
  };

  const current = volume.pages[page];
  return (
    <div className={styles.reader} onKeyDown={onKeyDown}>
      <header className={styles.readerHeader}>
        <p className={styles.eyebrow}>{volume.byline}</p>
        <Heading className={styles.readerTitle}>{volume.title}</Heading>
        <p className={styles.provenance}>{volume.provenance}</p>
      </header>
      <div
        ref={pageRef}
        className={styles.readerPage}
        data-direction={direction > 0 ? "next" : direction < 0 ? "previous" : "none"}
        key={`${volume.id}-${page}`}
        tabIndex={0}
        aria-label={`Page ${page + 1} of ${count}${current.title ? `: ${current.title}` : ""}`}
      >
        <Blocks blocks={current.blocks} headingBase={headingLevel + 1} />
      </div>
      <nav className={styles.readerNav} aria-label="Pages">
        <button type="button" onClick={() => turn(-1)} disabled={page === 0}>
          <span aria-hidden="true">←</span> Previous
        </button>
        <span className={styles.readerCount} aria-live="polite">
          {page + 1} / {count}
        </span>
        <button type="button" onClick={() => turn(1)} disabled={page === count - 1}>
          Next <span aria-hidden="true">→</span>
        </button>
      </nav>
      <p className={styles.readerSource}>
        <ExternalLink href={volume.source.href}>{volume.source.label}</ExternalLink>
      </p>
    </div>
  );
}

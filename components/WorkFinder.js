import { useEffect, useRef, useState } from "react";
import practice from "../data/practice";
import styles from "../styles/WorkFinder.module.css";

const entries = practice.channels.flatMap((channel) =>
  channel.works.map((id) => ({
    ...practice.works.find((work) => work.id === id),
    channel: channel.title,
    number: channel.number,
  })),
);

export default function WorkFinder() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = entries.filter((work) => {
    const text = [
      work.title,
      work.channel,
      work.question,
      work.body,
      ...work.status,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });

  useEffect(() => {
    const shortcut = (event) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.target.closest?.(
          "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
        ) ||
        document.querySelector("dialog[open]")
      )
        return;
      if (
        (event.key === "/" && !event.metaKey && !event.ctrlKey) ||
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const goToWork = (event, id) => {
    // Preserve ordinary link behaviour for new tabs and modified clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    close();
    // Let native anchor navigation run, then move keyboard focus to the work.
    window.requestAnimationFrame(() => {
      document.getElementById(`work-${id}`)?.focus({ preventScroll: true });
    });
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="/ Control+k Meta+k"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Find work</span>
        <kbd aria-hidden="true">/</kbd>
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="finder-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <header className={styles.header}>
          <div>
            <p>Vanta / Work index</p>
            <h2 id="finder-title">Find your way in.</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close work finder">
            ×
          </button>
        </header>
        <div className={styles.search}>
          <label htmlFor="work-search">
            Search by title, medium, or question
          </label>
          <input
            ref={inputRef}
            id="work-search"
            type="search"
            placeholder="Try music, CIRCLE, or physics…"
            maxLength={160}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                dialogRef.current.querySelector("[data-work-result]")?.focus();
              }
            }}
          />
          <p role="status" aria-live="polite">
            {results.length} {results.length === 1 ? "work" : "works"}
            {query.trim() ? " found" : " across five instruments"}
          </p>
        </div>
        <nav className={styles.results} aria-label="Matching works">
          {results.map((work) => (
            <a
              key={work.id}
              href={`#work-${work.id}`}
              data-work-result=""
              onClick={(event) => goToWork(event, work.id)}
            >
              <span className={styles.number}>{work.number}</span>
              <span>
                <strong>{work.title}</strong>
                <small>
                  {work.channel} · {work.status.join(" / ")}
                </small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
          {!results.length && (
            <div className={styles.empty}>
              <h3>No work found.</h3>
              <p>
                Try a medium like painting or music, or browse the full
                collection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                Show all works
              </button>
            </div>
          )}
        </nav>
        <footer className={styles.footer}>
          <span>Tab to explore · Enter to visit · Esc to close</span>
          <a href="/research">Search the research atlas ↗</a>
        </footer>
      </dialog>
    </>
  );
}

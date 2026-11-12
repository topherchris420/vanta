import styles from "../../styles/Studio.module.css";

// Small things worth finding. Found ones are named; the rest offer a hint.
export default function Discoveries({ list, found, onClose }) {
  return (
    <section className={styles.foundCard} aria-labelledby="found-title">
      <h2 id="found-title">
        Found {found.size} of {list.length}
      </h2>
      <ul>
        {list.map((entry) => (
          <li key={entry.id} data-found={found.has(entry.id) ? "true" : "false"}>
            <span aria-hidden="true">{found.has(entry.id) ? "◆" : "◇"}</span>{" "}
            {found.has(entry.id) ? <strong>{entry.title}</strong> : <span>{entry.hint}</span>}
          </li>
        ))}
      </ul>
      <button type="button" className={styles.textButton} onClick={onClose}>
        Close
      </button>
    </section>
  );
}

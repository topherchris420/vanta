import styles from "../../styles/Studio.module.css";
import { ExternalLink } from "./Prose";

// The studio as text. It is rendered on the server, it is what screen readers
// and keyboard users move through, and it is the whole studio when WebGL is
// unavailable: every room, every object, every work and every receipt.
export default function StudioIndex({ content, practice, onOpen, open, fallback, onClose }) {
  const { layout, worksById } = content;
  const objectsIn = (zoneId) => layout.objects.filter((object) => object.room === zoneId);
  return (
    <section
      id="studio-index"
      className={styles.index}
      data-open={open || fallback ? "true" : "false"}
      aria-labelledby="studio-index-title"
      tabIndex={-1}
    >
      <div className={styles.indexHead}>
        <h2 id="studio-index-title">Studio index</h2>
        <p>
          Every room and everything in it. {fallback ? "" : "Choosing an object walks you to it in the studio."}
        </p>
        {!fallback && onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close the index">
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <ol className={styles.indexRooms}>
        {layout.zones.map((zone) => (
          <li key={zone.id} className={styles.indexRoom}>
            <h3>
              {zone.kind === "channel" ? (
                <>
                  <span className={styles.indexNote}>
                    {zone.number} · {zone.note}
                  </span>{" "}
                  {zone.name}
                </>
              ) : (
                zone.name
              )}
            </h3>
            {zone.kind === "channel" && <p className={styles.indexLede}>{zone.lede}</p>}
            <ul>
              {objectsIn(zone.id).map((object) => {
                const work = object.ref.work ? worksById[object.ref.work] : null;
                return (
                  <li key={object.id}>
                    <button type="button" className={styles.indexObject} onClick={() => onOpen(object.id)}>
                      {object.verb}
                    </button>
                    {work && (
                      <span className={styles.indexWork}>
                        {work.title} · <span className={styles.status}>{work.status.join(" · ")}</span>
                        {" · "}
                        {work.evidence.map((entry, index) => (
                          <span key={entry.href}>
                            {index > 0 && ", "}
                            <ExternalLink href={entry.href}>{entry.label}</ExternalLink>
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className={styles.indexFoot}>
        <a href="/">The portfolio page</a> · <a href="/research">The research atlas</a> ·{" "}
        <a href={`mailto:${practice.person.email}`}>{practice.person.email}</a>
      </p>
    </section>
  );
}

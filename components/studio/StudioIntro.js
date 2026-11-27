import styles from "../../styles/Studio.module.css";
import HorizonMark from "../HorizonMark";

// The first screen: the room, dimly lit, behind three plain choices. It asks
// for nothing and plays nothing; it is gone the moment a choice is made.
export default function StudioIntro({ onEnter, onTour, soundControl, webgl }) {
  return (
    <section className={styles.intro} aria-labelledby="studio-title" data-webgl={webgl}>
      <div className={styles.introInner}>
        <p className={styles.introLabel}>
          <HorizonMark className={styles.introMark} />
          VANTA <span aria-hidden="true">/</span> Christopher Woodyard
        </p>
        <h1 id="studio-title" className={styles.introTitle}>The studio</h1>
        <p className={styles.introLede}>
          Five notes. One chord. Walk the rooms as Chrisw, from the Library shelves to the keyboard in the Recording Studio.
        </p>
        <div className={styles.introActions}>
          <button type="button" className={styles.primary} onClick={onEnter} autoFocus>
            Enter the Studio <span className={styles.entryArrow} aria-hidden="true" />
          </button>
          <button type="button" className={styles.tourLink} onClick={onTour}>Guided Tour</button>
        </div>
        <nav className={styles.introLinks} aria-label="Elsewhere in Vanta">
          <a href="/">Explore the Original Portfolio</a>
          <a href="/riemann">The Music of the Primes</a>
        </nav>
        <div className={styles.introFoot}>
          {soundControl}
          <p className={styles.introHint}>
            {webgl === "fallback"
              ? "This browser cannot draw the 3D studio, so it opens as a text index with every room, instrument and work."
              : "WASD or arrows to walk. Drag to look. On touchscreens, use the pad and tap."}
          </p>
        </div>
      </div>
    </section>
  );
}

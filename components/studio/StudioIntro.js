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
          Christopher Woodyard / the studio
        </p>
        <h1 id="studio-title" className={styles.introTitle}>
          VANTA
        </h1>
        <p className={styles.introTagline}>Five notes. One chord.</p>
        <p className={styles.introLede}>
          A walkable studio built from the portfolio: a library, a workbench, a simulation room, a
          gallery, and a recording studio, one for each of the five channels. Everything in it is
          real work, and every piece links to where it can be checked.
        </p>
        <div className={styles.introActions}>
          <button type="button" className={styles.primary} onClick={onEnter} autoFocus>
            Enter the Studio
          </button>
          <a className={styles.secondary} href="/">
            Explore the Original Portfolio
          </a>
          <button type="button" className={styles.textButton} onClick={onTour}>
            Guided Tour
          </button>
        </div>
        <div className={styles.introFoot}>
          {soundControl}
          <p className={styles.introHint}>
            {webgl === "fallback"
              ? "This browser cannot draw the 3D studio, so it opens as a text index with every room, instrument and work."
              : "Walk with WASD or the arrow keys, drag to look, click what you want to use. On a phone, use the pad and tap. Silent until you switch sound on."}
          </p>
        </div>
      </div>
    </section>
  );
}

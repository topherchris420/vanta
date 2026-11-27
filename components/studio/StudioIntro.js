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
          Explore as Chrisw, Christopher Woodyard’s avatar. Shape sound at the workbench, visit a simulation, or follow a work back to its
          source. Five rooms, five ways to explore one artistic practice. Choose what interests you;
          what you touch should lead somewhere you can hear, see, or check.
        </p>
        <div className={styles.introActions}>
          <button type="button" className={styles.primary} onClick={onEnter} autoFocus>
            Enter the Studio
          </button>
          <a className={styles.secondary} href="/">
            Explore the Original Portfolio
          </a>
          <a className={styles.secondary} href="/riemann">The Music of the Primes</a>
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

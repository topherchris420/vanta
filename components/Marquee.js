import styles from "../styles/Home.module.css";

// Infinite scrolling ticker. Content is duplicated so the loop is seamless;
// the duplicate is hidden from assistive tech.
const Marquee = ({ items, duration = 32 }) => {
  const renderTrack = (hidden) => (
    <ul
      className={styles.marqueeTrack}
      aria-hidden={hidden ? "true" : undefined}
    >
      {items.map((item, index) => (
        <li className={styles.marqueeItem} key={`${item}-${index}`}>
          <span>{item}</span>
          <span className={styles.marqueeStar} aria-hidden="true">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.marquee}>
      <div
        className={styles.marqueeInner}
        style={{ "--marquee-duration": `${duration}s` }}
      >
        {renderTrack(false)}
        {renderTrack(true)}
      </div>
    </div>
  );
};

export default Marquee;

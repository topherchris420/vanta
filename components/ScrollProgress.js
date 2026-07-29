import { useEffect, useRef } from "react";
import signalExperience from "../lib/signalExperience";
import styles from "../styles/Home.module.css";

const { computeScrollProgress } = signalExperience;

// Publishes scroll depth once per frame as --scroll-progress so the top meter
// and the frequency rail trace share a single measurement, and so scrolling
// never re-renders React.
const ScrollProgress = () => {
  const meterRef = useRef(null);

  useEffect(() => {
    const meter = meterRef.current;
    if (!meter) {
      return undefined;
    }

    const root = document.documentElement;
    let frame = 0;
    let queued = false;

    const publish = () => {
      queued = false;
      const progress = computeScrollProgress({
        scrollTop: window.scrollY,
        scrollHeight: root.scrollHeight,
        viewportHeight: window.innerHeight,
      });

      root.style.setProperty("--scroll-progress", String(progress));
      meter.style.transform = `scaleX(${progress})`;
    };

    const request = () => {
      if (queued || document.hidden) {
        return;
      }

      queued = true;
      frame = window.requestAnimationFrame(publish);
    };

    publish();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    document.addEventListener("visibilitychange", publish);

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      document.removeEventListener("visibilitychange", publish);
      window.cancelAnimationFrame(frame);
      root.style.removeProperty("--scroll-progress");
    };
  }, []);

  return (
    <div ref={meterRef} className={styles.scrollProgress} aria-hidden="true" />
  );
};

export default ScrollProgress;

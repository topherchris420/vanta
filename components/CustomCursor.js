import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

// Custom cursor: a dot that tracks the pointer and a ring that trails it.
// Positions are driven by rAF + refs so mouse movement never re-renders React.
// Renders nothing on touch devices.
const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches) {
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) {
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let visible = false;
    let frame = 0;

    const render = () => {
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      frame = window.requestAnimationFrame(render);
    };

    const onMouseMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        visible = true;
        ringX = targetX;
        ringY = targetY;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    const onMouseOver = (event) => {
      const interactive =
        event.target instanceof Element &&
        event.target.closest("a, button, [role='button']");
      dot.classList.toggle(styles.cursorDotActive, Boolean(interactive));
      ring.classList.toggle(styles.cursorRingActive, Boolean(interactive));
    };

    const onMouseLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMouseDown = () => ring.classList.add(styles.cursorRingPressed);
    const onMouseUp = () => ring.classList.remove(styles.cursorRingPressed);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div ref={ringRef} className={styles.cursorRing} aria-hidden="true" />
      <div ref={dotRef} className={styles.cursorDot} aria-hidden="true" />
    </>
  );
};

export default CustomCursor;

import { useRef } from "react";
import styles from "../../styles/Studio.module.css";

// A thumb pad for walking on touch screens. Looking is a drag anywhere on the
// room; using something is a tap on it, or on the prompt.
export default function TouchControls({ apiRef }) {
  const padRef = useRef(null);
  const knobRef = useRef(null);
  const active = useRef(null);
  const radius = 46;

  const update = (event) => {
    const bounds = padRef.current.getBoundingClientRect();
    let dx = event.clientX - (bounds.left + bounds.width / 2);
    let dy = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    apiRef.current?.setInput({ forward: -dy / radius, strafe: dx / radius, turn: 0, run: distance > radius * 1.4 });
  };

  const end = () => {
    active.current = null;
    if (knobRef.current) knobRef.current.style.transform = "";
    apiRef.current?.setInput({ forward: 0, strafe: 0, turn: 0, run: false });
  };

  return (
    <div
      ref={padRef}
      className={styles.touchPad}
      aria-hidden="true"
      onPointerDown={(event) => {
        active.current = event.pointerId;
        padRef.current.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (active.current === event.pointerId) update(event);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span ref={knobRef} className={styles.touchKnob} />
    </div>
  );
}

import { useEffect, useRef } from "react";
import styles from "../../styles/Studio.module.css";

// The floor plan, drawn from the same layout the walker collides with. The
// visitor's marker is moved directly from the scene's pose each frame, so the
// map never re-renders React while you walk.
export default function StudioMap({ layout, apiRef, zoneId, onGo, chordIds = [] }) {
  const markerRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const pose = apiRef.current?.getPose?.();
      if (pose && markerRef.current) {
        const degrees = (-pose.yaw * 180) / Math.PI;
        markerRef.current.setAttribute("transform", `translate(${pose.x} ${pose.z}) rotate(${degrees})`);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [apiRef]);

  const chord = new Set(chordIds);
  return (
    <div className={styles.map}>
      <svg viewBox="-10.6 -9.6 21.2 19.2" className={styles.mapSvg} aria-hidden="true">
        {layout.zones.map((zone) => (
          <rect
            key={zone.id}
            x={zone.bounds.x[0]}
            y={zone.bounds.z[0]}
            width={zone.bounds.x[1] - zone.bounds.x[0]}
            height={zone.bounds.z[1] - zone.bounds.z[0]}
            className={styles.mapZone}
            data-current={zone.id === zoneId ? "true" : undefined}
            data-chord={chord.has(zone.id) ? "true" : undefined}
            onClick={() => onGo(zone.id)}
          />
        ))}
        {layout.walls.map((wall, index) => (
          <rect
            key={index}
            x={wall.x[0]}
            y={wall.z[0]}
            width={wall.x[1] - wall.x[0]}
            height={wall.z[1] - wall.z[0]}
            className={styles.mapWall}
          />
        ))}
        {layout.furniture.map((item) => (
          <rect
            key={item.name}
            x={item.x[0]}
            y={item.z[0]}
            width={item.x[1] - item.x[0]}
            height={item.z[1] - item.z[0]}
            className={styles.mapFurniture}
          />
        ))}
        {layout.zones
          .filter((zone) => zone.kind === "channel")
          .map((zone) => (
            <text
              key={zone.id}
              x={(zone.bounds.x[0] + zone.bounds.x[1]) / 2}
              y={(zone.bounds.z[0] + zone.bounds.z[1]) / 2}
              className={styles.mapLabel}
            >
              {zone.note}
            </text>
          ))}
        <g ref={markerRef}>
          <path d="M0 -0.62 L0.38 0.38 L0 0.16 L-0.38 0.38 Z" className={styles.mapMarker} />
        </g>
      </svg>
      <nav aria-label="Go to a room" className={styles.mapRooms}>
        {layout.zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => onGo(zone.id)}
            aria-current={zone.id === zoneId ? "location" : undefined}
          >
            {zone.kind === "channel" ? (
              <>
                <span className={styles.mapNote}>{zone.note}</span> {zone.name}
              </>
            ) : (
              zone.name
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

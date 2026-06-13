import { useRef } from "react";

// Card wrapper that tracks the pointer so CSS can paint a glow under it.
const SpotlightCard = ({ className = "", style, children, ...rest }) => {
  const ref = useRef(null);

  const handleMouseMove = (event) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <article
      ref={ref}
      onMouseMove={handleMouseMove}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </article>
  );
};

export default SpotlightCard;

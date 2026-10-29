// The site mark beside the name: the archive's horizon. public/icon.svg draws
// the same geometry on its own ink tile for browser tabs and home screens; this
// inline copy is cropped to the drawing so it sits on the name's line.
export default function HorizonMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="2 10 60 38"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M13.5 31a18.5 18.5 0 0 1 37 0"
        fill="none"
        stroke="#e7b85e"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="33" r="12.5" fill="#000" stroke="#89f2c2" strokeWidth="3" />
      <path
        d="M4 34.5q28 7.5 56 0"
        fill="none"
        stroke="#e7b85e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

import { Inter, Space_Grotesk } from "next/font/google";
import "../styles/globals.css";

// Self-hosted via next/font (can't be used in _document.js — Next.js
// rejects it there). This wrapper is a descendant of <html>/<body>, so
// globals.css's `html, body { font-family: var(--font-body); }` can't see
// these variables and falls back to a serif default; explicitly setting
// font-family here (not just exposing the variable) is what actually fixes
// real content, since every page's markup is a descendant of this div.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

function MyApp({ Component, pageProps }) {
  return (
    <div
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

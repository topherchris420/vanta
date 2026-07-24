import { Inter, Space_Grotesk } from "next/font/google";
import "../styles/globals.css";

// Self-hosted via next/font instead of a manual Google Fonts <link> in
// _document.js: same families/weights, no extra DNS/connection round-trip.
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
    <div className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

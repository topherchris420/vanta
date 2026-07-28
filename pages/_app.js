import { Space_Grotesk, Syne } from "next/font/google";
import "../styles/globals.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

function MyApp({ Component, pageProps }) {
  return (
    <div
      className={`${display.variable} ${body.variable}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

import localFont from "next/font/local";
import "../styles/globals.css";

const display = localFont({
  src: "../styles/fonts/syne-latin.woff2",
  weight: "600 800",
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "../styles/fonts/space-grotesk-latin.woff2",
  weight: "400 600",
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

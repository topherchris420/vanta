import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

const navLinks = [
  { label: "Signal", href: "#top" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const { pathname } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("");
  const destination = (hash) => (pathname === "/" ? hash : "/" + hash);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav link whose section currently crosses the middle band
  // of the viewport; no link is highlighted while the hero is in view.
  useEffect(() => {
    if (pathname !== "/" || !("IntersectionObserver" in window)) {
      return;
    }

    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean);

    if (sections.length === 0) {
      return;
    }

    const visibility = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(`#${entry.target.id}`, entry.isIntersecting);
        });
        const current = navLinks.find((link) => visibility.get(link.href));
        setActiveHref(current ? current.href : "");
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <a
        href={destination("#top")}
        className={styles.brand}
        aria-label="Back to top"
      >
        Vers<span className={styles.brandMark}>3</span>Dynamics
      </a>
      <nav className={styles.navLinks} aria-label="Primary">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={destination(link.href)}
            className={`${styles.navLink} ${
              activeHref === link.href ? styles.navLinkActive : ""
            }`.trim()}
            aria-current={activeHref === link.href ? "true" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;

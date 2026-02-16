## 2026-02-16 - Portfolio Link UX & Accessibility
**Learning:** Portfolio sites often link to external projects without opening in a new tab, causing users to lose their place. Additionally, "stylistic" link text (like "this is a" or "View here") fails WCAG 2.4.4 (Link Purpose).
**Action:** Always audit external links on portfolio pages. Use `target="_blank"` with `rel="noopener noreferrer"` for external projects, and ensure every link has descriptive text or an `aria-label` if the visual text is stylistic/vague.

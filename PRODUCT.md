# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: press and curators discovering and vetting Christopher Woodyard's art, writing, and music for coverage or exhibition. Secondary (evidenced by the site's own CTAs but not confirmed as primary): collaborators and clients considering commissions or partnership work.

## Product Purpose

A single-page personal portfolio for Christopher Woodyard, founder of Vers3Dynamics / R.A.I.N. Lab, that aggregates his output across five mediums — books, sound-driven wellness apps, immersive/spatial art, music, and consciousness-engine writing — into one coherent identity. Success is a press/curator visitor grasping the range and depth of the work within a short skim and finding a real, citable source (book link, gallery feature, track, paper) for whichever medium they came for.

## Positioning

The differentiator is the range itself, held coherently under one identity: one person working across five mediums (books, apps, art, music, frequency/consciousness writing), not a specialist portfolio in any single discipline. A neighboring site could showcase any one of these mediums; it could not truthfully claim the same coherent multi-medium range under one name.

## Operating Context

- Single-page scroll: hero → about → five project mediums (Books, Apps, Art, Frequency, Music) → contact footer.
- Every project medium links out to third-party evidence: Amazon (poetry book), a Streamlit app, a Hugging Face Space, GitHub repos, Oncyber and MADS gallery pages, a dappling.network experience, Bandcamp, and an SSRN author page.
- An automated agent ("Jules," via Google) has previously opened PRs against this repo for accessibility and image-loading performance; three are currently open and stale (`CONFLICTING` against `main`) because a subsequent redesign/SEO pass superseded the lines they touched.
- Canonical `siteUrl` in code (`https://mitpress.vercel.app`) is confirmed intentional — not a bug, leave as-is.

## Capabilities and Constraints

- Next.js (Pages Router) + `three.js` / `vanta.js` for a WebGL background effect (`components/VantaEffect.js`), dynamically imported with `ssr: false`.
- Content is not CMS-driven — all copy and links live in data arrays inside `pages/index.js` (`projectSections`, `marqueeItems`, `elsewhereLinks`).
- Prior automated review (`.Jules/bolt.md`, `.Jules/palette.md`) recorded two durable constraints future work must keep honoring:
  - WebGL animation loops must check `prefers-reduced-motion` AND skip the `renderer.render()` call when reduced motion is active — pausing time state alone is insufficient.
  - Don't double-load Three.js via a CDN script tag when it's already a bundled dependency.
- Node 22.x engine; package manager is pnpm (`pnpm-lock.yaml`).

## Brand Commitments

- Name: "Vers3Dynamics" (stylized in body copy as "versᗱdynamics"). Also: "R.A.I.N. Lab" (Recursive Architecture of Intelligent Nexus), "Resonance Architect," and "Auditory Geometry" (music alias).
- Contact: christopher@vers3dynamics.com.
- Canonical domain: `https://mitpress.vercel.app` (confirmed intentional, see Operating Context).

## Evidence on Hand

- Poetry/coloring book (Amazon link), "Intro to Quantum" Streamlit app.
- `vers3dynamics-cymatics` Hugging Face Space, `james_library` GitHub repo.
- Oncyber gallery, MADS Gallery artist feature (named credit: Christopher Woodyard).
- "Frequency" consciousness-engine experience (dappling.network) with a linked inspiration source.
- Bandcamp discography under Auditory Geometry.
- SSRN author page (papers).
- No testimonials, press quotes, or third-party endorsements currently exist on the site — future work must not fabricate any.

## Product Principles

1. Coherence over category — every change should reinforce "one person, five mediums," not fragment the site into disconnected verticals.
2. Evidence-first credibility — every claim links out to a real, checkable artifact; never assert without a destination a press/curator visitor can click through to.
3. Press/curator legibility — a stranger skimming for ~30 seconds should walk away able to describe what Christopher does and name a source.
4. WebGL as atmosphere, not obstacle — the Vanta background sets mood but must never compromise reduced-motion behavior, performance, or accessibility.
5. Single source of truth in code — content lives in `pages/index.js` data arrays; avoid hidden or duplicated copy elsewhere.

## Accessibility & Inclusion

- `prefers-reduced-motion` must be honored in the WebGL animation loop, including skipping the render call, not just pausing time updates (see Capabilities and Constraints).
- Link purpose clarity (`aria-label` on ambiguous link text) and `lang="en"` on `<html>` are established requirements from a prior automated accessibility review (open PR #17 covers this but is stale/unmerged — treat its intent as a requirement, not its unmerged diff as done).

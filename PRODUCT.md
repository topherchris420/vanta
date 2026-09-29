# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web, built with the Next.js Pages Router.

## Users

Anyone meeting Christopher Woodyard's work for the first time: curators, researchers, engineers, musicians, collaborators, and press. Each should find something checkable within a minute: a repository, a preprint, a recording, a gallery.

## Product Purpose

Vanta is Christopher Woodyard's portfolio: one practice played on five instruments. It is not a résumé and not the Vers3Dynamics homepage. Vanta is the person; Vers3Dynamics is the open lab where much of the work is built.

The page lets a visitor find the continuity themselves:

1. First look: an unusual person and what he makes (the hero says it plainly).
2. Second: the works, each with its question and its receipts.
3. Third: the intervals, where the same questions turn out to recur across instruments.
4. Fourth: the research atlas, the sources underneath.

## Content Model

The canonical content lives in `data/practice.js` and is checked by `lib/practice.js`. Pages arrange it and never restate it.

- **Channels (five notes):** Writing (C4), Instruments (E4), Worlds (G4), Art (C5), Music (G3). Each has a lede, a list of works, and one real artifact.
- **Works:** title, optional year, optional question (leads), body, optional detail or trace, one to three statuses, evidence links, optional `alsoIn` channels.
- **Statuses** describe what happened, never how good it is: Live, Open source, Published, Preprint, Paper, Exhibited, Recorded, Simulation, Experiment, Prototype.
- **Threads (intervals):** Provenance, Agency, Translation, Resonance. A thread lists works; the channels it spans, and therefore its chord, are derived from those works. Each thread must span at least two channels, and no two threads may sound the same chord.
- **Epigraph:** one sentence of Christopher's own, with its source.
- **Now:** a single hand-picked pointer at a work. It is never generated from commit activity.

Rules:

- Every claim needs a receipt. No receipt, no claim.
- A work lives in one channel. `alsoIn` is used only when the connection is literal and checkable (the same album is the Pine Gap radio and its cover is the painting shown in Art).
- Unfinished work says so (Prototype, Preprint, and the detail line).

## Experience Contract

The page runs in this order:

1. Hero: the name and "captain of my soul", "Five notes. One chord.", a plain line saying what he makes, two explicit paths (Explore without sound, Enter the instrument), the Now line, and where the work lives (Vers3Dynamics, R.A.I.N. Lab, source). The Event Horizon Archive sits beside it.
2. A six-stop rail: the hero plus five channels.
3. A work index naming each channel's works.
4. Five channel sections: works on one side, the artifact on the other.
5. Intervals.
6. The research atlas gateway.
7. The collaboration footer: email first, then elsewhere links.

State:

- One active-channel id drives rail location, channel emphasis, visual resonance, and optional sound. The channel covering most of the reading band wins; the hero, Intervals, gateway, and footer are rest zones that return the instrument to Standby.
- Pointer and keyboard previews override the scroll channel and restore it on exit.
- Tuning a thread (hover or focus previews, click holds) marks its channels on the rail with `data-chord`, takes over the console readout (thread name and note count), and, with sound on, plays their notes as one chord. A held chord is released by clicking again, by Escape, or when the scroll channel changes.
- The console reads `00 / Signal / Standby` until something is tuned.
- Each channel artifact reports `SIGNAL ACTIVE` or `STANDBY`; only the conducting artifact runs the scan line. Artifacts are never dimmed.

## Sound Contract

- Every reload begins silent.
- No `AudioContext` is created until the visitor selects Enter the instrument or the sound control.
- Disabled sound never blocks navigation, evidence, visuals, previews, or thread tuning.
- The sound control reads Sound off, Sound on, or Sound unavailable.
- One note or a chord: voicing comes from `createChordVoicing`. A chord is rolled from its lowest note, and its total level is capped so it is never louder than a note is allowed to be. Every change releases through the same short envelope.
- The Music channel's recording is a 14-second excerpt of *Green Machine* by Indigo People, written and owned by Christopher. It loads only when asked (`preload="none"`), never autoplays, and silences the channel tone while it plays.

## Runtime Contract

- Desktop with WebGL, a visible document, and normal motion uses continuous rendering.
- Mobile and reduced-motion modes render static WebGL frames on demand.
- A static frame shows the composed picture the drift settles into, not its first frame.
- The archive builds one of two detail tiers; single-frame visitors get the same composition from less geometry.
- Hidden documents pause the background, archive, and cursor work.
- The archive pauses outside its viewport.
- Device pixel ratio is capped at 2 on desktop and 1.5 on mobile.
- WebGL construction or render failure switches the affected surface to a composed CSS fallback.
- The custom cursor runs only for visible fine-pointer documents without reduced motion.
- Artifact images are local, lazy, and declare their dimensions; each stays under 400 KB.

## Visual System

The interface is a dark, sharp-edged signal instrument, not a card-grid portfolio.

- Ink `#050806`, surface `#0a110e`, paper `#f2fbf7`, muted `#9dafaa`, signal mint `#89f2c2`, calibration amber `#e7b85e` (tokens in `styles/globals.css`).
- Display: Syne. Body: Space Grotesk. Metadata: the system monospace stack.
- Works are ruled lists with mono metadata, not cards. Statuses are amber mono text, not pills.
- Amber marks the practice's connective tissue: statuses, the Now line, threads, and the chord on the rail.

The hero stage is the Event Horizon Archive: the whole practice written to one surface. Its caption counts what it holds (works on the page and sources in the atlas). Layers:

- A spacetime lattice funnels into the throat.
- An accretion platter of tracks cut into sectors, one bit per sector, spun at Keplerian rates and Doppler-beamed.
- Filaments of infalling information.
- A near-black horizon encoded with equal-area cells that show only at grazing angles.
- A photon ring with the platter's lensed arcs.
- A swappable index model in a containment shell, tethered by a write beam. Selecting one is a write event.

The stage is a pointer shortcut into the research atlas. The keyboard and assistive-technology path is the explicit "Cross into the atlas" link. Model buttons are real, exposed buttons; no control is nested in another.

Display headlines are single unbreakable words and publish their width budget as `--title-em`; no headline is clipped at any viewport.

## Evidence Set

The receipts are the `evidence` links in `data/practice.js`; the rendered-page test checks that every one appears. The canonical URL is `https://mitpress.vercel.app/` (vers3dynamics.com links to it as the portfolio). Contact is `christopher@vers3dynamics.com`.

No testimonials, press quotes, endorsements, or performance claims are evidenced. Do not fabricate them. Do not attribute an image to Christopher unless its source says he made it.

## Accessibility

- Keep the skip link, visible focus, semantic headings, labelled sections, and `lang="en"`.
- Mouse previews also work with keyboard focus; thread tuning is a native `aria-pressed` button.
- Arrow, Home, and End keys tune between rail stops; every other key stays with the browser.
- The focus ring stays visible on the mint footer.
- Section and work anchors clear the fixed nav and rail through `scroll-margin-top`.
- Reduced motion stops continuous animation.
- `prefers-contrast: more` drops decorative dims, outline-only headings, and muted metadata.
- No horizontal document overflow at 320 px; no clipped headline or control.
- Decorative overlays (the scan line) never intercept pointer events.
- The 404 page offers one recovery destination, `/`.

## Research Atlas

The atlas answers a different question from the portfolio: what ideas and sources the work keeps returning to.

- Query, discipline, era, connection filter, sort, selected node, and mobile view live in an addressable URL, normalised against known values; searches are capped at 300 characters.
- Reading lists live under `vanta:reading-list:v1` in local storage, never in URLs or on a server. Storage failures keep in-memory saving and export working.
- Disciplines follow the records that exist: every offered discipline leads at least one record, and every record files under an offered discipline.
- Records credited to Christopher point only at his own deposits (Zenodo, OSF) or repositories. Preprints and manuscripts say in their own summary that they are not peer reviewed.
- `relations` are connections the records state themselves, each with a `basis` sentence; they become the only record-to-record catalog references. Everything else between records is inferred and labelled so.
- `practice` links a record to the work on the home page that it is or describes.
- Inclusion is not verification. The interface never infers verification from a source name or a DOI.
- The inspector is a native modal dialog: inert background, Escape to close, focus restored.
- On desktop the record list scrolls inside its column and the map holds the viewport. At 900 px and below, visitors switch between records and map, and the graph mounts only when the map is requested.

## Deployment

The site is a static export (`output: "export"`): `next build` writes `out/`, which Vercel and static hosts (dappling.network) serve. Nothing may require a server: no API routes, `getServerSideProps`, rewrites, or image optimisation. Hosts build on Node 22.

## Maintenance

```bash
npm test
npm run build
npm run build:research-graph   # after editing catalog records by hand
```

The test suite includes production policy tests, model-integrity tests, and rendered HTTP integration tests. Browser checks are described in `docs/research-workbench.md`.

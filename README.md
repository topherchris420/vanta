# Vanta

**Five notes. One chord.**

Christopher Woodyard’s portfolio and research atlas, built at [Vers3Dynamics](https://vers3dynamics.com/). Writing, software, art, frequency, and music form one instrument; the research explorer gives visitors a way to follow the ideas behind it.

[Explore Vanta](https://mitpress.vercel.app/) · [Open the research atlas](https://mitpress.vercel.app/research) · [Contact Christopher](mailto:christopher@vers3dynamics.com)

## The instrument

The home page connects five practices through a shared signal. Scroll or use the keyboard to tune a channel. Its frequency, visual state, and optional Web Audio tone move together. The event-horizon archive is a custom Three.js scene with a spacetime lattice, accretion tracks, and interchangeable index models.

Every visit starts silent. Sound requires an explicit action, and the work remains accessible without it. Reduced motion, mobile, hidden tabs, and unavailable WebGL have dedicated rendering paths. Links lead to the work itself: books, repositories, exhibitions, and recordings.

## The research atlas

`/research` searches a bundled local catalog across eight disciplines, with weighted text matching, typo tolerance, autocomplete, and an interactive connection map.

- **Addressable sessions.** Queries, discipline, era, connection filters, sort order, view, and the selected record are encoded in the URL. Copy a link to reopen that state.
- **Private reading lists.** Save records in this browser, revisit them independently of search filters, and export source metadata as JSON. Reading lists are excluded from shared URLs. Storage failures leave the current session usable.
- **A useful mobile view.** Switch between records and the map. The 3D graph loads when the mobile map is opened. Reduced-motion and unavailable-WebGL visitors get keyboard-accessible indexed nodes.
- **Inspect and follow.** A native modal inspector supports keyboard navigation, Escape, focus restoration, linked records, and source destinations.
- **Consistent empty states.** An empty search yields an empty graph; it never silently resets to the full corpus.

Try [EEG](https://mitpress.vercel.app/research?q=EEG), [resonance](https://mitpress.vercel.app/research?q=resonance), or [open source](https://mitpress.vercel.app/research?q=open+source).

### What the catalog establishes

The bundled data contains locally supplied metadata, summaries, and relationships. **Inclusion is not independent verification of a publication, authorship, DOI, historical attribution, or scientific result.** Some source URLs lead to broader collections rather than the named record. Check the original artifact before citing or relying on a claim.

“Catalog references” uses the existing source/DOI heuristic. “Inferred connections” selects relationships marked inferred in the local graph. Neither establishes evidentiary validity. Legacy internal names such as `verifiedOnly`, `Source Verified`, and edge `verified` fields are retained for data compatibility; the interface does not present these as verification.

The live UI uses weighted lexical search. A standalone reciprocal-rank-fusion utility exists in the code; embedding retrieval and live external search are not part of the browser search path.

## Run locally

Use Node.js 22 (minimum 20.9) and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Production:

```sh
npm run build
npm start
```

The app uses Next.js Pages Router with prerendered pages. Deploy to a Next.js-compatible host such as Vercel. This repository does not currently enable `output: 'export'`; `next export` is not a deployment step.

## Quality checks

```sh
npm test
npm run build
```

The Node test suite covers search, graph extraction, URL round trips, invalid state, reading-list persistence boundaries, exports, audio and render policies, and rendered HTTP contracts. GitHub Actions runs tests and the production build on Node 22. Desktop and mobile browser checks are documented in [the implementation notes](docs/research-workbench.md).

## Code map

| Area | Entry point |
| --- | --- |
| Canonical portfolio channels | `pages/index.js` |
| Audio lifecycle | `hooks/useSignalAudio.js` |
| Research interface | `pages/research/index.js` |
| URL and reading-list contracts | `lib/research/workbench.js` |
| Browser persistence | `hooks/useResearchSession.js` |
| Search and graph extraction | `lib/research/searchEngine.js` |
| Bundled catalog | `data/research/curatedKnowledge.json` |
| Runtime capabilities | `lib/runtimeCapabilities.js` |
| Design and behavior contracts | `PRODUCT.md` |

## Catalog maintenance

```sh
npm run sync:research
npm run ingest:neuro2
```

These are explicit maintenance commands, not background requests from a visitor’s browser. Review changes to metadata and source URLs before committing ingestion output.

Built with Next.js, React, Three.js, react-force-graph-3d, and the Web Audio API.

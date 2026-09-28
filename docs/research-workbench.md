# Research workbench implementation

Vanta now connects the portfolio to a usable research session: search, inspect,
follow a connection, save a record, share a search, and export a reading list.

## Changes

- A home-page research gateway introduces three starting topics and uses the actual catalog count.
- Compact discipline and sort controls replace the always-expanded filter wall. Connection and era filters remain available in an expandable region.
- URL state captures filters, sorting, selection, and mobile view, with bounded input and known-value validation.
- Browser-local reading lists support cross-tab storage updates, safe recovery from malformed/stale data, and JSON export. Shared links contain no reading-list IDs.
- Native modal details provide focus containment, Escape, and return to the opener. Related nodes and static graph entries are native buttons.
- Empty search results no longer show the unfiltered full graph.
- On mobile, records and graph have separate views. The hidden graph does not mount. Large graphs show labels on selection/hover to reduce visual clutter.
- Visible provenance labels describe catalog entries rather than imply source verification. Exports retain this qualification.
- Next.js is updated from 13.5.6 to 15.5.26. The Pages Router and React 18 remain. Unused `vanta` and the umbrella `react-force-graph` dependency are removed; the custom Three.js scenes and `react-force-graph-3d` remain.
- npm is the single lockfile source. Node 22 CI runs the tests and production build.

## Automated verification

`npm test` (at the time of this change): 57 passing tests, including rendered HTTP checks for home, research,
and 404; six new workbench regressions cover URL round trips, invalid query state,
storage recovery, source-preserving exports, empty graphs, and saved-record neighborhoods.

`npm run build`: production build passes with both main routes prerendered.

## Browser acceptance checklist

- At desktop and 390px mobile width, headings and controls fit without horizontal overflow.
- Search Dynamic Location Theory, sort titles, inspect a record, follow a connected node, and close with Escape.
- In the inspector, stated connections show their reason; "In the portfolio" returns to the work on the home page.
- On desktop the record list scrolls in its own column and the map keeps the viewport height.
- Save a record, reload, open the reading list, export JSON, remove it, and verify the empty state.
- Copy a search link and reopen it; confirm query, filters, sort, and selected record.
- Use a no-match query; both the records and map should report no matches.
- On mobile, switch records/map and verify that controls remain reachable.
- With reduced motion or unavailable WebGL, inspect nodes from the static graph.
- Home starts silent; evidence links, frequency rail, sound toggle, and contact remain available.

## Catalog audit, September 2026

The catalog was checked record by record against Crossref, DataCite, arXiv,
and the linked sources (see `docs/coherence-diagnosis.md`). Records that could
not be traced were removed: 28 journal papers credited to Christopher whose DOIs
do not exist or belong to unrelated work, dataset records with invented authors
or DOIs, and archival records with invented DOIs. They were replaced with his
real Zenodo and OSF preprints, project records rewritten from their READMEs, and
corrected archival records. `tests/researchProvenance.test.js` keeps them out.

The audit checked that each record exists and is attributed correctly. It did
not review the claims inside any paper. Inclusion is still not verification.

## Browser checks

`scripts/browserChecks.js` drives a real Chromium against a running site and
checks what the HTML tests cannot: silent entry with no `AudioContext`, scroll
tuning of every channel, rest zones, thread chords on the rail and in audio,
Escape releasing a held chord, the recording silencing the channel tone,
keyboard tuning, and that the archive exposes its controls without nesting.

```sh
npm run build && npm start &   # serves the static export in out/
npm i --no-save playwright-core
node scripts/browserChecks.js http://localhost:3000
node scripts/browserChecks.js http://localhost:3000 --no-webgl
node scripts/browserChecks.js http://localhost:3000 --reduced-motion
```

Set `CHROMIUM_PATH` if Playwright's own browser is not installed.

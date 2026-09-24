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

`npm test`: 57 passing tests, including rendered HTTP checks for home, research,
and 404; six new workbench regressions cover URL round trips, invalid query state,
storage recovery, source-preserving exports, empty graphs, and saved-record neighborhoods.

`npm run build`: production build passes with both main routes prerendered.

## Browser acceptance checklist

- At desktop and 390px mobile width, headings and controls fit without horizontal overflow.
- Search EEG, sort titles, inspect a record, follow a connected node, and close with Escape.
- Save a record, reload, open the reading list, export JSON, remove it, and verify the empty state.
- Copy a search link and reopen it; confirm query, filters, sort, and selected record.
- Use a no-match query; both the records and map should report no matches.
- On mobile, switch records/map and verify that controls remain reachable.
- With reduced motion or unavailable WebGL, inspect nodes from the static graph.
- Home starts silent; evidence links, frequency rail, sound toggle, and contact remain available.

The catalog itself has not received a bibliographic verification audit. Existing
metadata and relationships are preserved, with their limits stated explicitly.

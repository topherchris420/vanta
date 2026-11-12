# The studio

`/studio` is the portfolio as a place you can walk around. It's a 3D studio built from
`data/practice.js`, with one room for each channel, the Event Horizon Archive in an
instrument of its own, and a computer you can sit down at. The home page and `/research`
are unchanged and work without it. The studio is one more way in.

## The audit

The studio began with a read of the existing site. This is what it found, and what the
studio does with each part.

**Kept as it is**

- `data/practice.js` is still the only source of content. The studio reads works, statuses,
  receipts, threads, the epigraph and `now` from it, and never restates them.
- The home page, `/research`, the 404 page and their tests. The only change to them is a
  Studio link in the nav and an extra `/studio` block in the rendered-page test.
- The sound contract. Every visit starts silent, nothing creates an `AudioContext` until
  the visitor asks for sound, chords are voiced and capped by `createChordVoicing` and
  `createStrum`, and the Green Machine excerpt never preloads or autoplays.
- The runtime contract: the pixel ratio is capped at 2 on desktop and 1.5 on phones,
  hidden tabs pause, reduced motion gets a still scene, and a WebGL failure falls back to
  text.
- The static export. Nothing new needs a server. `getStaticProps` reads the catalog and
  `docs/MATH_RESEARCH.md` at build time.
- The visual system: ink, surface, paper, mint and amber, Syne and Space Grotesk, mono
  metadata, hard edges and ruled lists.

**Extended**

- `lib/eventHorizonArchive.js` takes an `embedded` option. The studio mounts the same
  archive the home page uses, with the same shaders and detail tiers, inside its own scene.
  It passes the visitor's camera in, so the lensing, tilt and beaming follow you round it.
  The home page calls the archive exactly as before.
- The research atlas runs inside the computer's Atlas window, served from `/research`
  itself. Search, the connection map, stated and inferred links, URL state and the reading
  list are the real ones.

**New**

- `lib/studio/` holds the pure logic, all of it tested in node: the floor plan, walking and
  routes, graphics tiers, instruments, the library, the terminal and the page content.
- `lib/studio/scene/` holds the three.js scene.
- `components/studio/`, `hooks/useStudioAudio.js`, `hooks/useRecording.js` and
  `styles/Studio.module.css` are the interface.
- `scripts/studioBrowserChecks.js` runs the browser checks.

## How it fits together

| Area | Entry point |
| --- | --- |
| Floor plan, rooms, objects, discoveries, tour | `lib/studio/layout.js` |
| Walking, collision, routes, camera poses | `lib/studio/navigation.js` |
| Graphics tiers, frame governor, render policy | `lib/studio/quality.js` |
| Scope, plate, keyboard and tuning-game maths | `lib/studio/instruments.js` |
| The Library's volumes, markdown reader | `lib/studio/library.js` |
| Sandboxed terminal and its file tree | `lib/studio/terminal.js` |
| Everything the page shows, assembled | `lib/studio/content.js` |
| Renderer, lights, camera, picking, frame loop | `lib/studio/scene/index.js` |
| Walls, windows, sky, light shafts | `lib/studio/scene/architecture.js` |
| What is in each room | `lib/studio/scene/rooms.js` |
| Page state, panels, sound, tour | `pages/studio.js` |
| Desktop and its apps | `components/studio/Desktop.js`, `components/studio/apps/` |
| Object panels | `components/studio/panels/` |
| Text index (SSR, and the whole studio without WebGL) | `components/studio/StudioIndex.js` |

The page makes every decision: what's open, what's playing, what has been found. The scene
only draws and moves the camera. It exposes a small imperative API (`focus`, `release`,
`goto`, `setScope`, `setChord` and so on), never touches the DOM outside its host element,
and never plays sound.

`buildStudioLayout` refuses a practice model it can't house. A build fails if a work has no
object in its own room, a thread is hidden in a room it doesn't span, or a painting is hung
that the Art channel doesn't have. Add a work to `data/practice.js` without giving it a
place, and `npm test` says so.

## The rooms

| Room | Channel | What you can do |
| --- | --- | --- |
| The Library | Writing, C4 | Read Life of a Line (title page and a pointer to the paperback), the location papers, the research notebook (`docs/MATH_RESEARCH.md`), Resonant Intelligence, and every preprint the atlas credits to Christopher. Switch on the lamp. |
| The Workbench | Instruments, E4 | Drive the signal generator and watch the oscilloscope, in time or X–Y mode. Drive the resonance plate and watch the sand find its nodal lines. Strike the tuning fork. Read CIRCLE's polygraph, DRR's failed benchmark and the R.A.I.N. Lab card. |
| The Simulation Room | Worlds, G4 | Inspect the Pine Gap, Lop Nur and Mannahatta dioramas and launch the live sites. Look at the one real Pine Gap frame, labelled as a still. Pick up the person's controller. |
| The Gallery | Art, C5 | Look closely at the three works in the Art channel, under track lights, with their captions and associated works. Read the Rooms, Cymatics and Signal Lab cards. |
| The Recording Studio | Music, G3 | Play the two-octave synthesizer, with its five channel keys marked. Put on Green Machine. Patch the loose cable. |
| The Hall | rest | Sit at the computer. Sound the five chimes. Read the Now card. |
| Event Horizon Archive | rest | Change its index model, then cross into the atlas. |

Each room's pendant lamp hangs one wavelength of the room's note below the ceiling
(343 m/s ÷ frequency), so G3 hangs lowest. Each chime is cut to length as one over the
square root of its frequency.

## Musical structure

- When sound is on, walking into a room sounds its note once, from its pendant (spatially
  placed), and that pendant brightens.
- The five chimes sound the coda. All five pendants light, the HUD reads `∿ One chord`, and
  the chord's name comes from `nameChord`, as on the home page.
- Each thread is hidden in a room it spans. Finding it sounds its chord and lights its
  rooms:
  - Provenance: the reading lamp.
  - Resonance: the tuning fork.
  - Agency: the second controller. Its coda, "Two notes. The third is held by a person.",
    becomes a button that holds C4 under E4 and G4, which completes the triad.
  - Translation: a patch cable. Plugging it in makes the synthesizer drive the plate.
- **Resolve**, in the computer's Experiments app, is the playable game. The five strings
  arrive out of tune, and each strobe drifts until its string is right. With sound on,
  Listen plays the string against its true pitch so you can tune by the beating. When all
  five are in, the chord resolves.
- What the room shows (speaker cones, VU meters, the rack scope, pendant levels) is
  computed from what is being played: the synth's envelope, and the recording's stored
  loudness curve. It never comes from the audio output, so the room reacts the same with
  sound off.

## Getting around

- **Desktop:** WASD or the arrow keys, Shift to hurry, drag to look. Click an object to
  walk to it and use it, or press E for whatever is in front of you. M opens the map and
  Escape always returns you to your feet.
- **Phone:** a thumb pad to walk, drag to look, tap to use. The prompt is a button, panels
  are bottom sheets, and the desktop shows one window at a time.
- **Never stuck:** the HUD always shows where you are. The map sends you to any room, the
  index lists everything as text, and every panel has a Back to the studio button.
- Walking accelerates and coasts, and slides along walls. Routes to objects come from A*
  over the floor plan, then are straightened. When a panel is open, the camera's optical
  centre moves into the part of the room still visible, so the object stays in view.

## Honesty rules the studio keeps

- **No invented writing.** The Life of a Line volume holds its title page and says the
  poems are in the paperback. Preprint pages are the catalog's own records and say they
  are not peer reviewed.
- **No generated art.** The only images are the five already in `public/work/`. Everything
  else (timber, plaster, felt, the sky, labels) is painted on a canvas at start-up.
- **Simulations are labelled.** The scope and the plate say they are models, computed from
  their controls. The Pine Gap projection is labelled *Still frame, not a live feed*. The
  dioramas say they were made for the room.
- **Live means Live.** The Experiments launcher only offers works whose status includes
  Live, through their own evidence links. CIRCLE, a prototype, isn't offered.
- **The terminal is a sandbox.** It's a fixed command table over a virtual tree built from
  the practice model. `..` above the root goes nowhere, and there is no eval, network or
  real file system. The only effects it can ask for are a closed list: open a window, walk
  to a room, sound the chord, leave.

## Runtime

| Tier | Pixel ratio | Shadows | Accent lights | Plate grains | Frame cap |
| --- | --- | --- | --- | --- | --- |
| High | ≤ 2 | 2048, soft | yes | 9,000 | none |
| Balanced | ≤ 1.5 | 1024, soft | yes | 5,000 | none |
| Light | 1 | none | no | 2,200 | 30 fps |

- Phones start on Light. Machines with 4 GB of memory or 4 cores start on Balanced.
- A frame governor steps down a tier after a sustained run of slow frames, never on a
  single long frame. It never steps back up by itself.
- Graphics can be set by hand under Help.
- Rendering stops while the tab is hidden or the desktop covers the room. Under reduced
  motion it draws only when something changes.
- All shaders are compiled before the first frame.
- Static geometry is merged by material: about 220 draw calls and 99k triangles on High,
  and 120 and 57k on Light.
- Paintings and frames load progressively, and the room is usable before they arrive.
- Losing the WebGL context switches to the text index.

## Decisions

- **No React Three Fiber, Drei or GSAP.** The site already drives three.js imperatively
  (the archive, the atlas graph), and the studio reuses that archive directly. Most of the
  scene is static merged geometry, so a reconciler would add a second rendering model and
  bundle weight without much benefit. Glides follow routed paths with their own easing,
  which GSAP wouldn't simplify.
- **No postprocessing pass.** Tone mapping, physically based materials, soft shadows and
  sprite glows carry the look. A bloom pass would need careful handling round the
  archive's additive layers and would cost every frame on every tier.
- **The atlas is the atlas.** The computer's Atlas window is `/research` in a frame, not a
  reimplementation, so its provenance distinctions and reading lists can't drift.

## Checks

```sh
npm test
npm run build && npm start &
npm i --no-save playwright-core
node scripts/studioBrowserChecks.js http://localhost:3000
node scripts/studioBrowserChecks.js http://localhost:3000 --no-webgl
node scripts/studioBrowserChecks.js http://localhost:3000 --reduced-motion
node scripts/studioBrowserChecks.js http://localhost:3000 --mobile
```

The browser checks cover the intro, walking and collision, the prompt, the computer and
its sandbox, the atlas window, the instruments with and without sound, the consent
contract, the threads, the chord, the record, the archive, the map, the tour, horizontal
overflow, and page errors. They run on the Light tier and wait on positions rather than
timings, because software rendering can manage only a frame or two a second.

## Known limitations

- Everything in the studio is built from primitives. It is authored and consistent, but
  it isn't photogrammetry, and the furniture is deliberately simple.
- Changing tier at runtime can't rebuild the archive's geometry, so the detail tier chosen
  at load stays until the next visit.
- The terminal's `research` command uses the catalog's documents without the stored graph.
  The Atlas window has the full graph.
- Spatial audio uses HRTF panning where the browser supports it. Elsewhere sounds play
  unplaced.
- Frame rates have been measured only under software rendering (SwiftShader, 1–3 fps), and
  those numbers say nothing about GPUs. Draw calls and triangle counts are the comparable
  figures.

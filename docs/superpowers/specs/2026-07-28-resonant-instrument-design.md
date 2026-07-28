# Resonant Instrument redesign

Status: Approved

Date: 2026-07-28

## Objective

Turn the existing Vers3Dynamics portfolio into a high-impact audiovisual instrument while preserving its real project evidence, accessibility, and single-page clarity. The finished page should feel like one artwork with five tunable channels, not a collection of conventional portfolio cards.

The primary design goal is maximum experimental visual impact. Press and curator legibility remains a constraint: a visitor must still understand that Christopher Woodyard works across books, apps, art, frequency research, and music, and must be able to reach the existing external evidence for each medium.

## Current context

The project is a Next.js Pages Router site using React, CSS Modules, Three.js, and Vanta. Content and links are defined in pages/index.js. The current experience already includes a WebGL background, an interactive Three.js display pedestal, Web Audio tones, reveal animation, a custom cursor, a scroll progress indicator, and five project cards.

The redesign will work with that stack. It will not migrate frameworks, introduce a component library, add a motion dependency, fabricate portfolio evidence, or change the intentional canonical domain.

## Chosen direction

The approved direction is **Resonant Instrument**.

The page behaves like a technical-audiovisual instrument assembled from the five existing project frequencies. A persistent tuner identifies the active medium. Scrolling moves through channels, while the typography, accent lighting, WebGL field, and optional tone change together.

Two alternatives were considered:

- **Living Archive** used editorial collage and art-book typography. It offered strong legibility but less kinetic impact.
- **Liquid Myth Engine** used fluid full-screen transitions and a more dreamlike visual language. It offered greater spectacle but carried higher performance and information-clarity risk.

Resonant Instrument was selected because it provides a distinctive experience using capabilities and content already present in the repository.

## Experience structure

The page remains a native single-page scroll with this sequence:

1. **Signal hero** - states the thesis, presents the interactive model, and offers two entry paths: Enter the instrument and Explore without sound.
2. **Signal index** - shows all five mediums with their assigned frequency and makes the structure immediately scannable.
3. **Five project channels** - replaces equal cards with full-width, asymmetric sections for Books, Apps, Art, Frequency, and Music.
4. **Open channel** - ends with a focused collaboration prompt and the existing email address.
5. **Compact footer** - retains the existing primary destinations, contact path, and back-to-top navigation without inventing dead legal routes or becoming a link farm.

The page does not hijack scrolling. Each channel occupies enough space to register as its own instrument state, but content remains readable at normal browser scroll speed.

## Visual system

### Palette

The current multi-accent cyan, violet, pink, and mint palette will be consolidated into one coherent system:

- signal black: #060b09
- raised signal surface: #0b1210
- primary text: #edf9f4
- secondary text: #a5b6ae
- active signal mint: #8cf0c6
- calibration gold: #e4b65c

Individual channels may vary luminance, waveform, geometry, and texture, but they do not introduce unrelated accent hues. Mint communicates active or interactive state. Gold communicates labels, measurements, and calibration metadata.

### Typography

The generic Inter body treatment will be removed. The redesign will use Syne through next/font for display text, the existing Space Grotesk family for readable supporting copy, and a system monospace stack for frequencies and instrument labels. No font package will be added.

Large display lines use compressed spacing, tight leading, and outlined-to-filled contrast. Supporting paragraphs remain limited to a readable measure. Frequency values use tabular numerals.

### Surface and texture

The background uses a subtle technical grid, restrained grain, radial signal bloom, and tinted borders. Texture must not reduce text contrast. Shadows and glows carry the green hue of the signal field instead of generic black drop shadows.

## Layout

### Hero

The hero uses an asymmetric two-column composition. The thesis occupies the left side and the interactive Three.js instrument occupies the right, with intentional overlap on wide screens. The headline reads Five mediums. One signal. and is immediately supported by plain copy that names the practice.

The primary entry button activates sound through a valid user gesture and moves into the work. A secondary text action enters silently. There is no automatic audio.

### Tuner and signal index

A compact vertical tuner remains visible on desktop and identifies the active channel from 00 through 05. It is a navigation aid, not a decorative progress bar: each marker is keyboard accessible and links to the corresponding section.

On mobile, the tuner becomes a sticky horizontal index below the navigation. It scrolls within its own bounded row when all markers do not fit and never creates page-level horizontal overflow.

### Project channels

Each medium receives a full-width asymmetric channel with:

- channel number and frequency
- medium title
- existing project description
- two real evidence links
- a visual artifact, waveform, model, or texture derived from existing assets

Odd and even channels alternate composition without changing their information hierarchy. Links remain visible without requiring hover. The current equal-height spotlight-card pattern is removed.

## Component boundaries

The existing projectSections array in pages/index.js remains the canonical content source.

- pages/index.js owns the active channel, sound preference, and page composition.
- DisplayPedestal remains the hero's interactive Three.js object and receives the active signal state where needed.
- VantaEffect remains the atmospheric field and responds to the active channel through the existing resonance event boundary.
- A small FrequencyRail component renders accessible channel navigation and active state.
- A ProjectChannel component renders the shared semantic structure while allowing each channel to select its visual treatment.
- Existing utility components such as Navbar, Reveal, ScrollToTop, and CustomCursor are retained only where they support the approved design.
- SpotlightCard and Marquee are deleted after the channel layout removes their final consumers.

The redesign should prefer deletion and reuse over parallel old/new component systems.

## State and event flow

An IntersectionObserver determines the channel nearest the reading focus and updates one activeChannel value in the page. That state drives:

1. the active tuner marker;
2. channel typography and surface emphasis;
3. the WebGL resonance color and intensity through the existing custom event;
4. the optional Web Audio frequency after sound has been enabled.

Pointer hover and keyboard focus preview a channel. Leaving the preview restores the scroll-selected channel. Touch interaction uses focus or tap behavior and never depends on hover.

The signal state is visual first. Audio is an enhancement and never carries unique information.

## Motion and audio

Motion uses transforms, opacity, masks, and shader parameters. No animation should update layout properties such as top, left, width, or height per frame.

The Web Audio context is created only from an explicit user gesture. Frequency changes use short gain ramps so oscillators do not click or overlap. A global sound control remains visible, stores the preference in local storage when available, and defaults to a safe silent entry until activated.

On desktop, the hero pedestal animates only while the hero is visible; the Vanta field continues below the hero but pauses when the document is hidden. Both loops stop when reduced motion is active, and device pixel ratio remains capped at 2. On mobile, Vanta renders a static on-demand field while the pedestal is the only continuous canvas, capped at 1.5 device pixel ratio and active only while the hero is visible.

## Accessibility and responsive behavior

- Native scrolling, semantic landmarks, the skip link, visible focus styles, and descriptive external-link labels remain.
- All tuner destinations and audio controls are keyboard accessible.
- Focus and touch expose the same project destinations as pointer hover.
- prefers-reduced-motion stops continuous WebGL rendering, not only time updates. State changes render on demand as static compositions.
- Reduced-motion mode removes stagger and parallax while preserving hierarchy and channel identity.
- At narrow widths, the hero becomes one column, the model moves below the thesis, project channels stack, and labels remain readable without horizontal page overflow.
- Text contrast must meet WCAG AA for normal copy and controls.

## Failure handling

- If WebGL initialization fails, a CSS signal field and static instrument composition remain behind fully usable content.
- If Web Audio is blocked or unavailable, the control reports silent mode without an alert or modal; visual interaction continues.
- If local storage is unavailable, sound preference lasts for the current session only.
- Existing images use stable dimensions and meaningful alternative text. A failed decorative image must not remove titles or links.
- Interactive code must clean up observers, animation frames, oscillators, event listeners, Three.js geometries, materials, and textures on unmount.

## Verification strategy

No new test dependency will be introduced. The existing Node test runner remains the automated test surface.

Automated verification will cover pure signal-control behavior that can be isolated without a browser, including frequency definitions, channel ordering, preference normalization, and fallback selection. The existing display-pedestal model test remains in place.

The completed redesign must also pass:

- npm test
- a production next build
- desktop and mobile browser checks
- keyboard-only navigation
- reduced-motion inspection confirming no continuous render loop
- sound opt-in, mute, and frequency transition checks
- WebGL and audio fallback checks
- console inspection with zero known runtime errors
- visual comparison against the approved Resonant Instrument mockup

## Acceptance criteria

The redesign is complete when all of the following are true:

1. A first-time visitor can identify Christopher and the five mediums from the initial viewport or the immediately adjacent signal index.
2. Every existing project evidence link remains present and functional.
3. The page visibly reads as a connected audiovisual instrument rather than a conventional card portfolio.
4. Sound never starts without a user gesture and can be muted globally.
5. The active channel consistently updates navigation, surface emphasis, and visual resonance.
6. Keyboard, touch, reduced-motion, silent, and WebGL-fallback paths remain fully usable.
7. Mobile layouts have no clipped primary content or unintended horizontal overflow.
8. Tests and production build pass with no known browser console errors.

## Scope boundary

This work covers the home page, shared visual tokens, supporting components, and a token-and-typography alignment pass on the existing 404 page. It does not add new 404 interactions, a CMS, new portfolio claims, redesigned external projects, a canonical-domain change, analytics, or new dependencies.

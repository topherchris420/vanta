# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web, built with the Next.js Pages Router.

## Users

Primary: press, curators, and collaborators evaluating Christopher Woodyard's art, writing, software, and music. Secondary: clients considering commissions or partnership work.

## Product Purpose

Vanta is Christopher Woodyard's five-channel Resonant Instrument. It presents Books, Apps, Art, Frequency, and Music as one connected practice, then links every claim to a real external artifact.

## Experience Contract

The page runs in this sequence:

1. A hero identifies Christopher and offers two explicit paths: Enter the instrument or Explore without sound.
2. A six-stop rail links the hero plus five project channels.
3. Books, Apps, Art, Frequency, and Music render as semantic sections with two evidence links each.
4. One active-channel id conducts rail state, channel emphasis, visual resonance, and optional sound.
5. Pointer and keyboard previews temporarily override the scroll-selected channel, then restore it on exit.
6. A single collaboration footer preserves contact and elsewhere destinations.

The canonical content source is `projectSections` in `pages/index.js`. Channel ids, labels, descriptions, frequencies, visuals, and evidence URLs must not be duplicated into a second content model.

## Sound Contract

- Every reload begins silent.
- No `AudioContext` is created until the visitor selects Enter the instrument or the sound control.
- Disabled sound never blocks navigation, project evidence, WebGL visuals, or channel previews.
- The sound control reflects Sound off, Sound on, or Sound unavailable.
- Frequency changes use a short release so project transitions do not leave oscillators running.

## Runtime Contract

- Desktop with WebGL, a visible document, and normal motion uses continuous rendering.
- Mobile and reduced-motion modes render static WebGL frames on demand.
- Hidden documents pause background, pedestal, and cursor work.
- The pedestal pauses outside its viewport and resumes when it returns.
- Device pixel ratio is capped at 2 on desktop and 1.5 on mobile.
- WebGL construction or render failure switches the affected surface to a composed CSS fallback.
- The custom cursor runs only for visible fine-pointer documents without reduced motion.
- Visual resonance remains available even when sound is disabled or unavailable.

## Visual System

The interface is a dark, sharp-edged signal instrument, not a card-grid portfolio.

- Ink: `#060b09`
- Surface: `#0b1210`
- Paper: `#edf9f4`
- Muted: `#a5b6ae`
- Signal mint: `#8cf0c6`
- Calibration amber: `#e4b65c`
- Display type: Syne
- Body type: Space Grotesk
- Numeric and signal metadata: the system monospace stack

The same mint/amber language applies to CSS artifacts, the Vanta shader, pedestal lighting, and pedestal models. Motion communicates active state or user feedback and must collapse under `prefers-reduced-motion`.

## Evidence Set

These project destinations are product data and must remain preserved:

- Books: https://a.co/d/078d1kaa
- Books: https://woodyard.streamlit.app/
- Apps: https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics
- Apps: https://github.com/topherchris420/james_library
- Art: https://oncyber.io/stanfordgsb
- Art: https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/
- Frequency: https://woodyard.dappling.network
- Frequency: https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7
- Music: https://chriswoodyard.bandcamp.com/
- Music: https://chriswoodyard.bandcamp.com/track/creators-innovators

The canonical URL remains `https://mitpress.vercel.app/`. Contact remains `christopher@vers3dynamics.com`.

No testimonials, press quotes, endorsements, or performance claims are currently evidenced. Do not fabricate them.

## Accessibility

- Preserve the skip link, visible focus treatment, semantic headings, project section labels, and `lang="en"`.
- All mouse previews must also work with keyboard focus.
- Reduced motion stops continuous animation rather than merely freezing its clock.
- The mobile page must not create horizontal document overflow.
- The 404 page provides one clear recovery destination to `/`.

## Maintenance

Run before shipping:

```bash
npm test
npm run build
```

The test suite includes production policy tests and rendered HTTP integration tests. It must not infer behavior from source-code grep assertions.

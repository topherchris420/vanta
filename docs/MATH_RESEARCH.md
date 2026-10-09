# Mathematical research agenda: Vanta

**State: proposed, not tested.** No mathematical paper, theorem or production algorithm has been imported into this application.

[OpenAI's `math`](https://github.com/openai/math) consists of research manuscripts and formal proof artifacts with varying verification status, not an API that makes another model or product intrinsically smarter. [Its README](https://github.com/openai/math/blob/main/README.md) warns that some unformalized results may have issues. The shared [R.A.I.N. Lab](https://github.com/topherchris420/lop-nur-twin) already stores a read-only, commit-pinned catalog; other projects should **reuse its provenance-aware research questions**, not fork the entire corpus.

Upstream inspected at commit [`fd4aeeb2ee4f`](https://github.com/openai/math/tree/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb) on 9 October 2026. The local R.A.I.N. catalog may pin a different release, which is always declared in its scouting report.

## Question

**Does shared mathematical vocabulary cause unsupported provenance links in the research atlas?**

Candidate lexical search: `graph embedding distortion geometry`

From `topherchris420/lop-nur-twin`:

```sh
npm run rain:math:verify
npm run rain:math:portfolio -- --project vanta --json
```

Scouting ranks *possible* references and emits source revisions; it never says a theorem applies to this code, never compiles Lean, and never changes data or a decision. No matches is an acceptable outcome.

## Assumptions

1. Explicitly cited relationships and inferred semantic connections remain different edge classes.
2. A force-directed display can help navigation but is not a source of scientific evidence.
3. The artist's own preprints are not independently peer-reviewed because they appear in an atlas.

## Established starting point

`npm test` for research graph and provenance contracts, and `npm run build:research-graph` to regenerate the graph after reviewed changes

## Proposed comparison

Build a curated reference list of known source-attested edges and plausible-but-unsupported text matches, compare the atlas output, and predeclare an acceptable false-attribution rate.

**Required negative control:** Introduce two works sharing topical keywords but with no cited relationship; the UI must mark such a relationship inferred or decline to assert one.

**Target artifact:** A versioned graph corpus, annotated edge judgments, false-link and missed-link rates, and a keyboard-compatible view.

## What success would not imply

Mathematics references belong in Vanta as source-linked cultural and research artifacts, not as verification badges for unrelated physics papers or poetry.

An experiment must be implemented and benchmarked before this status can change. Preserve unsuccessful outcomes; avoid claiming new performance until both the controlled comparison and its evidence record exist.

**Current status:** `NOT TESTED` for this mathematics extension.

[Read shared scouting protocol](https://github.com/topherchris420/lop-nur-twin/blob/main/docs/MATH_PORTFOLIO.md) · [Inspect OpenAI's manuscript map](https://github.com/openai/math/blob/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb/CONTENTS.md)

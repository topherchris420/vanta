# Coherence diagnosis — September 2026

Written before the structural changes on `claude/vanta-coherence-study-hlybwe`.
Based on a pass through the running site (desktop, mobile, reduced motion,
research atlas), the source, every external link, fourteen public repositories,
and vers3dynamics.com.

## What already works — keep it

- **"Five notes. One chord."** The hero is authored and strange in the right
  way. "Captain of my soul" stays.
- **The instrument mechanics.** One active-channel id drives the rail, the
  console, visual resonance, and optional sound. Every visit starts silent,
  there is no `AudioContext` before intent, there are fallback paths, and the
  rail can be tuned from the keyboard. This is the best idea on the site.
- **Evidence philosophy.** Links go to the thing itself. The research atlas
  already says that inclusion is not verification.
- **Visual language.** Ink, mint, and amber; Syne, Space Grotesk, and mono; hard
  edges; negative space.

## Where the portfolio has fallen behind the work

1. **The atlas puts fabricated publications under Christopher's name.**
   Twenty-eight records credit him with papers in *Physical Review Letters*,
   *Nature Machine Intelligence*, *Sleep*, *NeuroImage*, and similar venues,
   with co-authors ("E. Vance", "M. Rostova", …) who appear nowhere else.
   Twenty-seven of the DOIs do not exist in Crossref; the other three resolve
   to unrelated papers by other people. Several dataset records list him (and
   others) as authors of third-party datasets. The archival records carry
   invented DOIs. The whole *Nuclear Engineering*, *Cymatics*, and *Acoustics*
   disciplines are made of these records. One click from a researcher would
   undo every honest caveat on the site. **This is the most urgent fix.** His
   real papers exist: sixteen manuscripts in the R.A.I.N. corpus, plus Dynamic
   Location Theory. They are openly falsifiable and self-published, and
   should appear as exactly that.

2. **The channels are drawers sized to UI slots, not to the work.**
   - *Books* holds a poetry book (*Life of a Line*, 2021) and a 3D desert
     airfield simulation, which only needed somewhere to sit. PRODUCT.md
     still says the second Books link is a Streamlit app that now sits behind
     a login wall.
   - *Apps* ("sound-driven AI wellness tools") holds a cymatics Space and the
     R.A.I.N. repository. It cannot hold what the practice has become: CIRCLE
     (biosignal hardware with isolation boundaries and review gates), DRR (a
     statistics framework that publishes its own failed external benchmark),
     and R.A.I.N. (a research room that keeps disagreement on the record).
     "Wellness" undersells all three, and the button calls them
     "AI/ML Projects".
   - *Frequency* ("a consciousness engine") says nothing concrete to a
     stranger. Its second link, "Read Inspiration Source", is someone else's
     PDF, not a receipt.
   - Pine Gap, Lop Nur, and Mannahatta (the simulated worlds, arguably the
     most distinctive recent work) have no channel. Pine Gap is hidden behind
     a footer link called "Latest build".

3. **No work is shown, only described.** Each channel has one sentence, two
   links, and a CSS artifact of rotated squares. The repositories are full of
   real evidence the site never uses: CIRCLE's polygraph recovered against
   hidden ground truth, a frame of an agent driving the Pine Gap coffee run,
   DRR's `not_supported` verdict, Lop Nur's "the finding was about the map".

4. **The connections are real but invisible.** The radio in Pine Gap plays
   *Green Machine*, Christopher's own album as Indigo People. R.A.I.N.'s
   agents cite his DRR and location papers. His *Resonant Intelligence* paper
   says, in his words, that "a detected pattern cannot, by itself, establish
   its meaning for a person or permission to intervene", which is the rule
   CIRCLE, Pordenone, Pine Gap, Lop Nur, and R.A.I.N. each enforce in code.
   That is the chord. The site never plays it.

5. **The person comes second to the company.** The nav brand is
   "Vers3Dynamics", `og:site_name` is Vers3Dynamics, and the Person schema's
   only role is `jobTitle: Founder`. The hero summary ("experiments in how we
   sense the world — and ourselves") could describe anyone.

6. **Order of layers.** The research-atlas gateway sits between the work
   index and the work, so layer four comes before layer one.

## What performs sophistication without clarifying

- Channel artifacts are decoration standing in for evidence.
- Hero index-model labels ("Wellness Arc", …) name nothing in the practice.
- The research graph opens framed on two giant spheres; the corpus is hard to
  read at first glance. (Behaviour kept; the data fix matters more.)

## Decisions

- **Keep five notes, correct the labels.** The labels are medium-based
  because the practice really does change medium, but they should name the
  mediums it actually uses now: **Writing · Instruments · Worlds · Art ·
  Music**. *Frequency* stops being a drawer and becomes what it always was:
  the tuning of the whole instrument (the Hz on every channel, the rail, the
  chord).
- **Works can sound in more than one channel.** Each anchor work lives in one
  channel and names the others it also plays in.
- **Intervals.** A small section names four recurring questions
  (provenance, agency, perspective, resonance). Tuning one lights the
  channels it spans on the rail and, with sound on, plays them together.
  This is the only place the site states its thesis, and it does it by
  playing a chord rather than explaining one.
- **Question → work → evidence.** Every anchor leads with its question,
  carries a factual status (what happened, not how good it is), and links to
  receipts. Each channel shows one real artifact in its own grammar: language
  for writing, signals for instruments, a frame for worlds, a recording for
  music.
- **Now**, not "Latest build": one manually curated line.
- **The atlas stays a separate experience** and becomes honest: fabricated
  records removed, real preprints added and labelled as such, project records
  rewritten from their READMEs.
- **Canonical domain stays `mitpress.vercel.app`.** vers3dynamics.com links
  there as the portfolio; there is no evidence of another domain.

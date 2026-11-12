import { useState } from "react";
import styles from "../../../styles/Studio.module.css";
import archiveModels from "../../../lib/displayPedestalModels.json";
import WorkDetail from "../WorkDetail";
import Reader from "../Reader";
import { ExternalLink } from "../Prose";
import { useHoldButton } from "./Instruments";

/* ------------------------------------------------------------------ archive */

// The layers are the ones PRODUCT.md names for the home page's hero.
const ARCHIVE_LAYERS = [
  ["Lattice", "a spacetime well funnelling into the throat"],
  ["Platter", "tracks cut into sectors, one bit per sector, spun at Keplerian rates and Doppler-beamed"],
  ["Filaments", "information on its way in"],
  ["Horizon", "near-black, encoded with equal-area cells that show only at grazing angles"],
  ["Photon ring", "with the platter's lensed arcs"],
  ["Index", "a swappable model in a containment shell, tethered by a write beam"],
];

export function ArchivePanel({ content, practice, state, actions }) {
  const model = archiveModels[state.archiveModel];
  return (
    <div>
      <p className={styles.panelLede}>
        The whole practice written to one surface: {practice.works.length} works and {content.recordCount}{" "}
        sources. The same instrument stands beside the name on the portfolio page; here it has a room of
        its own. Walk round it and the lensing follows you.
      </p>
      <div className={styles.control} role="group" aria-label="Index model">
        <span className={styles.controlLabel}>Index model, being written: {model.label}</span>
        <div className={styles.segmented}>
          {archiveModels.map((entry, index) => (
            <button
              key={entry.label}
              type="button"
              aria-pressed={state.archiveModel === index}
              onClick={() => actions.setArchiveModel(index)}
              style={{ "--swatch": entry.primary }}
              className={styles.swatchButton}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" onClick={actions.nextArchiveModel}>
          Write the next model
        </button>
        <a href="/research" className={styles.primarySmall} onClick={actions.crossIntoAtlas}>
          Cross into the atlas <span aria-hidden="true">→</span>
        </a>
      </div>
      <dl className={styles.layers}>
        {ARCHIVE_LAYERS.map(([name, text]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.footnote}>
        A visualisation of the archive as an idea, not a simulation of a real black hole. The atlas behind
        it is a local catalog for discovery, not verification.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------- coda */

export function CodaPanel({ content, practice, state, actions }) {
  const { coda } = content;
  const codaHeld = state.chord?.id === "coda";
  return (
    <div>
      <p className={styles.panelLede}>
        Five tubes, one for each room, cut to the lengths their notes ask for.{" "}
        {coda.notes.join(", ")} are one chord{coda.chordName ? `: ${coda.chordName}` : ""}. The headline is
        arithmetic, not metaphor.
      </p>
      <button type="button" className={styles.primarySmall} aria-pressed={codaHeld} onClick={actions.soundChord}>
        {codaHeld ? "Let the chord go" : "Sound the chord"}
      </button>
      <h3 className={styles.subhead}>Intervals</h3>
      <p className={styles.meta}>
        The questions that keep recurring across the rooms. Tune one and the rooms it spans light, and,
        with sound on, sound together.
      </p>
      <ul className={styles.intervals}>
        {content.threads.map((thread) => {
          const tuned = state.chord?.id === `thread-${thread.id}`;
          return (
            <li key={thread.id}>
              <button type="button" aria-pressed={tuned} onClick={() => actions.tuneThread(thread.id)}>
                <span className={styles.intervalName}>{thread.name}</span>
                <span className={styles.intervalNotes}>{thread.notes.join(" · ")}</span>
              </button>
              <p>{thread.question}</p>
              <p className={styles.meta}>
                {thread.works.map((id) => content.worksById[id].title).join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
      <blockquote className={styles.proseQuote}>
        {practice.epigraph.text}{" "}
        <ExternalLink href={practice.epigraph.href}>{practice.epigraph.source}</ExternalLink>
      </blockquote>
    </div>
  );
}

/* ------------------------------------------------------------------ threads */

function ThreadReveal({ thread, content }) {
  return (
    <div className={styles.reveal} aria-live="polite">
      <p className={styles.eyebrow}>A recurring question · {thread.notes.join(" · ")}</p>
      <h3 className={styles.revealTitle}>{thread.name}</h3>
      <p className={styles.question}>{thread.question}</p>
      <ul className={styles.revealWorks}>
        {thread.works.map((id) => {
          const work = content.worksById[id];
          return (
            <li key={id}>
              {work.title}{" "}
              <span className={styles.meta}>
                {content.channelsById[work.channel].title} · {work.status.join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
      {thread.coda && <p className={styles.coda}>{thread.coda}</p>}
    </div>
  );
}

export function ThreadPanel({ object, content, state, actions }) {
  const thread = content.threads.find((entry) => entry.id === object.ref.thread);
  const found = state.discoveries.has(thread.id);
  const third = useHoldButton(() => actions.holdThird(true), () => actions.holdThird(false));

  if (object.id === "lamp") {
    return (
      <div>
        <p className={styles.panelLede}>
          A floor lamp by the armchair. Above the chair, a board of index cards you cannot read in the
          dark.
        </p>
        <button type="button" className={styles.primarySmall} aria-pressed={state.lampOn} onClick={actions.toggleLamp}>
          {state.lampOn ? "Switch the lamp off" : "Switch the lamp on"}
        </button>
        {state.lampOn && <ThreadReveal thread={thread} content={content} />}
      </div>
    );
  }
  if (object.id === "fork") {
    return (
      <div>
        <p className={styles.panelLede}>A tuning fork on its resonator box, and a rubber mallet beside it.</p>
        <button type="button" className={styles.primarySmall} onClick={actions.strikeFork}>
          Strike it
        </button>
        {found && <ThreadReveal thread={thread} content={content} />}
      </div>
    );
  }
  if (object.id === "seats") {
    return (
      <div>
        <p className={styles.panelLede}>
          Two controllers on one input path, labelled person and agent. In Pine Gap, both drive through
          the same physics, and the agent cannot do what the person must.
        </p>
        <button type="button" className={styles.primarySmall} aria-pressed={state.controllersUp} onClick={actions.toggleControllers}>
          {state.controllersUp ? "Put the controller down" : "Pick up the person's controller"}
        </button>
        {state.controllersUp && (
          <>
            <ThreadReveal thread={thread} content={content} />
            <button type="button" className={styles.holdButton} aria-pressed={third.holding} {...third.props}>
              {third.holding ? "Holding C4" : "Hold the third note"}
            </button>
            <p className={styles.hint}>
              Press and hold. Two notes are the rooms; the third is yours, and together they make the
              chord.
            </p>
          </>
        )}
      </div>
    );
  }
  // The patch cable.
  return (
    <div>
      <p className={styles.panelLede}>
        A patch cable hanging loose from the bay. Its jack is labelled for the resonance plate on the
        Workbench.
      </p>
      <button type="button" className={styles.primarySmall} aria-pressed={state.patched} onClick={actions.togglePatch}>
        {state.patched ? "Unplug it" : "Plug it in"}
      </button>
      {state.patched && (
        <>
          <ThreadReveal thread={thread} content={content} />
          <p className={styles.hint}>
            Patched: what you play on the synthesizer now also drives the plate, carried up by octaves
            into its range. One signal, translated into a pattern in sand.
          </p>
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- the rest */

export function NowPanel({ practice, content, actions }) {
  const work = content.worksById[practice.now.work];
  return (
    <div>
      <p className={styles.eyebrow}>As of {practice.now.asOf}</p>
      <p className={styles.question}>{practice.now.text}</p>
      <p className={styles.meta}>Chosen by hand, not generated from activity.</p>
      <button type="button" className={styles.textButton} onClick={() => actions.find(content.objectForWork[work.id])}>
        Go to {work.title}
      </button>
    </div>
  );
}

export function QuotePanel({ content, actions }) {
  const { artifact } = content.channelsById.writing;
  return (
    <div>
      <blockquote className={styles.bigQuote}>“{artifact.text}”</blockquote>
      <p>
        <ExternalLink href={artifact.href}>{artifact.source}</ExternalLink>
      </p>
      <button type="button" className={styles.textButton} onClick={() => actions.find("book-location-papers")}>
        Read the preprints that test it
      </button>
    </div>
  );
}

export function CollectionPanel({ content, actions }) {
  const writing = content.channelsById.writing;
  return (
    <div>
      <p className={styles.panelLede}>{writing.lede}</p>
      <h3 className={styles.subhead}>On the reading table</h3>
      <ul className={styles.volumeList}>
        {content.volumes.map((volume) => {
          const holder = content.layout.objects.find((object) => object.ref.volume === volume.id);
          return (
            <li key={volume.id}>
              <button type="button" onClick={() => actions.find(holder.id)}>
                <span>{volume.title}</span>
                <span className={styles.meta}>{volume.byline}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className={styles.subhead}>The works</h3>
      {writing.works.map((id) => (
        <WorkDetail key={id} work={content.worksById[id]} content={content} compact />
      ))}
    </div>
  );
}

export function ArtworkPanel({ object, content }) {
  const panel = content.channelsById.art.artifact.panels[object.ref.panel];
  const related = object.ref.related ? content.worksById[object.ref.related] : null;
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  return (
    <div>
      <figure className={styles.artwork}>
        <div
          className={styles.artworkFrame}
          data-zoom={zoom ? "true" : "false"}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setOrigin(
              `${(((event.clientX - bounds.left) / bounds.width) * 100).toFixed(1)}% ${(((event.clientY - bounds.top) / bounds.height) * 100).toFixed(1)}%`
            );
          }}
        >
          <img
            src={panel.src}
            width={panel.width}
            height={panel.height}
            alt={panel.alt}
            style={{ transformOrigin: origin }}
          />
        </div>
        <figcaption>
          {panel.caption}
          {panel.href && (
            <>
              {" "}
              <ExternalLink href={panel.href}>Source</ExternalLink>
            </>
          )}
        </figcaption>
      </figure>
      <button type="button" className={styles.textButton} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
        {zoom ? "Step back" : "Look closer"}
      </button>
      {related && (
        <>
          <h3 className={styles.subhead}>Associated work</h3>
          <WorkDetail work={related} content={content} compact headingLevel={4} />
        </>
      )}
    </div>
  );
}

export function WorldPanel({ object, content, actions }) {
  const work = content.worksById[object.ref.work];
  const figure = object.ref.figure ? content.channelsById[object.ref.figure].artifact : null;
  return (
    <div>
      {figure && (
        <figure className={styles.artwork}>
          <img src={figure.src} width={figure.width} height={figure.height} alt={figure.alt} />
          <figcaption>
            <strong>Still frame.</strong> {figure.caption}{" "}
            <ExternalLink href={figure.href}>Where it comes from</ExternalLink>
          </figcaption>
        </figure>
      )}
      <WorkDetail work={work} content={content} />
      <p className={styles.footnote}>
        The diorama is a model made for this room. The links open the real sites, which run in your
        browser; nothing here pretends to be a live feed.
      </p>
    </div>
  );
}

export function BookPanel({ object, content }) {
  const volume = content.volumes.find((entry) => entry.id === object.ref.volume);
  return <Reader volume={volume} />;
}

export function WorkPanel({ object, content, actions }) {
  const work = content.worksById[object.ref.work];
  const figure = object.ref.figure ? content.channelsById[object.ref.figure].artifact : null;
  return (
    <div>
      {figure && (
        <figure className={styles.artwork}>
          <img src={figure.src} width={figure.width} height={figure.height} alt={figure.alt} />
          <figcaption>
            {figure.caption} <ExternalLink href={figure.href}>Source</ExternalLink>
          </figcaption>
        </figure>
      )}
      <WorkDetail work={work} content={content} />
    </div>
  );
}

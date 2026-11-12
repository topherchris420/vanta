import { useEffect, useRef } from "react";
import styles from "../../../styles/Studio.module.css";
import { PlatePanel, RecordPanel, ScopePanel, SynthPanel } from "./Instruments";
import {
  ArchivePanel,
  ArtworkPanel,
  BookPanel,
  CodaPanel,
  CollectionPanel,
  NowPanel,
  QuotePanel,
  ThreadPanel,
  WorkPanel,
  WorldPanel,
} from "./Places";

// The panel beside the room while an object is in use. Focus moves to its
// heading when it opens; Escape or the close button returns to the studio and
// puts the visitor back on their feet in front of the object.
export default function ObjectPanel({ object, zone, practice, content, state, actions, instruments }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [object.id]);

  const props = { object, practice, content, state, actions };
  let body;
  switch (object.kind) {
    case "scope":
      body = (
        <ScopePanel
          scope={instruments.scope}
          setScope={instruments.setScope}
          soundEnabled={state.soundEnabled}
          channels={practice.channels}
        />
      );
      break;
    case "chladni":
      body = (
        <PlatePanel
          plate={instruments.plate}
          setPlate={instruments.setPlate}
          soundEnabled={state.soundEnabled}
          onScatter={instruments.scatterPlate}
          patched={state.patched}
          cymatics={content.live.find((entry) => entry.id === "cymatics")}
        />
      );
      break;
    case "keyboard":
      body = (
        <SynthPanel
          channels={practice.channels}
          params={instruments.synth}
          setParams={instruments.setSynth}
          held={instruments.held}
          onNoteOn={instruments.noteOn}
          onNoteOff={instruments.noteOff}
          soundEnabled={state.soundEnabled}
          patched={state.patched}
        />
      );
      break;
    case "record":
      body = (
        <RecordPanel
          artifact={content.channelsById.music.artifact}
          work={content.worksById["green-machine"]}
          recording={instruments.recording}
        />
      );
      break;
    case "archive":
      body = <ArchivePanel {...props} />;
      break;
    case "coda":
      body = <CodaPanel {...props} />;
      break;
    case "thread":
      body = <ThreadPanel {...props} />;
      break;
    case "now":
      body = <NowPanel {...props} />;
      break;
    case "quote":
      body = <QuotePanel {...props} />;
      break;
    case "channel":
      body = <CollectionPanel {...props} />;
      break;
    case "artwork":
      body = <ArtworkPanel {...props} />;
      break;
    case "world":
      body = <WorldPanel {...props} />;
      break;
    case "book":
      body = <BookPanel {...props} />;
      break;
    default:
      body = <WorkPanel {...props} />;
  }

  return (
    <aside className={styles.panel} aria-labelledby="object-panel-title" data-kind={object.kind}>
      <header className={styles.panelHead}>
        <p className={styles.eyebrow}>
          {zone?.kind === "channel" ? `${zone.name} · ${zone.note}` : zone?.name}
        </p>
        <h2 id="object-panel-title" ref={headingRef} tabIndex={-1} className={styles.panelTitle}>
          {object.title}
        </h2>
        <button type="button" className={styles.close} onClick={actions.close} aria-label="Back to the studio (Escape)">
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className={styles.panelBody}>{body}</div>
      <footer className={styles.panelFoot}>
        <button type="button" className={styles.textButton} onClick={actions.close}>
          <span aria-hidden="true">←</span> Back to the studio
        </button>
        <kbd>Esc</kbd>
      </footer>
    </aside>
  );
}

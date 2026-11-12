import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "../../styles/Studio.module.css";
import terminalModel from "../../lib/studio/terminal";
import HorizonMark from "../HorizonMark";
import TerminalApp from "./apps/Terminal";
import Resolve from "./apps/Resolve";
import { RecordPanel } from "./panels/Instruments";
import Reader from "./Reader";
import WorkDetail from "./WorkDetail";
import { ExternalLink } from "./Prose";

const { listing, lookup } = terminalModel;

const APPS = {
  terminal: { title: "Terminal", glyph: ">_", size: [640, 400] },
  projects: { title: "Projects", glyph: "◫", size: [760, 500] },
  atlas: { title: "Research atlas", glyph: "◎", size: [960, 620] },
  music: { title: "Music", glyph: "♪", size: [460, 440] },
  art: { title: "Artwork", glyph: "▣", size: [700, 560] },
  files: { title: "Files", glyph: "▤", size: [600, 440] },
  experiments: { title: "Experiments", glyph: "∿", size: [680, 560] },
  reader: { title: "Reader", glyph: "❡", size: [700, 600] },
};
const DOCK = ["terminal", "projects", "atlas", "reader", "music", "art", "files", "experiments"];

/* ------------------------------------------------------------------- apps */

function ProjectsApp({ content, practice, props, onFind }) {
  const [selected, setSelected] = useState(props.work ?? practice.now.work);
  useEffect(() => {
    if (props.work) setSelected(props.work);
  }, [props.work]);
  const work = content.worksById[selected];
  return (
    <div className={styles.split}>
      <nav className={styles.splitList} aria-label="Works by channel">
        {practice.channels.map((channel) => (
          <div key={channel.id}>
            <p className={styles.eyebrow}>
              {channel.number} {channel.title} · {channel.note}
            </p>
            <ul>
              {channel.works.map((id) => (
                <li key={id}>
                  <button type="button" aria-current={id === selected ? "true" : undefined} onClick={() => setSelected(id)}>
                    {content.worksById[id].title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className={styles.splitDetail}>{work && <WorkDetail work={work} content={content} onFind={onFind} />}</div>
    </div>
  );
}

function AtlasApp({ props, recordCount }) {
  const src = props.query ? `/research?q=${encodeURIComponent(props.query)}` : "/research";
  return (
    <div className={styles.atlas}>
      <p className={styles.atlasBar}>
        The research atlas itself, running in this window: search, the connection map, stated and inferred
        links, and your reading list. {recordCount} records. A local catalog for discovery, not
        verification. <a href={src}>Open it on its own page</a>
      </p>
      <iframe key={src} src={src} title="Research atlas" className={styles.atlasFrame} loading="lazy" />
    </div>
  );
}

function MusicApp({ content, recording, audio, onChord, onFind }) {
  return (
    <div className={styles.appPad}>
      <RecordPanel artifact={content.channelsById.music.artifact} work={content.worksById["green-machine"]} recording={recording} />
      <div className={styles.buttonRow}>
        <button type="button" onClick={onChord} disabled={!audio.soundEnabled}>
          Play the five notes
        </button>
        <button type="button" onClick={() => onFind("keyboard")}>
          Go to the synthesizer
        </button>
      </div>
      {!audio.soundEnabled && <p className={styles.hint}>The five notes need sound on. The recording plays either way.</p>}
    </div>
  );
}

function ArtApp({ content, props }) {
  const initial = props.figure
    ? content.artworks.findIndex((art) => art.id === props.figure)
    : props.panel !== undefined
      ? content.artworks.findIndex((art) => art.channel === "art" && art.panel === props.panel)
      : 0;
  const [index, setIndex] = useState(Math.max(initial, 0));
  useEffect(() => setIndex(Math.max(initial, 0)), [initial]);
  const art = content.artworks[index];
  return (
    <div className={styles.artApp}>
      <figure className={styles.artwork}>
        <img src={art.src} width={art.width} height={art.height} alt={art.alt} />
        <figcaption>
          <span className={styles.eyebrow}>{content.channelsById[art.channel].title}</span> {art.caption}{" "}
          {art.href && <ExternalLink href={art.href}>Source</ExternalLink>}
        </figcaption>
      </figure>
      <ul className={styles.thumbs} aria-label="All images">
        {content.artworks.map((entry, entryIndex) => (
          <li key={entry.id}>
            <button type="button" aria-pressed={entryIndex === index} onClick={() => setIndex(entryIndex)}>
              <img src={entry.src} alt="" width={entry.width} height={entry.height} loading="lazy" />
              <span className={styles.visuallyHidden}>{entry.caption}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilesApp({ terminal, props, onOpen }) {
  const [path, setPath] = useState(props.path ?? "/");
  const [file, setFile] = useState(null);
  useEffect(() => {
    if (props.path) setPath(props.path);
  }, [props.path]);
  const node = lookup(terminal.tree, path) ?? terminal.tree;
  const parts = path.split("/").filter(Boolean);
  const selected = file ? lookup(terminal.tree, file) : null;
  return (
    <div className={styles.files}>
      <nav className={styles.breadcrumbs} aria-label="Folder">
        <button type="button" onClick={() => { setPath("/"); setFile(null); }}>vanta</button>
        {parts.map((part, index) => (
          <span key={part}>
            {" / "}
            <button type="button" onClick={() => { setPath("/" + parts.slice(0, index + 1).join("/")); setFile(null); }}>
              {part}
            </button>
          </span>
        ))}
      </nav>
      <div className={styles.split}>
        <ul className={styles.fileList}>
          {listing(node).map((name) => {
            const isDir = name.endsWith("/");
            const childPath = (path === "/" ? "" : path) + "/" + name.replace(/\/$/, "");
            return (
              <li key={name}>
                <button
                  type="button"
                  data-dir={isDir ? "true" : undefined}
                  aria-current={childPath === file ? "true" : undefined}
                  onClick={() => (isDir ? (setPath(childPath), setFile(null)) : setFile(childPath))}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
        <div className={styles.splitDetail}>
          {selected ? (
            <>
              <pre className={styles.filePreview}>{selected.text}</pre>
              {selected.open && (
                <button type="button" className={styles.primarySmall} onClick={() => onOpen(selected.open)}>
                  Open
                </button>
              )}
            </>
          ) : (
            <p className={styles.meta}>Choose a file. The tree is the portfolio: five channels, the threads, and the research catalog.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExperimentsApp({ content, practice, audio, reducedMotion, props, onFind, onResolved }) {
  const [view, setView] = useState(props.experiment === "resolve" ? "resolve" : "list");
  useEffect(() => {
    if (props.experiment === "resolve") setView("resolve");
  }, [props.experiment]);
  if (view === "resolve") {
    return (
      <div className={styles.appPad}>
        <button type="button" className={styles.textButton} onClick={() => setView("list")}>
          <span aria-hidden="true">←</span> All experiments
        </button>
        <h3 className={styles.subhead}>Resolve</h3>
        <Resolve channels={practice.channels} audio={audio} reducedMotion={reducedMotion} onResolved={onResolved} />
      </div>
    );
  }
  return (
    <div className={styles.appPad}>
      <h3 className={styles.subhead}>Here, in this studio</h3>
      <ul className={styles.launcher}>
        <li>
          <button type="button" onClick={() => setView("resolve")}>
            <strong>Resolve</strong>
            <span>A tuning game: five strings, one chord. Playable here.</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onFind("scope")}>
            <strong>Signal generator</strong>
            <span>On the Workbench, wired to an oscilloscope.</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onFind("chladni")}>
            <strong>Resonance plate</strong>
            <span>Sand on a driven plate, gathering on its nodal lines.</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onFind("keyboard")}>
            <strong>Synthesizer</strong>
            <span>Two octaves in the Recording Studio, tuned to the rooms.</span>
          </button>
        </li>
      </ul>
      <h3 className={styles.subhead}>Live elsewhere</h3>
      <p className={styles.meta}>Works marked Live in the portfolio. Each opens the real site in a new tab.</p>
      <ul className={styles.launcher}>
        {content.live.map((entry) => (
          <li key={entry.id}>
            <ExternalLink href={entry.href} className={styles.launchLink}>
              <strong>{entry.title}</strong>
              <span>
                {entry.label} · {entry.status.join(" · ")}
              </span>
            </ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReaderApp({ content, props }) {
  const [volumeId, setVolumeId] = useState(props.volume ?? content.volumes[0]?.id);
  useEffect(() => {
    if (props.volume) setVolumeId(props.volume);
  }, [props.volume]);
  const volume = content.volumes.find((entry) => entry.id === volumeId) ?? content.volumes[0];
  return (
    <div className={styles.split}>
      <nav className={styles.splitList} aria-label="Volumes">
        <ul>
          {content.volumes.map((entry) => (
            <li key={entry.id}>
              <button type="button" aria-current={entry.id === volume.id ? "true" : undefined} onClick={() => setVolumeId(entry.id)}>
                {entry.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.splitDetail}>
        <Reader volume={volume} headingLevel={3} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- desktop */

let windowSerial = 0;

export default function Desktop({
  originRect,
  onLeave,
  content,
  practice,
  terminal,
  recording,
  audio,
  reducedMotion,
  compact,
  actions,
}) {
  const rootRef = useRef(null);
  const areaRef = useRef(null);
  const [windows, setWindows] = useState(() => {
    windowSerial += 2;
    return [
      { id: windowSerial - 1, app: "projects", props: {}, x: 300, y: 70, z: 1 },
      { id: windowSerial, app: "terminal", props: {}, x: 56, y: 40, z: 2 },
    ];
  });
  const [focused, setFocused] = useState(windowSerial);
  const [clock, setClock] = useState("");
  const zTop = useRef(2);

  // Grow out of the monitor the camera has just sat down in front of.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !originRect || reducedMotion) return;
    const scaleX = originRect.width / window.innerWidth;
    const scaleY = originRect.height / window.innerHeight;
    root.animate(
      [
        { transformOrigin: "0 0", transform: `translate(${originRect.left}px, ${originRect.top}px) scale(${scaleX}, ${scaleY})`, opacity: 0.4 },
        { transformOrigin: "0 0", transform: "translate(0, 0) scale(1, 1)", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(0.2, 0.7, 0.1, 1)" }
    );
  }, [originRect, reducedMotion]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const update = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const openApp = useCallback((app, props = {}) => {
    if (!APPS[app]) return;
    setWindows((current) => {
      zTop.current += 1;
      const existing = current.find((entry) => entry.app === app);
      if (existing) {
        setFocused(existing.id);
        return current.map((entry) =>
          entry.id === existing.id ? { ...entry, props: { ...props }, z: zTop.current, minimized: false } : entry
        );
      }
      windowSerial += 1;
      const offset = (current.length % 6) * 32;
      setFocused(windowSerial);
      return [...current, { id: windowSerial, app, props, x: 90 + offset, y: 56 + offset, z: zTop.current }];
    });
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((current) => {
      const rest = current.filter((entry) => entry.id !== id);
      const top = rest.reduce((best, entry) => (!best || entry.z > best.z ? entry : best), null);
      setFocused(top ? top.id : null);
      return rest;
    });
  }, []);

  const focusWindow = (id) => {
    zTop.current += 1;
    setFocused(id);
    setWindows((current) => current.map((entry) => (entry.id === id ? { ...entry, z: zTop.current } : entry)));
  };

  // Escape closes the window in front; with none left, it leaves the computer.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (focused !== null && windows.some((entry) => entry.id === focused)) closeWindow(focused);
      else onLeave();
    };
    const root = rootRef.current;
    root?.addEventListener("keydown", onKeyDown);
    return () => root?.removeEventListener("keydown", onKeyDown);
  }, [focused, windows, closeWindow, onLeave]);

  const startDrag = (event, id) => {
    if (compact || event.button !== 0 || event.target.closest("button")) return;
    const win = windows.find((entry) => entry.id === id);
    const area = areaRef.current.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, wx: win.x, wy: win.y };
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
    focusWindow(id);
    const move = (moveEvent) => {
      const x = Math.min(Math.max(start.wx + moveEvent.clientX - start.x, -200), area.width - 120);
      const y = Math.min(Math.max(start.wy + moveEvent.clientY - start.y, 0), area.height - 40);
      setWindows((current) => current.map((entry) => (entry.id === id ? { ...entry, x, y } : entry)));
    };
    const up = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
  };

  const handleEffect = useCallback(
    (effect) => {
      if (effect.type === "window") openApp(effect.app, effect.props);
      else if (effect.type === "goto") actions.goto(effect.room);
      else if (effect.type === "chord") actions.soundChord();
      else if (effect.type === "exit") onLeave();
    },
    [openApp, actions, onLeave]
  );

  const renderApp = (win) => {
    const active = win.id === focused;
    switch (win.app) {
      case "terminal":
        return <TerminalApp terminal={terminal} onEffect={handleEffect} active={active} />;
      case "projects":
        return <ProjectsApp content={content} practice={practice} props={win.props} onFind={actions.find} />;
      case "atlas":
        return <AtlasApp props={win.props} recordCount={content.recordCount} />;
      case "music":
        return <MusicApp content={content} recording={recording} audio={audio} onChord={actions.soundChord} onFind={actions.find} />;
      case "art":
        return <ArtApp content={content} props={win.props} />;
      case "files":
        return <FilesApp terminal={terminal} props={win.props} onOpen={(open) => openApp(open.app, open.props)} />;
      case "experiments":
        return (
          <ExperimentsApp
            content={content}
            practice={practice}
            audio={audio}
            reducedMotion={reducedMotion}
            props={win.props}
            onFind={actions.find}
            onResolved={actions.resolved}
          />
        );
      case "reader":
        return <ReaderApp content={content} props={win.props} />;
      default:
        return null;
    }
  };

  const ordered = [...windows].sort((a, b) => a.z - b.z);
  return (
    <div
      ref={rootRef}
      className={styles.desktop}
      role="dialog"
      aria-modal="true"
      aria-label="The studio computer"
      tabIndex={-1}
      data-compact={compact ? "true" : "false"}
    >
      <header className={styles.menuBar}>
        <span className={styles.menuBrand}>
          <HorizonMark className={styles.menuMark} /> Vanta
        </span>
        <span className={styles.menuClock} aria-hidden="true">
          {clock}
        </span>
        <button type="button" className={styles.leave} onClick={onLeave}>
          Leave the computer <kbd>Esc</kbd>
        </button>
      </header>
      <div ref={areaRef} className={styles.desktopArea}>
        <p className={styles.wallpaper} aria-hidden="true">
          G3 · C4 · E4 · G4 · C5
        </p>
        {ordered.map((win) => {
          const app = APPS[win.app];
          const isFocused = win.id === focused;
          if (compact && !isFocused) return null;
          return (
            <section
              key={win.id}
              className={styles.window}
              data-focused={isFocused ? "true" : "false"}
              aria-labelledby={`window-title-${win.id}`}
              style={
                compact
                  ? undefined
                  : { left: win.x, top: win.y, width: app.size[0], height: app.size[1], zIndex: win.z }
              }
              onPointerDown={() => !isFocused && focusWindow(win.id)}
            >
              <header className={styles.windowBar} onPointerDown={(event) => startDrag(event, win.id)}>
                <h2 id={`window-title-${win.id}`} className={styles.windowTitle}>
                  <span aria-hidden="true" className={styles.windowGlyph}>
                    {app.glyph}
                  </span>
                  {app.title}
                </h2>
                <button type="button" className={styles.windowClose} onClick={() => closeWindow(win.id)} aria-label={`Close ${app.title}`}>
                  <span aria-hidden="true">×</span>
                </button>
              </header>
              <div className={styles.windowBody}>{renderApp(win)}</div>
            </section>
          );
        })}
      </div>
      <nav className={styles.dock} aria-label="Applications">
        {DOCK.map((app) => {
          const running = windows.some((entry) => entry.app === app);
          return (
            <button
              key={app}
              type="button"
              onClick={() => openApp(app)}
              data-running={running ? "true" : undefined}
              aria-label={`${APPS[app].title}${running ? ", open" : ""}`}
            >
              <span aria-hidden="true" className={styles.dockGlyph}>
                {APPS[app].glyph}
              </span>
              <span className={styles.dockLabel}>{APPS[app].title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

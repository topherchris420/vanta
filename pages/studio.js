import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import practice from "../data/practice";
import SearchEngine from "../lib/research/searchEngine";
import studioContent from "../lib/studio/content";
import terminalModel from "../lib/studio/terminal";
import quality from "../lib/studio/quality";
import instruments from "../lib/studio/instruments";
import { isMobileDevice, prefersReducedMotion, supportsWebGL } from "../lib/runtimeCapabilities";
import useStudioAudio from "../hooks/useStudioAudio";
import useRecording from "../hooks/useRecording";
import StudioIntro from "../components/studio/StudioIntro";
import StudioHud from "../components/studio/StudioHud";
import StudioIndex from "../components/studio/StudioIndex";
import StudioMap from "../components/studio/StudioMap";
import TouchControls from "../components/studio/TouchControls";
import SoundControl from "../components/studio/SoundControl";
import Discoveries from "../components/studio/Discoveries";
import TourCard from "../components/studio/TourCard";
import ObjectPanel from "../components/studio/panels/ObjectPanel";
import Desktop from "../components/studio/Desktop";
import styles from "../styles/Studio.module.css";

const StudioStage = dynamic(() => import("../components/studio/StudioStage"), { ssr: false });

const { buildStudioContent } = studioContent;
const { createTerminal } = terminalModel;
const { TIERS, initialTier } = quality;
const { CHLADNI_MODES, SYNTH_DEFAULTS, normalizeSynth, midiToFrequency } = instruments;

const FOUND_KEY = "vanta:studio:found:v1";
const siteUrl = "https://mitpress.vercel.app";
const description =
  "A walkable studio built from Christopher Woodyard's portfolio: a library, a workbench, a simulation room, a gallery, and a recording studio, one for each of Vanta's five channels.";

export default function Studio({ documents, notes }) {
  const router = useRouter();
  const content = useMemo(() => buildStudioContent({ practice, documents, notes }), [documents, notes]);
  const { layout } = content;
  const objectsById = useMemo(() => new Map(layout.objects.map((object) => [object.id, object])), [layout]);
  const zonesById = useMemo(() => new Map(layout.zones.map((zone) => [zone.id, zone])), [layout]);
  const engine = useMemo(() => new SearchEngine({ documents }), [documents]);
  const terminal = useMemo(
    () =>
      createTerminal({
        practice,
        documents,
        volumes: content.volumes,
        search: (query) => engine.search(query, { hops: 1 }).results.map((result) => result.document),
        chordName: content.coda.chordName,
      }),
    [documents, content, engine]
  );

  const apiRef = useRef(null);
  const mainRef = useRef(null);
  const audio = useStudioAudio();
  const recording = useRecording(content.channelsById.music.artifact);

  const [env, setEnv] = useState({ ready: false, isMobile: false, reducedMotion: false, touch: false });
  const [webgl, setWebgl] = useState("pending");
  const [apiReady, setApiReady] = useState(false);
  const [tierId, setTierId] = useState(null);
  const [tierChoice, setTierChoice] = useState("auto");
  const [phase, setPhase] = useState("intro");
  const [mode, setMode] = useState("walk");
  const [panelId, setPanelId] = useState(null);
  const [desktop, setDesktop] = useState(null);
  const [tourIndex, setTourIndex] = useState(null);
  const [zone, setZone] = useState(() => zonesById.get("hall"));
  const [target, setTarget] = useState(null);
  const [overlays, setOverlays] = useState({ map: false, index: false, help: false, found: false });
  const [found, setFound] = useState(() => new Set());
  const [notice, setNotice] = useState("");
  const [cut, setCut] = useState(false);
  const [chord, setChord] = useState(null);
  const chordTimer = useRef(0);

  const [scope, setScopeState] = useState({ frequency: 440, shape: "sine", amplitude: 0.8, mode: "time", ratio: 1.5, ratioLabel: "3:2", output: false });
  const [plate, setPlateState] = useState({ frequency: CHLADNI_MODES[5].frequency, drive: false });
  const [synth, setSynthState] = useState(SYNTH_DEFAULTS);
  const [held, setHeld] = useState([]);
  const [lampOn, setLampOn] = useState(false);
  const [patched, setPatched] = useState(false);
  const [controllersUp, setControllersUp] = useState(false);
  const [archiveModel, setArchiveModel] = useState(0);

  const live = webgl === "active";
  const fallback = webgl === "fallback";
  const api = () => (live ? apiRef.current : null);

  /* ------------------------------------------------------------ runtime */

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const read = () =>
      setEnv({ ready: true, isMobile: isMobileDevice(), reducedMotion: prefersReducedMotion(), touch: coarse.matches });
    read();
    const supported = supportsWebGL();
    if (!supported) setWebgl("fallback");
    setTierId(
      initialTier({
        isMobile: isMobileDevice(),
        reducedMotion: motion.matches,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      })
    );
    try {
      const stored = JSON.parse(window.localStorage.getItem(FOUND_KEY) || "[]");
      const known = new Set(layout.discoveries.map((entry) => entry.id));
      if (Array.isArray(stored)) setFound(new Set(stored.filter((id) => known.has(id))));
    } catch {
      // A fresh visit, then.
    }
    motion.addEventListener("change", read);
    coarse.addEventListener("change", read);
    return () => {
      motion.removeEventListener("change", read);
      coarse.removeEventListener("change", read);
    };
  }, [layout]);

  const announce = useCallback((text) => setNotice(text), []);

  const flashCut = useCallback(() => {
    if (!env.reducedMotion) return;
    setCut(true);
    window.setTimeout(() => setCut(false), 240);
  }, [env.reducedMotion]);

  const discover = useCallback(
    (id) => {
      setFound((previous) => {
        if (previous.has(id)) return previous;
        const next = new Set(previous).add(id);
        try {
          window.localStorage.setItem(FOUND_KEY, JSON.stringify([...next]));
        } catch {
          // Storage is a convenience.
        }
        const entry = layout.discoveries.find((item) => item.id === id);
        if (entry) announce(`Found: ${entry.title}. ${next.size} of ${layout.discoveries.length}.`);
        return next;
      });
    },
    [layout, announce]
  );

  /* -------------------------------------------------------------- chords */

  const threadChord = useCallback(
    (id) => {
      const thread = content.threads.find((entry) => entry.id === id);
      return { id: `thread-${id}`, name: thread.name, channelIds: thread.channelIds, frequencies: thread.frequencies };
    },
    [content]
  );
  const codaChord = useMemo(
    () => ({ id: "coda", name: content.coda.name, channelIds: content.coda.channelIds, frequencies: content.coda.frequencies }),
    [content]
  );

  // A chord lights its rooms and, with sound on, sounds once. A held chord
  // stays lit until released; an unheld one lets go after a few seconds.
  const sound = useCallback(
    (next, { hold = false, position } = {}) => {
      window.clearTimeout(chordTimer.current);
      setChord(next);
      if (!recording.playing) audio.strum(next.frequencies, { position });
      if (!hold) {
        chordTimer.current = window.setTimeout(
          () => setChord((current) => (current && current.id === next.id ? null : current)),
          5200
        );
      }
    },
    [audio, recording.playing]
  );
  useEffect(() => () => window.clearTimeout(chordTimer.current), []);

  /* --------------------------------------------- state into the scene */

  useEffect(() => {
    api()?.setChord(chord ? chord.channelIds : null);
  }, [chord, apiReady, live]);
  useEffect(() => {
    api()?.setScope(scope);
    audio.setGenerator({ on: scope.output && audio.soundEnabled && !recording.playing, ...scope });
  }, [scope, apiReady, live, audio.soundEnabled, recording.playing]);
  useEffect(() => {
    api()?.setPlate(plate);
    audio.setDrive({ on: plate.drive && audio.soundEnabled && !recording.playing, frequency: plate.frequency });
  }, [plate, apiReady, live, audio.soundEnabled, recording.playing]);
  useEffect(() => {
    api()?.setSynth({ params: synth, held });
  }, [synth, held, apiReady, live]);
  useEffect(() => {
    api()?.setRecord({ playing: recording.playing, time: recording.time });
    if (recording.playing) {
      discover("record");
      audio.releaseStrums();
      audio.spatializeRecording(recording.audioRef.current, [-3.08, 0.95, 6.47]);
    }
  }, [recording.playing, recording.time, apiReady, live]);
  useEffect(() => {
    api()?.setLamp(lampOn);
  }, [lampOn, apiReady, live]);
  useEffect(() => {
    api()?.setPatched(patched);
  }, [patched, apiReady, live]);
  useEffect(() => {
    api()?.setControllers(controllersUp);
  }, [controllersUp, apiReady, live]);
  useEffect(() => {
    if (apiReady) api()?.setArchiveModel(archiveModel);
  }, [archiveModel, apiReady, live]);
  useEffect(() => {
    api()?.setReducedMotion(env.reducedMotion);
  }, [env.reducedMotion, apiReady, live]);
  useEffect(() => {
    api()?.setCovered(Boolean(desktop));
  }, [desktop, apiReady, live]);

  // An open panel takes the right of the screen, or the bottom on a phone;
  // the camera centres the object in what is left.
  useEffect(() => {
    const scene = api();
    if (!scene) return undefined;
    const apply = () => {
      if (!panelId && tourIndex === null) {
        scene.setInset({ right: 0, bottom: 0 });
        return;
      }
      const wide = window.innerWidth > 760;
      if (panelId) {
        scene.setInset(wide ? { right: Math.min(460, window.innerWidth * 0.45), bottom: 0 } : { right: 0, bottom: window.innerHeight * 0.5 });
      } else {
        scene.setInset(wide ? { right: 0, bottom: 0 } : { right: 0, bottom: window.innerHeight * 0.3 });
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [panelId, tourIndex, apiReady, live]);

  // The listener follows the visitor, so placed sounds stay where they are.
  useEffect(() => {
    if (!audio.soundEnabled || !live) return undefined;
    const timer = window.setInterval(() => {
      const pose = apiRef.current?.getPose();
      if (pose) audio.setListener(pose);
    }, 100);
    return () => window.clearInterval(timer);
  }, [audio.soundEnabled, live, audio]);

  /* ----------------------------------------------------------- moving */

  const openComputer = useCallback(async () => {
    setPanelId(null);
    setTourIndex(null);
    setOverlays((current) => ({ ...current, index: false }));
    announce("At the computer.");
    const scene = api();
    if (scene) {
      setMode("moving");
      flashCut();
      await scene.focus("computer");
      setDesktop({ rect: scene.getScreenRect("computer") });
    } else {
      setDesktop({ rect: null });
    }
    setMode("desktop");
  }, [live, announce, flashCut]);

  const openObject = useCallback(
    (id) => {
      const object = objectsById.get(id);
      if (!object) return;
      if (object.kind === "computer") {
        openComputer();
        return;
      }
      setTourIndex(null);
      setOverlays((current) => ({ ...current, index: false, help: false, found: false }));
      setPanelId(id);
      setMode("panel");
      const scene = api();
      if (scene) {
        flashCut();
        scene.focus(id);
      }
    },
    [objectsById, openComputer, live, flashCut]
  );

  const releaseInstrument = useCallback((object) => {
    if (!object) return;
    if (object.kind === "keyboard") {
      audio.allNotesOff();
      setHeld([]);
    }
    if (object.kind === "scope") setScopeState((current) => ({ ...current, output: false }));
    if (object.kind === "chladni") setPlateState((current) => ({ ...current, drive: false }));
    if (object.kind === "coda") setChord((current) => (current && (current.id === "coda" || current.id.startsWith("thread-")) ? null : current));
  }, [audio]);

  const closePanel = useCallback(() => {
    releaseInstrument(objectsById.get(panelId));
    setPanelId(null);
    setMode("walk");
    const scene = api();
    if (scene) {
      flashCut();
      scene.release();
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [panelId, objectsById, releaseInstrument, live, flashCut]);

  const leaveComputer = useCallback(() => {
    setDesktop(null);
    setMode("walk");
    api()?.release();
    announce("Back in the studio.");
    mainRef.current?.focus({ preventScroll: true });
  }, [live, announce]);

  const find = useCallback(
    (objectId) => {
      if (desktop) setDesktop(null);
      if (panelId) releaseInstrument(objectsById.get(panelId));
      openObject(objectId);
    },
    [desktop, panelId, objectsById, releaseInstrument, openObject]
  );

  const goto = useCallback(
    (roomId) => {
      if (desktop) setDesktop(null);
      if (panelId) releaseInstrument(objectsById.get(panelId));
      setPanelId(null);
      setTourIndex(null);
      setMode("walk");
      const room = zonesById.get(roomId);
      announce(`Walking to ${room?.name ?? roomId}.`);
      const scene = api();
      if (scene) {
        flashCut();
        scene.goto(roomId);
      }
    },
    [desktop, panelId, objectsById, zonesById, releaseInstrument, announce, live, flashCut]
  );

  const enter = useCallback(() => {
    setPhase("studio");
    setMode("walk");
    const scene = api();
    if (scene) {
      flashCut();
      scene.enter();
      announce("In the Hall. The workstation is ahead, the Event Horizon Archive beyond it.");
      window.setTimeout(() => mainRef.current?.focus({ preventScroll: true }), 50);
    } else {
      setOverlays((current) => ({ ...current, index: true }));
      window.setTimeout(() => document.getElementById("studio-index")?.focus(), 50);
    }
  }, [live, announce, flashCut]);

  const startTour = useCallback(() => {
    setPhase("studio");
    setMode("tour");
    setTourIndex(0);
  }, []);

  const endTour = useCallback(() => {
    setTourIndex(null);
    setMode("walk");
    api()?.stand();
    mainRef.current?.focus({ preventScroll: true });
  }, [live]);

  useEffect(() => {
    if (tourIndex === null) return;
    const stop = content.tour[tourIndex];
    const scene = api();
    if (scene) {
      flashCut();
      scene.view(stop.view);
    }
    if (stop.object === "coda") {
      scene?.strikeChimes(codaChord.channelIds);
      sound(codaChord, { position: [-3.12, 2, 0] });
    }
  }, [tourIndex, apiReady, live]);

  /* -------------------------------------------------------- the things */

  const anchorOf = (id) => objectsById.get(id)?.anchor;

  const synthRef = useRef(synth);
  synthRef.current = synth;
  const controllersRef = useRef(controllersUp);
  controllersRef.current = controllersUp;

  const audioRef = useRef(audio);
  audioRef.current = audio;
  const playingRef = useRef(recording.playing);
  playingRef.current = recording.playing;

  const noteOn = useCallback(
    (midi) => {
      setHeld((current) => (current.includes(midi) ? current : [...current, midi]));
      if (!playingRef.current) audioRef.current.noteOn(midi, synthRef.current);
      if (controllersRef.current && midi === 60) discover("third-note");
    },
    [discover]
  );
  const noteOff = useCallback((midi) => {
    setHeld((current) => current.filter((value) => value !== midi));
    audioRef.current.noteOff(midi);
  }, []);

  const instrumentsState = {
    scope,
    setScope: (next) => setScopeState((current) => ({ ...current, ...next })),
    plate,
    setPlate: (next) => setPlateState((current) => ({ ...current, ...next })),
    scatterPlate: () => api()?.scatterPlate(),
    synth,
    setSynth: (next) => setSynthState((current) => normalizeSynth({ ...current, ...next })),
    held,
    noteOn,
    noteOff,
    recording,
  };

  const actions = {
    close: closePanel,
    open: openObject,
    find,
    goto,
    toggleLamp: () => {
      const next = !lampOn;
      setLampOn(next);
      if (next) {
        discover("lamp");
        discover("provenance");
        sound(threadChord("provenance"), { position: anchorOf("lamp") });
      }
    },
    strikeFork: () => {
      api()?.strikeFork();
      discover("resonance");
      sound(threadChord("resonance"), { position: anchorOf("fork") });
    },
    toggleControllers: () => {
      const next = !controllersUp;
      setControllersUp(next);
      if (next) {
        discover("agency");
        sound(threadChord("agency"), { position: anchorOf("seats") });
      }
    },
    holdThird: (start) => {
      const agency = content.threads.find((thread) => thread.id === "agency");
      if (start) {
        discover("third-note");
        sound(
          {
            id: "third",
            name: "With the third",
            channelIds: [...new Set(["writing", ...agency.channelIds])],
            frequencies: [midiToFrequency(60), ...agency.frequencies],
          },
          { hold: true, position: anchorOf("seats") }
        );
      } else {
        setChord((current) => (current?.id === "third" ? null : current));
      }
    },
    togglePatch: () => {
      const next = !patched;
      setPatched(next);
      if (next) {
        discover("translation");
        sound(threadChord("translation"), { position: anchorOf("patch") });
      }
    },
    soundChord: () => {
      if (chord?.id === "coda" && panelId === "coda") {
        setChord(null);
        return;
      }
      api()?.strikeChimes(codaChord.channelIds);
      discover("coda");
      sound(codaChord, { hold: panelId === "coda", position: [-3.12, 2, 0] });
    },
    tuneThread: (id) => {
      const next = threadChord(id);
      if (chord?.id === next.id) {
        setChord(null);
        return;
      }
      api()?.strikeChimes(next.channelIds);
      sound(next, { hold: true, position: [-3.12, 2, 0] });
    },
    setArchiveModel: (index) => {
      setArchiveModel(index);
      discover("write-event");
    },
    nextArchiveModel: () => {
      setArchiveModel((current) => (current + 1) % 4);
      discover("write-event");
    },
    crossIntoAtlas: (event) => {
      event.preventDefault();
      api()?.archivePulse();
      window.setTimeout(() => router.push("/research"), env.reducedMotion ? 150 : 800);
    },
    resolved: () => {
      discover("resolved");
      sound(codaChord);
    },
  };

  const desktopActions = useMemo(
    () => ({ goto, find, soundChord: () => { discover("coda"); sound(codaChord); }, resolved: actions.resolved }),
    // actions.resolved reads only stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goto, find, discover, sound, codaChord]
  );

  /* ------------------------------------------------------------- input */

  const onSoundToggle = useCallback(async () => {
    const on = await audio.toggleSound();
    if (on) {
      announce("Sound on.");
      if (zone?.kind === "channel") audio.bell(zone.frequency, [zone.pendant.x, zone.pendant.y, zone.pendant.z]);
      else audio.strum(content.coda.frequencies);
    } else {
      announce("Sound off.");
      setScopeState((current) => ({ ...current, output: false }));
    }
  }, [audio, zone, content, announce]);

  const toggleOverlay = useCallback(
    (name) => setOverlays((current) => ({ ...current, [name]: !current[name] })),
    []
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (desktop || event.metaKey || event.ctrlKey || event.altKey) return;
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key === "Escape") {
        if (overlays.help || overlays.found) {
          setOverlays((current) => ({ ...current, help: false, found: false }));
        } else if (panelId) {
          closePanel();
        } else if (tourIndex !== null) {
          endTour();
        } else if (overlays.index || overlays.map) {
          setOverlays((current) => ({ ...current, index: false, map: false }));
        }
        return;
      }
      if (typing || phase !== "studio" || mode !== "walk") return;
      const onButton = event.target instanceof HTMLElement && /^(BUTTON|A)$/.test(event.target.tagName);
      if ((event.key === "e" || event.key === "E" || (event.key === "Enter" && !onButton)) && target) {
        event.preventDefault();
        openObject(target.id);
      } else if ((event.key === "m" || event.key === "M") && live) {
        toggleOverlay("map");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [desktop, overlays, panelId, tourIndex, phase, mode, target, live, closePanel, endTour, openObject, toggleOverlay]);

  const stageEvents = {
    onReady: (scene) => {
      setWebgl("active");
      setApiReady(true);
      // Browser checks drive the camera through this; visitors never need it.
      if (/[?&]inspect\b/.test(window.location.search)) window.__vantaStudio = scene;
    },
    onFailure: () => {
      setWebgl("fallback");
      setApiReady(false);
      announce("The 3D studio is unavailable here, so it is shown as a text index.");
    },
    onZone: (next) => {
      setZone(next);
      if (phase !== "studio" || desktop) return;
      if (next.kind === "channel") {
        announce(`${next.name}. ${next.lede}`);
        if (audio.soundEnabled && !recording.playing && !chord) {
          audio.bell(next.frequency, [next.pendant.x, next.pendant.y, next.pendant.z]);
        }
      } else {
        announce(next.name + ".");
      }
    },
    onTarget: setTarget,
    onPick: (object) => {
      if (phase !== "studio" || !object || desktop) return;
      if (mode === "walk" || mode === "panel" || mode === "tour") openObject(object.id);
    },
    onTierChange: (next, reason) => {
      setTierId(next);
      if (reason === "auto") announce(`Graphics lowered to ${TIERS[next].label} to keep the studio smooth.`);
    },
  };

  const onTier = (choice) => {
    setTierChoice(choice);
    const scene = api();
    if (choice === "auto") scene?.setAutoQuality(true);
    else {
      scene?.setTier(choice);
      setTierId(choice);
    }
  };

  const panelObject = panelId ? objectsById.get(panelId) : null;
  const panelZone = panelObject ? zonesById.get(panelObject.room) : null;
  const panelState = {
    soundEnabled: audio.soundEnabled,
    lampOn,
    patched,
    controllersUp,
    chord,
    archiveModel,
    discoveries: found,
  };

  const soundControl = (
    <SoundControl soundEnabled={audio.soundEnabled} soundAvailable={audio.soundAvailable} onToggle={onSoundToggle} />
  );

  return (
    <div
      className={styles.studio}
      data-studio-root=""
      data-phase={phase}
      data-mode={mode}
      data-webgl={webgl}
      data-panel={panelObject ? "true" : "false"}
    >
      <Head>
        <title>The Studio — Christopher Woodyard · Vanta</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="canonical" href={`${siteUrl}/studio`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Vanta" />
        <meta property="og:url" content={`${siteUrl}/studio`} />
        <meta property="og:title" content="The Studio — Five notes. One chord." />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${siteUrl}/og-vanta.jpg`} />
      </Head>

      <a href="#studio-index" className={styles.skipLink}>
        Skip to the studio index
      </a>

      {env.ready && tierId && !fallback && (
        <StudioStage
          apiRef={apiRef}
          layout={layout}
          practice={practice}
          documents={documents}
          tierId={tierId}
          reducedMotion={env.reducedMotion}
          isMobile={env.isMobile}
          controlsEnabled={phase === "studio" && mode === "walk"}
          events={stageEvents}
          className={styles.stage}
        />
      )}
      <div className={styles.vignette} aria-hidden="true" />

      <main id="studio-main" ref={mainRef} tabIndex={-1} className={styles.main}>
        {phase === "intro" && (
          <StudioIntro onEnter={enter} onTour={startTour} soundControl={soundControl} webgl={webgl} />
        )}

        {phase === "studio" && (
          <StudioHud
            zone={zone}
            chord={chord}
            target={target}
            interactLabel={target?.verb}
            onInteract={() => target && openObject(target.id)}
            soundControl={soundControl}
            discoveries={found}
            totalDiscoveries={layout.discoveries.length}
            panels={overlays}
            onToggle={toggleOverlay}
            tierChoice={tierChoice}
            onTier={onTier}
            touch={env.touch}
            showPrompt={mode === "walk" && live}
            canMap={live}
          />
        )}

        <StudioIndex
          content={content}
          practice={practice}
          onOpen={openObject}
          open={overlays.index}
          fallback={fallback && phase === "studio"}
          onClose={() => setOverlays((current) => ({ ...current, index: false }))}
        />

        {panelObject && (
          <ObjectPanel
            object={panelObject}
            zone={panelZone}
            practice={practice}
            content={content}
            state={panelState}
            actions={actions}
            instruments={instrumentsState}
          />
        )}

        {tourIndex !== null && (
          <TourCard
            stop={content.tour[tourIndex]}
            index={tourIndex}
            count={content.tour.length}
            onPrevious={() => setTourIndex((current) => Math.max(current - 1, 0))}
            onNext={() => setTourIndex((current) => Math.min(current + 1, content.tour.length - 1))}
            onEnd={endTour}
          />
        )}

        {phase === "studio" && overlays.map && live && (
          <StudioMap
            layout={layout}
            apiRef={apiRef}
            zoneId={zone?.id}
            chordIds={chord?.channelIds}
            onGo={goto}
          />
        )}

        {overlays.found && (
          <Discoveries
            list={layout.discoveries}
            found={found}
            onClose={() => setOverlays((current) => ({ ...current, found: false }))}
          />
        )}

        {env.touch && phase === "studio" && mode === "walk" && live && <TouchControls apiRef={apiRef} />}

        <div className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
          {notice}
        </div>
      </main>

      {desktop && (
        <Desktop
          originRect={desktop.rect}
          onLeave={leaveComputer}
          content={content}
          practice={practice}
          terminal={terminal}
          recording={recording}
          audio={audio}
          reducedMotion={env.reducedMotion}
          compact={env.isMobile}
          actions={desktopActions}
        />
      )}

      {recording.element}
      {cut && <div className={styles.cut} aria-hidden="true" />}
    </div>
  );
}

export async function getStaticProps() {
  const fs = require("node:fs");
  const path = require("node:path");
  const catalog = require("../data/research/curatedKnowledge.json");
  const mathResearch = fs.readFileSync(path.join(process.cwd(), "docs", "MATH_RESEARCH.md"), "utf8");
  return { props: { documents: catalog.documents, notes: { mathResearch } } };
}

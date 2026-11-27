import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import study from "../../data/research/tuningStudy.json";
import audio from "../../lib/research/tuningAudio";
import styles from "../../styles/ListeningControl.module.css";

const labels = { graded: "Graded turns", long: "Long holds", tap: "Single taps" };
const source = `https://github.com/topherchris420/satellite-vision-scape/blob/${study.revision}/${study.experiment}`;
const time = (ms) => (ms / 1000).toFixed(2);
const x = (ms) => 42 + (ms / study.windowMs) * 670;

const eventTime = (ms) => `${(ms / 1000).toFixed(3)} s`;

function EventTranscript({ run }) {
  const events = [
    ...run.turns.map(([start, end, direction]) => ({
      start, label: `Turn ${direction} from ${eventTime(start)} to ${eventTime(end)}.`,
    })),
    ...run.overshoots.map((start) => ({
      start, label: `Alignment lost at ${eventTime(start)}.`,
    })),
  ];
  if (run.lockMs !== null) {
    events.push({ start: run.lockMs, label: `Locked at ${eventTime(run.lockMs)}.` });
  }
  events.sort((a, b) => a.start - b.start);
  return <details>
    <summary>{labels[run.id]} event transcript</summary>
    <ol>{events.map((event, index) => <li key={index}>{event.label}</li>)}</ol>
  </details>;
}

function Lane({ run, active, cursor }) {
  return <figure className={`${styles.lane} ${active ? styles.active : ""}`}>
    <figcaption><strong>{labels[run.id]}</strong><span>{run.lockMs === null
      ? "No lock in excerpt" : `Locked at ${time(run.lockMs)} s`}</span></figcaption>
    <svg viewBox="0 0 730 98" role="img" aria-label={`${labels[run.id]}: ${run.turns.length} turns, ${run.overshoots.length} alignment losses. ${run.lockMs === null ? "No lock." : `Locked at ${time(run.lockMs)} seconds.`}`}>
      {[0, 3000, 6000, 9000, 12000, 15000, 18000].map(ms =>
        <g key={ms} className={styles.tick}><line x1={x(ms)} x2={x(ms)} y1="5" y2="73" />
          <text x={x(ms)} y="93" textAnchor="middle">{ms / 1000}</text></g>)}
      <text x="0" y="26" className={styles.tick}>UP</text>
      <text x="0" y="61" className={styles.tick}>DN</text>
      {run.turns.map(([start, end, direction], i) =>
        <rect key={i} x={x(start)} y={direction === "up" ? 14 : 49}
          width={Math.max(2, x(end) - x(start))} height="13" rx="2"
          className={direction === "up" ? styles.up : styles.down} />)}
      {run.overshoots.map((t, i) => <path key={i} className={styles.loss}
        d={`M ${x(t)} 33 l 4 5 -4 5 -4 -5 Z`} />)}
      {run.lockMs !== null && <path className={styles.lock}
        d={`M ${x(run.lockMs) - 5} 37 l 4 5 7 -10`} />}
      {active && cursor !== null && <line x1={x(cursor)} x2={x(cursor)} y1="5" y2="73" className={styles.cursor} />}
    </svg>
    <EventTranscript run={run} />
  </figure>;
}

export default function ListeningToControl() {
  const [selected, select] = useState("graded");
  const [media, setMedia] = useState(null);
  const [cursor, setCursor] = useState(null);
  const run = study.conditions.find((r) => r.id === selected);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([audio.makeWav(run, study.windowMs)], { type: "audio/wav" }));
    setMedia({ id: run.id, url });
    return () => URL.revokeObjectURL(url);
  }, [run]);
  return <>
    <Head><title>Listening to Control | Vanta</title>
      <meta name="description" content="Hear three scripted Pine Gap simulation policies tune the same terminal." /></Head>
    <main className={styles.study}>
      <nav aria-label="Research navigation"><Link href="/research">Vanta Research</Link><span> / </span>Listening to Control</nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>VERS3DYNAMICS / REPLAY INSTRUMENT 01</p>
        <h1>Listening to Control</h1>
        <p>What does overshooting sound like? Compare three scripted policies as they tune the same terminal in Pine Gap’s After Hours simulation.</p>
      </header>
      <section className={styles.listen} aria-labelledby="select-track">
        <div><h2 id="select-track">Select a track</h2>
          <div className={styles.buttons}>{study.conditions.map((c) =>
            <button key={c.id} type="button" aria-pressed={selected === c.id}
              onClick={() => { select(c.id); setCursor(null); }}>{labels[c.id]}</button>)}</div>
        </div>
        {media?.id === run.id && <audio key={run.id} controls preload="metadata" src={media.url}
          aria-label={`Play ${labels[run.id]}`}
          onTimeUpdate={(e) => setCursor(Math.min(study.windowMs, e.currentTarget.currentTime * audio.tapeSpeed * 1000))} />}
        <p className={styles.small}>Press play after choosing a track. Playback runs at 2× simulated time. Higher tone: up. Lower tone: down. Bright tick: alignment lost. Chord: lock. This is synthesized from log events, not recorded audio.</p>
      </section>
      <section aria-labelledby="first-terminal">
        <h2 id="first-terminal">The first terminal</h2>
        <p className={styles.small}>Same seed, first 18 simulated seconds, aligned to the first turn. Each bar lasts as long as the input was held. Diamonds mark lost alignment; a check marks the lock. After the lock chord, the track stays silent so all three clips share the same timeline.</p>
        {study.conditions.map((r) => <Lane key={r.id} run={r} active={r.id === selected} cursor={cursor} />)}
        <p className={styles.axis}>Simulated seconds since first turn</p>
      </section>
      <section className={styles.results} aria-labelledby="full-run">
        <h2 id="full-run">The whole run</h2>
        <p>Long holds entered the alignment zone but kept leaving it before they could lock. Single taps got there without slipping, but took more inputs than graded turns.</p>
        <table><caption className={styles.small}>Seed 1 only. Totals include all terminal activity, not just the clip.</caption>
          <thead><tr><th scope="col">Policy</th><th scope="col">Inputs</th><th scope="col">Losses</th><th scope="col">Locks</th></tr></thead>
          <tbody>{study.conditions.map((r) => <tr key={r.id}><th scope="row">{labels[r.id]}</th>
            <td>{r.runTotals.inputs}</td><td>{r.runTotals.overshoots}</td><td>{r.runTotals.locks} / 4</td></tr>)}</tbody>
        </table>
      </section>
      <footer className={styles.small}>
        <p>One paired illustration, not a listening study or evidence about human performance. The <a href={`${source}/report.md`}>source experiment</a> has ten seeds per condition. The <a href={`${source}/result.json`}>pinned manifest</a> lists the trace hashes.</p>
      </footer>
    </main>
  </>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import math from "../lib/studio/riemann";

const { ZEROS, coefficients, trace, pulseSchedule } = math;
const W=900, H=300, left=50, right=20, top=24, bottom=40;
const duration=5;

export default function RiemannInstrument() {
  const [count,setCount]=useState(32);
  const [limit,setLimit]=useState(100);
  const [scale,setScale]=useState(12);
  const [solo,setSolo]=useState(-1);
  const [volume,setVolume]=useState(35);
  const [playing,setPlaying]=useState(null);
  const [error,setError]=useState("");
  const session=useRef(null);
  const zeros=useMemo(()=>solo>=0 ? [ZEROS[solo]] : ZEROS.slice(0,count),[count,solo]);
  const points=useMemo(()=>trace(limit,zeros),[limit,zeros]);
  const powers=useMemo(()=>pulseSchedule(limit),[limit]);
  const max=Math.max(0.5,...points.flatMap(p=>[Math.abs(p.actual),Math.abs(p.reconstructed)]));
  const x=u=>left+(W-left-right)*(u-Math.log(2))/(Math.log(limit)-Math.log(2));
  const y=v=>top+(H-top-bottom)*(1-v/max)/2;
  const line=key=>points.map((p,i)=>(i?"L":"M")+x(p.u).toFixed(2)+","+y(p[key]).toFixed(2)).join(" ");
  const rms=Math.sqrt(points.reduce((sum,p)=>sum+(p.actual-p.reconstructed)**2,0)/points.length);
  function stop(update=true) {
    const active=session.current;
    session.current=null;
    if(active) {
      clearTimeout(active.timer);
      if(active.context.state!=="closed") active.context.close().catch(()=>{});
    }
    if(update) setPlaying(null);
  }
  useEffect(()=>{
    const hide=()=>{if(document.hidden) stop();};
    document.addEventListener("visibilitychange",hide);
    const leave=()=>stop();
    window.addEventListener("pagehide",leave);
    return ()=>{
      document.removeEventListener("visibilitychange",hide);
      window.removeEventListener("pagehide",leave);
      stop(false);
    };
  },[]);
  function change(setter,value){stop();setter(value);}
  async function play(mode) {
    stop();setError("");
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){setError("Web Audio is unavailable. The visual instrument remains usable.");return;}
    let context;
    try {
      context=new Audio();
      const active={context,timer:null};
      session.current=active;
      setPlaying(mode);
      await context.resume();
      if(session.current!==active)return;
      const start=context.currentTime+0.05;
      const length=mode==="zeros"?duration:8.12;
      const master=context.createGain();
      master.gain.setValueAtTime(0,start);
      master.gain.linearRampToValueAtTime(volume/100*0.36,start+0.035);
      master.gain.setValueAtTime(volume/100*0.36,start+length-0.12);
      master.gain.linearRampToValueAtTime(0,start+length);
      master.connect(context.destination);
      if(mode==="zeros"){
        const normalization=zeros.reduce((s,g)=>s+2/Math.hypot(0.5,g),0);
        for(const g of zeros){
          const {cosine,sine}=coefficients(g);
          const oscillator=context.createOscillator();
          oscillator.frequency.value=scale*g;
          // Web Audio's Fourier coefficients preserve the sign and relative phase
          // of the explicit formula, rather than assigning equal-tempered notes.
          oscillator.setPeriodicWave(context.createPeriodicWave(
            new Float32Array([0,cosine/normalization]),
            new Float32Array([0,sine/normalization]),{disableNormalization:true}));
          oscillator.connect(master);
          oscillator.start(start);oscillator.stop(start+length);
        }
      } else {
        for(const event of powers){
          const oscillator=context.createOscillator();
          const envelope=context.createGain();
          const t=start+event.time;
          // Audible carrier is a convention; position and relative peak weight are arithmetic.
          oscillator.frequency.value=event.k===1?520:320;
          envelope.gain.setValueAtTime(0,t);
          envelope.gain.linearRampToValueAtTime(0.13*event.weight/Math.log(limit),t+0.003);
          envelope.gain.exponentialRampToValueAtTime(0.0001,t+0.035);
          oscillator.connect(envelope);envelope.connect(master);
          oscillator.start(t);oscillator.stop(t+0.037);
        }
      }
      active.timer=setTimeout(()=>{if(session.current===active)stop();},(length+0.15)*1000);
    }catch(e){
      if(session.current?.context===context)stop();
      setError("Sound could not start. Try again or explore the silent visualization.");
    }
  }
  return <>
    <Head><title>The Music of the Primes | Vanta</title><meta name="description" content="Hear the spectral relationship between prime powers and Riemann zeta zeros in Vanta." /></Head>
    <main className="riemann">
      <nav><a href="/studio">← Vanta studio</a><a href="/research">Research atlas ↗</a></nav>
      <header>
        <p className="eyebrow">VERS3DYNAMICS / LISTENING EXPERIMENT 01</p>
        <h1>The music<br/>of the primes.</h1>
        <p className="lede">A staircase made of prime powers. A spectrum made of zeta zeros. Listen to the waves that connect them.</p>
        <p className="muted">Mathematical sonification · 64 zero ordinates · no microphone or external services</p>
      </header>
      <section className="instrument" aria-labelledby="instrument-title">
        <div className="sectionhead"><div><p className="eyebrow">01 / INTERFERENCE</p><h2 id="instrument-title">Reconstruct the arithmetic</h2></div><span className="number">{zeros.length} <small>zero pairs</small></span></div>
        <div className="chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Normalized prime-power residual and reconstruction with ${zeros.length} zero pairs, x from 2 to ${limit}`}>
            {[-1,-.5,0,.5,1].map(v=><g key={v}><line x1={left} x2={W-right} y1={y(v*max)} y2={y(v*max)} stroke="var(--line)" strokeDasharray={v===0?"":"3 5"}/><text x={left-8} y={y(v*max)+4} textAnchor="end">{(v*max).toFixed(1)}</text></g>)}
            {powers.map(e=><line key={e.n} x1={x(Math.log(e.n))} x2={x(Math.log(e.n))} y1={H-bottom} y2={H-bottom+7} stroke={e.k===1?"var(--signal)":"var(--amber)"} opacity=".75"/>)}
            <path d={line("actual")} fill="none" stroke="var(--muted)" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
            <path d={line("reconstructed")} fill="none" stroke="var(--signal)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
            {[2,5,10,20,50,100,200].filter(v=>v<=limit).map(v=><text key={v} x={x(Math.log(v))} y={H-12} textAnchor="middle">{v}</text>)}
          </svg>
          <div className="legend"><span className="actual">Exact midpoint residual</span><span className="reconstructed">Finite zero reconstruction</span><span>Ticks: primes / <em>higher powers</em> · logarithmic x</span></div>
        </div>
        <div className="controls">
          <label>Zero pairs <strong>{count}</strong><input type="range" min="1" max="64" value={count} onChange={e=>{stop();setSolo(-1);setCount(+e.target.value);}}/></label>
          <label>Upper bound x <strong>{limit}</strong><select value={limit} onChange={e=>change(setLimit,+e.target.value)}>{[20,50,100,200].map(n=><option key={n}>{n}</option>)}</select></label>
          <label>Frequency scale <strong>{scale} Hz / γ</strong><input type="range" min="5" max="30" value={scale} onChange={e=>change(setScale,+e.target.value)}/></label>
          <label>Volume <strong>{volume}%</strong><input type="range" min="0" max="100" value={volume} onChange={e=>change(setVolume,+e.target.value)}/></label>
        </div>
        <p className="muted">Sampled RMS discrepancy: {rms.toFixed(3)} (visual sampling, not a proof or uniform error bound). A finite sum cannot reproduce every sharp jump exactly.</p>
        <div className="transport">
          <button onClick={()=>playing==="zeros"?stop():play("zeros")} aria-pressed={playing==="zeros"}>{playing==="zeros"?"■ Stop spectrum":"▶ Hear zero spectrum"}</button>
          <button onClick={()=>playing==="primes"?stop():play("primes")} aria-pressed={playing==="primes"}>{playing==="primes"?"■ Stop scan":"▶ Hear prime-power scan"}</button>
          <button className="quiet" onClick={()=>stop()} disabled={!playing}>Stop all</button>
        </div>
        <p className="muted" role="status">{error || (playing==="zeros"?"Playing the scaled zero frequencies for five seconds.":playing==="primes"?"Scanning prime powers in log(x) over eight seconds.":"Silent until you press play. Changing a control stops playback.")}</p>
      </section>
      <section className="instrument">
        <div className="sectionhead"><div><p className="eyebrow">02 / SPECTRAL REGISTER</p><h2>Isolate a zero</h2></div><button className="quiet" onClick={()=>change(setSolo,-1)} disabled={solo<0}>Restore ensemble</button></div>
        <p className="muted">Select a partial to isolate its contribution in the chart and audio. Heights show the exact relative amplitude 2 / √(¼ + γ²). No pitches are rounded to musical notes.</p>
        <div className="spectrum" aria-label="Zero spectrum, select a partial to isolate">
          {ZEROS.slice(0,count).map((g,i)=><button key={g} className={solo===i?"selected":""} aria-pressed={solo===i} aria-label={`Zero ${i+1}, gamma ${g.toFixed(5)}, ${(g*scale).toFixed(2)} hertz`} title={`γ ${g.toFixed(5)} / ${(g*scale).toFixed(2)} Hz`} onClick={()=>change(setSolo,solo===i?-1:i)}><span style={{height:`${60*Math.hypot(.5,ZEROS[0])/Math.hypot(.5,g)}px`}}/><small>{i+1}</small></button>)}
        </div>
        <p className="readout">{solo>=0?`Zero ${solo+1} · γ = ${ZEROS[solo].toFixed(9)} · ${(ZEROS[solo]*scale).toFixed(2)} Hz`:`Ensemble · ${(ZEROS[0]*scale).toFixed(1)}–${(ZEROS[count-1]*scale).toFixed(1)} Hz`}</p>
      </section>
      <section className="notes">
        <p className="eyebrow">03 / THE MATHEMATICS</p><h2>What you are actually hearing</h2>
        <p>The Chebyshev function ψ₀(x) adds log p for every prime power pᵏ below x, using half the jump at an exact prime power. The explicit formula connects its fluctuations to the nontrivial zeta zeros. On the critical line, ρ = ½ + iγ, each conjugate pair contributes a sinusoid in u = log x.</p>
        <p className="formula">(ψ₀(x) − x)/√x ≈ −2 Σ Re[eⁱᵞᵘ/(½+iγ)] − log(2π)/√x − log(1−x⁻²)/(2√x)</p>
        <p>The spectrum plays only the oscillatory sum, with u = 2π × scale × audio time. The plot also includes the smooth correction terms. The separate prime-power scan maps log x to time, log p to pulse amplitude, and uses two chosen carrier pitches to distinguish primes from higher powers. It is not the same time scale as the spectrum. Overall gain and fades are playback choices.</p>
        <p>The November 20, 2026 formal proof announcement by Levent Alpöge with Claude motivates this instrument. Mathematical review is ongoing. The explicit formula and these numerically computed low zeros predate the announcement; this instrument does not reproduce or validate the new proof, imply a physical sound emitted by primes, or establish the existence of a physical spectral operator.</p>
        <p><a href="https://math.ucr.edu/home/baez/mathematical/riemann_explicit_formula/explicit_formulas.html">Riemann's explicit formulas</a> · <a href="https://www.nature.com/articles/d41586-026-03812-7">November 2026 proof reporting</a> · <a href="https://mpmath.org/doc/current/functions/zeta.html">Numerical zero computation</a> · <a href="https://github.com/topherchris420/vanta">Source code</a></p>
      </section>
      <footer>VANTA / an instrument for noticing.</footer>
    </main>
    <style jsx>{`
      .riemann{max-width:1120px;margin:auto;padding:32px clamp(16px,5vw,64px) 64px}
      nav,.sectionhead,.transport,.legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
      nav{justify-content:space-between;color:var(--muted);font-size:14px}
      header{padding:64px 0 40px}
      .eyebrow{font:12px var(--font-mono);letter-spacing:.13em;color:var(--signal)}
      h1{font-size:clamp(48px,9vw,112px);line-height:.92;letter-spacing:-.065em;margin:24px 0}
      h2{font-size:clamp(23px,4vw,34px);letter-spacing:-.04em;margin:8px 0 16px}
      .lede{max-width:620px;font-size:clamp(19px,3vw,27px);line-height:1.45;color:var(--muted-bright)}
      .muted{color:var(--muted);font-size:14px;line-height:1.6}
      .instrument{padding:clamp(16px,3vw,32px);border:1px solid var(--line);background:var(--surface);margin-bottom:20px;border-radius:12px}
      .sectionhead{justify-content:space-between}
      .number{font-size:32px;font-family:var(--font-mono);color:var(--signal)}
      .number small{font-size:12px;color:var(--muted)}
      .chart{background:var(--ink);border:1px solid var(--line);padding:8px;border-radius:6px}
      svg{width:100%;display:block} svg text{font:12px var(--font-mono);fill:var(--muted)}
      .legend{font-size:12px;color:var(--muted);padding:8px}
      .legend span:before{content:"";display:inline-block;width:16px;height:2px;background:var(--muted);vertical-align:middle;margin-right:6px}
      .legend .reconstructed:before{background:var(--signal)} .legend em{color:var(--amber);font-style:normal}
      .controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;margin:24px 0}
      label{display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--muted)}
      label strong{font:16px var(--font-mono);color:var(--paper)}
      input{width:100%;accent-color:var(--signal);min-height:36px}
      select,button{background:var(--surface-raised);color:var(--paper);border:1px solid var(--line);border-radius:5px;padding:12px;font:inherit;min-height:44px}
      button{cursor:pointer} button:hover:not(:disabled),button[aria-pressed=true]{border-color:var(--signal);color:var(--signal)}
      button:disabled{opacity:.45;cursor:default}
      .transport button:first-child{background:var(--signal);color:var(--ink);font-weight:600}
      .quiet{background:transparent;color:var(--muted)}
      .spectrum{display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:4px;margin-top:24px}
      .spectrum button{height:94px;padding:8px 4px 4px;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;gap:6px}
      .spectrum button span{display:block;min-height:3px;width:4px;max-height:60px;background:var(--signal)}
      .spectrum button small{font:11px var(--font-mono);color:var(--muted)}
      .spectrum button.selected{background:var(--ink);border-color:var(--signal)}
      .readout{font:13px var(--font-mono);color:var(--signal);overflow-wrap:anywhere}
      .notes{max-width:760px;padding:24px 0;line-height:1.75;color:var(--muted-bright)}
      .formula{font-family:var(--font-mono);color:var(--signal);overflow-wrap:anywhere;padding:16px;background:var(--surface)}
      footer{border-top:1px solid var(--line);padding-top:24px;font-size:13px;color:var(--muted)}
    `}</style>
  </>;
}

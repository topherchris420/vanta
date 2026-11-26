import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import math from "../lib/studio/nineFourths";

const { multiply, seededMatrices, rowNotes, processFrames, processNotes } = math;
const colors = { multiply: "#9ae6ce", add: "#a8aff0", subtract: "#f5a16b" };
const symbols = { multiply: "×", add: "+", subtract: "−" };

function MatrixCell({ value, label, onEdit }) {
  const [draft,setDraft]=useState(null);
  return <input type="text" inputMode="text" value={draft ?? String(value)} aria-label={label}
    onChange={e=>{
      const text=e.target.value;
      if(!/^-?[0-9]?$/.test(text))return;
      setDraft(text);
      if(/^-?[0-9]$/.test(text))onEdit(Number(text));
    }}
    onBlur={()=>setDraft(null)}/>;
}

function Matrix({ title, values, onEdit, onRow, selected }) {
  const n = values.length;
  const peak = Math.max(1, ...values.flat().map(Math.abs));
  return <section className="matrix">
    <h2>{title}</h2>
    <div className="cells" style={{gridTemplateColumns:`repeat(${n}, minmax(0, 1fr))`}}>
      {values.map((row,i)=>row.map((v,j)=>onEdit ?
        <MatrixCell key={i+":"+j} value={v} label={`${title} row ${i+1}, column ${j+1}`}
          onEdit={next=>onEdit(i,j,next)}/> :
        <button key={i+":"+j} onClick={()=>onRow(i)} aria-pressed={selected===i}
          aria-label={`Result row ${i+1}, column ${j+1}: ${v}; select row ${i+1}`}
          style={{background:v<0?`rgba(245,161,107,${0.06+0.24*Math.abs(v)/peak})`:`rgba(130,225,200,${0.06+0.24*Math.abs(v)/peak})`}}>{v}</button>))}
    </div>
  </section>;
}

export default function NineFourths() {
  const [n,setN]=useState(4);
  const [seed,setSeed]=useState(1);
  const [matrices,setMatrices]=useState(()=>seededMatrices(4,1));
  const [algorithm,setAlgorithm]=useState("strassen");
  const [row,setRow]=useState(0);
  const [playing,setPlaying]=useState(null);
  const [cursor,setCursor]=useState(0);
  const [seconds,setSeconds]=useState(0.18);
  const [message,setMessage]=useState("");
  const session=useRef(null);
  const comparison=useMemo(()=>({
    classical:multiply(...matrices,"classical",{trace:true}),
    strassen:multiply(...matrices,"strassen",{trace:true})
  }),[matrices]);
  const active=comparison[algorithm];
  const groupSize=Math.ceil(Math.max(comparison.classical.events.length,comparison.strassen.events.length)/96);
  const frames=useMemo(()=>({
    classical:processFrames(comparison.classical.events,groupSize),
    strassen:processFrames(comparison.strassen.events,groupSize)
  }),[comparison,groupSize]);
  const step=Math.min(cursor,active.events.length-1);
  const event=active.events[step];
  function stop(update=true) {
    const s=session.current; session.current=null;
    if(s){clearTimeout(s.timer);cancelAnimationFrame(s.raf);if(s.context&&s.context.state!=="closed")s.context.close().catch(()=>{});}
    if(update)setPlaying(null);
  }
  useEffect(()=>{
    const hide=()=>{if(document.hidden)stop();};
    const leave=()=>stop();
    document.addEventListener("visibilitychange",hide);
    window.addEventListener("pagehide",leave);
    return ()=>{document.removeEventListener("visibilitychange",hide);window.removeEventListener("pagehide",leave);stop(false);};
  },[]);
  function reset(size,nextSeed) {
    stop();setCursor(0);setN(size);setSeed(nextSeed);setRow(0);setMatrices(seededMatrices(size,nextSeed));
  }
  function edit(which,i,j,v) {
    stop();setCursor(0);setMatrices(old=>old.map((matrix,k)=>k===which?matrix.map((r,y)=>y===i?r.map((x,z)=>z===j?v:x):r):matrix));
  }
  async function listen(){
    stop();setMessage("");
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){setMessage("Audio is unavailable; the instrument works silently.");return;}
    let context;
    try{
      context=new Audio();
      const s={context,timer:null};session.current=s;
      setPlaying("row");await context.resume();
      if(session.current!==s)return;
      const start=context.currentTime+0.04;
      for(const note of rowNotes(active.result[row])){
        if(!note.gain)continue;
        const oscillator=context.createOscillator(),gain=context.createGain();
        const t=start+note.onset;
        oscillator.frequency.value=note.frequency;
        gain.gain.setValueAtTime(0,t);
        gain.gain.linearRampToValueAtTime(note.gain,t+0.02);
        gain.gain.linearRampToValueAtTime(0,t+0.18);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.start(t);oscillator.stop(t+0.19);
      }
      s.timer=setTimeout(()=>{if(session.current===s)stop();},n*220+150);
    }catch(e){if(session.current?.context===context)stop();setMessage("Could not start audio.");}
  }
  async function playProcess(sound) {
    stop();setMessage("");setCursor(0);
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(sound&&!Audio){setMessage("Audio unavailable. Use silent replay.");return;}
    const s={context:null,raf:0,timer:null};
    session.current=s;
    try {
      if(sound){s.context=new Audio();await s.context.resume();}
      if(session.current!==s)return;
      const clock=()=>s.context?s.context.currentTime:performance.now()/1000;
      const start=clock()+0.06;
      const plan=frames[algorithm];
      if(s.context){
        for(const [i,frame] of plan.entries())for(const note of processNotes(frame,seconds)){
          const o=s.context.createOscillator(),g=s.context.createGain();
          const t=start+i*seconds+note.onset;
          o.type=note.type;o.frequency.value=note.frequency;
          g.gain.setValueAtTime(0,t);
          g.gain.linearRampToValueAtTime(note.gain,t+Math.min(0.008,note.duration/3));
          g.gain.linearRampToValueAtTime(0,t+note.duration);
          o.connect(g);g.connect(s.context.destination);
          o.start(t);o.stop(t+note.duration);
        }
      }
      setPlaying(sound?"process":"silent");
      let previous=-1;
      const tick=()=>{
        if(session.current!==s)return;
        const elapsed=clock()-start;
        if(elapsed>=plan.length*seconds){setCursor(active.events.length-1);stop();return;}
        const i=Math.max(0,Math.floor(elapsed/seconds));
        if(i!==previous){previous=i;setCursor(plan[i].start);}
        s.raf=requestAnimationFrame(tick);
      };
      s.raf=requestAnimationFrame(tick);
    }catch(e){if(session.current===s){stop();setMessage("Could not start replay.");}}
  }
  function seek(next){stop();setCursor(next);}
  return <>
    <Head><title>The Geometry of Computation | Vanta</title><meta name="description" content="Explore matrix multiplication, tensor contraction and the sound of an exact product."/></Head>
    <main className="nine">
      <nav><a href="/studio">← Studio</a><a href="/research">Research atlas ↗</a></nav>
      <header><p className="eyebrow">VERS3DYNAMICS / COMPUTATION EXPERIMENT 02</p>
        <h1>The geometry<br/>of computation.</h1>
        <p className="lede">Two matrices. One answer. Different paths to get there.</p>
        <p className="muted">An exact integer instrument inspired by the November 2026 matrix multiplication paper. No claim of a practical nine-fourths implementation.</p>
      </header>
      <section className="panel">
        <div className="controls"><div><label htmlFor="size">Matrix size</label><select id="size" value={n} onChange={e=>reset(Number(e.target.value),seed)}>{[2,4,8].map(v=><option key={v} value={v}>{v} × {v}</option>)}</select></div>
          <div><label htmlFor="algorithm">Algorithm</label><select id="algorithm" value={algorithm} onChange={e=>{stop();setCursor(0);setAlgorithm(e.target.value);}}><option value="strassen">Strassen</option><option value="classical">Classical</option></select></div>
          <button onClick={()=>reset(n,seed+1)}>New matrices</button></div>
        <p className="muted">Edit the integers in A and B. Select a row of the product to listen to it.</p>
        <div className="matrices"><Matrix key={"A:"+n+":"+seed} title="A" values={matrices[0]} onEdit={(i,j,v)=>edit(0,i,j,v)}/><span className="operator">×</span><Matrix key={"B:"+n+":"+seed} title="B" values={matrices[1]} onEdit={(i,j,v)=>edit(1,i,j,v)}/><span className="operator">=</span><Matrix title="AB" values={active.result} selected={row} onRow={i=>{stop();setRow(i);}}/></div>
        <div className="controls"><button onClick={playing==="row"?()=>stop():listen}>{playing==="row"?"Stop sound":`Listen to row ${row+1}`}</button><span className="muted" role="status">{message||"Audio is opt-in. Signed output values map to pitch; magnitude maps to gain."}</span></div>
      </section>
      <section className="panel"><p className="eyebrow">01 / WORK ACCOUNTING</p><h2>Same product, different work</h2>
        <div className="metrics">{["classical","strassen"].map(name=><div key={name}><h3>{name}</h3><strong>{comparison[name].products}</strong><p>scalar products</p><div className="track"><span style={{width:`${100*comparison[name].products/comparison.classical.products}%`}}/></div><p>{comparison[name].additions} additions / subtractions</p></div>)}</div>
        <p role="status">{JSON.stringify(comparison.classical.result)===JSON.stringify(comparison.strassen.result)?"Exact agreement across both algorithms.":"Results differ."}</p>
        <p className="muted">Counts are exact for these implementations, not measured runtime. Strassen trades multiplications for additions and temporary storage.</p>
      </section>
      <section className="panel process"><p className="eyebrow">02 / THE SOUND OF WORK</p>
        <h2>Two paths through the same problem.</h2>
        <p>Listen to the arithmetic as it happens in the implementation, then compare the other algorithm. The result stays the same; the sequence of operations changes.</p>
        <div className="legend">{Object.entries(symbols).map(([kind,symbol])=><span key={kind}><i style={{background:colors[kind]}}/>{symbol} {kind}</span>)}</div>
        <div className="controls">
          <button onClick={()=>{stop();setCursor(0);setAlgorithm("classical");}} aria-pressed={algorithm==="classical"}>Classical</button>
          <button onClick={()=>{stop();setCursor(0);setAlgorithm("strassen");}} aria-pressed={algorithm==="strassen"}>Strassen</button>
          <button onClick={()=>playProcess(true)}>Hear the process</button>
          <button onClick={()=>playProcess(false)}>Silent replay</button>
          <button onClick={()=>stop()} disabled={!playing}>Stop</button>
          <div><label htmlFor="tempo">Frame tempo</label><select id="tempo" value={seconds} onChange={e=>{stop();setSeconds(Number(e.target.value));}}><option value={0.12}>Quick</option><option value={0.18}>Moderate</option><option value={0.36}>Slow</option></select></div>
        </div>
        <div className="traces">
          {["classical","strassen"].map(name=><div key={name}>
            <div className="tracehead"><strong>{name}</strong><span>{comparison[name].events.length} operations · {(frames[name].length*seconds).toFixed(1)} s</span></div>
            <div className="timeline" role="img" aria-label={`${name}: ${comparison[name].products} products, ${comparison[name].additions} additions and subtractions; ${frames[name].length} playback frames`}>
              {frames[name].map((frame,i)=><span key={i} className={algorithm===name&&step>=frame.start&&step<frame.end?"current":""} style={{width:`${100/Math.max(frames.classical.length,frames.strassen.length)}%`}}>
                {frame.order.map(kind=><i key={kind} style={{background:colors[kind],height:`${100*frame.counts[kind]/(frame.end-frame.start)}%`}}/>)}
              </span>)}
            </div>
          </div>)}
        </div>
        <p className="muted">{groupSize===1?"One audible pulse per scalar operation.":`Up to ${groupSize} consecutive operations per playback frame, using the same grouping for both algorithms. Each voice represents a type and its share of that frame; individual order within grouped frames is not audible.`} Playback time is a chosen musical scale, not execution time.</p>
        <div className="inspector">
          <label htmlFor="operation">Inspect an exact scalar operation: {step+1} / {active.events.length}</label>
          <input id="operation" type="range" min="0" max={active.events.length-1} value={step} onChange={e=>seek(Number(e.target.value))}/>
          <div className="controls"><button disabled={step===0} onClick={()=>seek(step-1)}>Previous</button><button disabled={step===active.events.length-1} onClick={()=>seek(step+1)}>Next</button></div>
          <div className="equation" style={{color:colors[event.kind]}}>{event.left} {symbols[event.kind]} ({event.right}) = {event.result}</div>
          <p className="muted">{event.location} · {event.kind}</p>
        </div>
      </section>
      <section className="panel"><p className="eyebrow">03 / A LIMIT, NOT A LIBRARY</p><h2>Beyond the instrument</h2>
        <p>Classical multiplication scales as n³; Strassen uses seven recursive products in place of eight. OpenAI’s <a href="https://github.com/openai/math/blob/main/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/paper.pdf">November 24 preprint</a> reports that the asymptotic arithmetic exponent for square matrices is 9/4 over every field. This instrument counts scalar operations for classical multiplication and Strassen at the selected size. It neither implements the preprint’s construction nor measures running time.</p>
        <p>Tensor-network research studies how shared indices and contraction structure determine computational work. Here the output-row melody is identical for either algorithm, but the process sonification exposes the different arithmetic traces. The sound mapping is an artistic convention, not a physical acoustic property of computation.</p>
        <p><a href="https://github.com/topherchris420/rain-atlas">R.A.I.N. ATLAS</a> · <a href="https://github.com/topherchris420/dynamic-resonance-rooting">DRR</a></p>
      </section>
    </main>
    <style jsx global>{`
      body{margin:0;background:#111715;color:#e7eee8;font-family:system-ui,sans-serif}
      .nine{max-width:1120px;margin:auto;padding:24px clamp(16px,5vw,60px) 70px;line-height:1.5}
      .nine nav,.nine .controls{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .nine a{color:#9ae6ce}.nine header{padding:clamp(30px,7vw,80px) 0 26px}
      .nine h1{font-size:clamp(44px,9vw,100px);letter-spacing:-.07em;line-height:.93;font-weight:500;margin:18px 0}
      .nine .eyebrow{font-size:11px;letter-spacing:.17em;color:#9ae6ce}
      .nine .lede{font-size:clamp(18px,3vw,28px)}.nine .muted{color:#aebfb6;font-size:14px}
      .nine .panel{border-top:1px solid #3c4b44;padding:24px 0 30px}
      .nine .controls{justify-content:flex-start}.nine label{display:block;font-size:12px;color:#aebfb6;margin-bottom:5px}
      .nine button,.nine select,.nine input{font:inherit;color:inherit;background:#1b2621;border:1px solid #53675c;border-radius:4px}
      .nine button,.nine select{padding:8px 12px}.nine button{cursor:pointer}.nine :focus-visible{outline:2px solid #9ae6ce;outline-offset:2px}
      .nine .matrices{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;margin:24px 0}
      .nine .matrix{min-width:0}.nine .matrix h2{font-weight:500;font-size:19px}.nine .cells{display:grid;gap:3px}
      .nine .cells input,.nine .cells button{box-sizing:border-box;width:100%;min-width:0;padding:5px 0;text-align:center;font-size:clamp(10px,1.2vw,14px);font-variant-numeric:tabular-nums;appearance:textfield}
      .nine input::-webkit-inner-spin-button,.nine input::-webkit-outer-spin-button{appearance:none;margin:0}
      .nine .cells button[aria-pressed=true]{border-color:#9ae6ce}
      .nine .operator{color:#9ae6ce;font-size:26px}
      .nine .metrics{display:grid;grid-template-columns:1fr 1fr;gap:24px}.nine .metrics h3{text-transform:capitalize;font-weight:500}
      .nine .metrics strong{font-size:clamp(32px,6vw,64px);font-weight:500;font-variant-numeric:tabular-nums}
      .nine .track{height:6px;background:#273b31}.nine .track span{display:block;height:100%;background:#9ae6ce}
      .nine .legend{display:flex;gap:18px;flex-wrap:wrap;margin:18px 0}.nine .legend span{display:flex;gap:7px;align-items:center}.nine .legend i{display:block;width:10px;height:10px;border-radius:2px}
      .nine .process button[aria-pressed=true]{border-color:#9ae6ce;background:#254438}.nine button:disabled{opacity:.45;cursor:default}
      .nine .traces{display:grid;gap:16px;margin:28px 0}.nine .tracehead{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;text-transform:capitalize;font-size:13px}.nine .tracehead span{color:#aebfb6;text-transform:none}
      .nine .timeline{display:flex;height:58px;margin-top:7px;background:#19241f;overflow:hidden}
      .nine .timeline>span{display:flex;flex-direction:column-reverse;box-sizing:border-box;border-right:1px solid #111715;position:relative;min-width:0}
      .nine .timeline>span.current{outline:2px solid #fff;outline-offset:-2px;z-index:1}.nine .timeline i{display:block;width:100%}
      .nine .inspector{border:1px solid #3c4b44;padding:18px;margin-top:18px}.nine .inspector input{width:100%;accent-color:#9ae6ce}.nine .inspector .controls{margin-top:12px}.nine .equation{font-size:clamp(23px,5vw,44px);font-variant-numeric:tabular-nums;margin-top:18px;overflow-wrap:anywhere}
      @media(max-width:760px){.nine .matrices{grid-template-columns:1fr;gap:6px}.nine .operator{text-align:center}.nine .cells input,.nine .cells button{font-size:14px}.nine .metrics{gap:12px}}
    `}</style>
  </>;
}

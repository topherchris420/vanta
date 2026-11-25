// Small integer matrices only. Counts are scalar products, not runtime.
function multiply(a, b, algorithm = "classical", { trace = false } = {}) {
  const n = a.length;
  if (![2, 4, 8].includes(n) || b.length !== n ||
      ![a, b].every(m => m.every(row => Array.isArray(row) && row.length === n &&
        row.every(v => Number.isInteger(v) && Math.abs(v) <= 9)))) {
    throw new RangeError("Use 2, 4 or 8 square matrices with integer entries from -9 to 9.");
  }
  if (!["classical", "strassen"].includes(algorithm)) throw new RangeError("Unknown algorithm");
  let products = 0, additions = 0;
  const events = trace ? [] : null;
  function record(kind, left, right, result, location) {
    if (events) events.push({ kind, left, right, result, location });
    return result;
  }
  function add(x, y, sign, location) {
    return x.map((row, i) => row.map((v, j) => { additions++; return record(sign === 1 ? "add" : "subtract", v, y[i][j], v + sign * y[i][j], location); }));
  }
  function split(x) {
    const h = x.length / 2;
    return [x.slice(0,h).map(r=>r.slice(0,h)), x.slice(0,h).map(r=>r.slice(h)),
      x.slice(h).map(r=>r.slice(0,h)), x.slice(h).map(r=>r.slice(h))];
  }
  function recurse(x, y, location) {
    if (x.length === 1) { products++; return [[record("multiply", x[0][0], y[0][0], x[0][0]*y[0][0], location)]]; }
    const [a,b,c,d] = split(x), [e,f,g,h] = split(y);
    const sub = (x, y, label) => recurse(x, y, location + "/" + label);
    const sum = (x, y, label, sign = 1) => add(x, y, sign, location + "/" + label);
    const p = sub(sum(a,d,"P1 left"),sum(e,h,"P1 right"),"P1");
    const q = sub(sum(c,d,"P2 left"),e,"P2");
    const r = sub(a,sum(f,h,"P3 right",-1),"P3");
    const s = sub(d,sum(g,e,"P4 right",-1),"P4");
    const t = sub(sum(a,b,"P5 left"),h,"P5");
    const u = sub(sum(c,a,"P6 left",-1),sum(e,f,"P6 right"),"P6");
    const v = sub(sum(b,d,"P7 left",-1),sum(g,h,"P7 right"),"P7");
    const tl = sum(sum(sum(p,s,"C11"),t,"C11",-1),v,"C11"), tr = sum(r,t,"C12");
    const bl = sum(q,s,"C21"), br = sum(sum(sum(p,q,"C22",-1),r,"C22"),u,"C22");
    return tl.map((row,i)=>row.concat(tr[i])).concat(bl.map((row,i)=>row.concat(br[i])));
  }
  let result;
  if (algorithm === "strassen") result = recurse(a,b,"root");
  else result = a.map((row,i)=>row.map((_,j)=>{
    let total = 0;
    for(let k=0;k<n;k++){
      const location = "C[" + (i+1) + "," + (j+1) + "] / k=" + (k+1);
      products++;
      const product = record("multiply", a[i][k], b[k][j], a[i][k]*b[k][j], location);
      if(k){ additions++; total = record("add", total, product, total+product, location); }
      else total = product;
    }
    return total;
  }));
  // The integer ring has one zero; JavaScript has two IEEE zero signs.
  result = result.map(row => row.map(value => value === 0 ? 0 : value));
  return events ? { result, products, additions, events } : { result, products, additions };
}

function seededMatrices(n, seed = 1) {
  if (![2,4,8].includes(n)) throw new RangeError("Unsupported size");
  let state = seed >>> 0;
  const next = () => { state = (Math.imul(state,1664525)+1013904223)>>>0; return (state%19)-9; };
  return Array.from({length:2},()=>Array.from({length:n},()=>Array.from({length:n},next)));
}

// One selected output row, signed values mapped to pitch and magnitude to gain.
function rowNotes(row) {
  if (!row.length || row.length > 8 || !row.every(Number.isFinite)) throw new RangeError("Invalid row");
  const peak = Math.max(1,...row.map(Math.abs));
  return row.map((value,index)=>({onset:index*0.22, frequency:440*2**(value/peak),
    gain:0.09*Math.abs(value)/peak}));
}

// Shared frame size preserves relative playback duration at the same tempo.
// Each contiguous frame accounts for every operation exactly once.
function processFrames(events, groupSize) {
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 64 ||
      !Array.isArray(events) || !events.length || events.length > 4096) {
    throw new RangeError("Invalid process trace or frame size");
  }
  const frames = [];
  for (let start = 0; start < events.length; start += groupSize) {
    const end = Math.min(start + groupSize, events.length);
    const counts = { multiply: 0, add: 0, subtract: 0 };
    const order = [];
    for (let i = start; i < end; i++) {
      const kind = events[i].kind;
      if (!Object.hasOwn(counts, kind)) throw new RangeError("Unknown operation");
      if (!counts[kind]) order.push(kind);
      counts[kind]++;
    }
    frames.push({ start, end, counts, order });
  }
  return frames;
}

// Artistic mapping, not measured runtime: one voice per operation type in
// each frame, ordered by its first occurrence. Loudness encodes count.
function processNotes(frame, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0.1 || seconds > 1) throw new RangeError("Invalid tempo");
  const voices = { multiply: [196, "sine"], add: [392, "triangle"], subtract: [293.66, "triangle"] };
  const slot = seconds / frame.order.length;
  return frame.order.map((kind, i) => ({
    kind, onset: i * slot, duration: slot * 0.85,
    frequency: voices[kind][0], type: voices[kind][1],
    gain: 0.07 * Math.sqrt(frame.counts[kind] / (frame.end - frame.start))
  }));
}

module.exports = { multiply, seededMatrices, rowNotes, processFrames, processNotes };

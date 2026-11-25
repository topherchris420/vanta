// Small integer matrices only. Counts are scalar products, not runtime.
function multiply(a, b, algorithm = "classical") {
  const n = a.length;
  if (![2, 4, 8].includes(n) || b.length !== n ||
      ![a, b].every(m => m.every(row => Array.isArray(row) && row.length === n &&
        row.every(v => Number.isInteger(v) && Math.abs(v) <= 9)))) {
    throw new RangeError("Use 2, 4 or 8 square matrices with integer entries from -9 to 9.");
  }
  if (!["classical", "strassen"].includes(algorithm)) throw new RangeError("Unknown algorithm");
  let products = 0, additions = 0;
  function add(x, y, sign = 1) {
    return x.map((row, i) => row.map((v, j) => { additions++; return v + sign * y[i][j]; }));
  }
  function split(x) {
    const h = x.length / 2;
    return [x.slice(0,h).map(r=>r.slice(0,h)), x.slice(0,h).map(r=>r.slice(h)),
      x.slice(h).map(r=>r.slice(0,h)), x.slice(h).map(r=>r.slice(h))];
  }
  function recurse(x, y) {
    if (x.length === 1) { products++; return [[x[0][0]*y[0][0]]]; }
    const [a,b,c,d] = split(x), [e,f,g,h] = split(y);
    const p = recurse(add(a,d),add(e,h));
    const q = recurse(add(c,d),e);
    const r = recurse(a,add(f,h,-1));
    const s = recurse(d,add(g,e,-1));
    const t = recurse(add(a,b),h);
    const u = recurse(add(c,a,-1),add(e,f));
    const v = recurse(add(b,d,-1),add(g,h));
    const tl = add(add(add(p,s),t,-1),v), tr = add(r,t);
    const bl = add(q,s), br = add(add(add(p,q,-1),r),u);
    return tl.map((row,i)=>row.concat(tr[i])).concat(bl.map((row,i)=>row.concat(br[i])));
  }
  let result;
  if (algorithm === "strassen") result = recurse(a,b);
  else result = a.map((row,i)=>row.map((_,j)=>{
    let total = 0;
    for(let k=0;k<n;k++){products++; if(k) additions++; total += a[i][k]*b[k][j];}
    return total;
  }));
  return { result, products, additions };
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

module.exports = { multiply, seededMatrices, rowNotes };

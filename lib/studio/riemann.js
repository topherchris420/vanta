// Riemann's explicit formula, restricted to the first 64 positive zero ordinates.
// Computed with mpmath 1.3 zetazero(n), 18 decimal digits, rounded to JS doubles.
// Reproduce: [float(im(zetazero(n))) for n in range(1,65)] with mp.dps=18.
const ZEROS = Object.freeze([
14.134725141734695,21.022039638771556,25.01085758014569,30.424876125859512,
32.93506158773919,37.586178158825675,40.9187190121475,43.327073280915,
48.00515088116716,49.7738324776723,52.970321477714464,56.44624769706339,
59.34704400260235,60.83177852460981,65.1125440480816,67.07981052949417,
69.54640171117398,72.0671576744819,75.70469069908393,77.1448400688748,
79.33737502024937,82.91038085408603,84.73549298051705,87.42527461312523,
88.80911120763446,92.49189927055849,94.65134404051989,95.87063422824531,
98.83119421819369,101.31785100573138,103.72553804047834,105.44662305232609,
107.1686111842764,111.02953554316967,111.87465917699264,114.32022091545271,
116.22668032085755,118.79078286597621,121.37012500242065,122.94682929355258,
124.25681855434577,127.5166838795965,129.57870419995606,131.08768853093267,
133.4977372029976,134.75650975337388,138.11604205453344,139.7362089521214,
141.12370740402113,143.11184580762063,146.0009824867655,147.42276534255961,
150.05352042078488,150.92525761224147,153.0246938111989,156.11290929423788,
157.59759181759406,158.8499881714205,161.18896413759603,163.030709687182,
165.5370691879004,167.1844399781745,169.09451541556882,169.9119764794117
]);

function primePowers(limit) {
  if (!Number.isInteger(limit) || limit < 2 || limit > 10000) throw new RangeError("limit must be an integer in [2,10000]");
  const composite = new Uint8Array(limit + 1);
  const result = [];
  for (let p = 2; p <= limit; p++) {
    if (composite[p]) continue;
    for (let q = p * p; q <= limit; q += p) composite[q] = 1;
    for (let n = p, k = 1; n <= limit; n *= p, k++) result.push({ n, p, k, weight: Math.log(p) });
  }
  return result.sort((a,b) => a.n-b.n);
}

// psi_0 uses half the jump at an integer prime power, as in the explicit formula.
function psi(x, powers) {
  return powers.reduce((s, e) => s + (e.n < x ? e.weight : e.n === x ? e.weight / 2 : 0), 0);
}

// Each conjugate pair contributes -2 Re(exp(i gamma u)/(1/2+i gamma)).
// The common sqrt(x) growth has been divided out. u = natural log(x).
function coefficients(gamma) {
  const d = 0.25 + gamma * gamma;
  return { cosine: -1 / d, sine: -2 * gamma / d };
}
function zeroWave(u, zeros) {
  return zeros.reduce((sum,gamma) => {
    const { cosine, sine } = coefficients(gamma);
    return sum + cosine * Math.cos(gamma*u) + sine * Math.sin(gamma*u);
  }, 0);
}
function smoothCorrection(x) {
  return (-Math.log(2*Math.PI) - 0.5*Math.log1p(-1/(x*x))) / Math.sqrt(x);
}
function reconstruct(x, zeros) {
  return zeroWave(Math.log(x),zeros) + smoothCorrection(x);
}
function trace(limit, zeros, samples=720) {
  const powers = primePowers(limit);
  const lo = Math.log(2), hi = Math.log(limit);
  // Include both sides of every discontinuity; never connect across an omitted step.
  const xs = Array.from({length:samples},(_,i)=> i===0 ? 2 : i===samples-1 ? limit : Math.exp(lo+(hi-lo)*i/(samples-1)));
  for (const {n} of powers) {
    if (n>2) xs.push(n-1e-7);
    xs.push(n);
    if(n<limit) xs.push(n+1e-7);
  }
  return xs.sort((a,b)=>a-b).map(x=>({
    x, u:Math.log(x), actual:(psi(x,powers)-x)/Math.sqrt(x), reconstructed:reconstruct(x,zeros)
  }));
}
function pulseSchedule(limit, duration=8) {
  const lo=Math.log(2), span=Math.log(limit)-lo;
  if (!(span>0) || !(duration>0)) throw new RangeError("invalid scan");
  return primePowers(limit).map(e=>({...e, time:duration*(Math.log(e.n)-lo)/span}));
}
module.exports = { ZEROS, primePowers, psi, coefficients, zeroWave, smoothCorrection, reconstruct, trace, pulseSchedule };

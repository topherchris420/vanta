// Chandrasekaran, arXiv:2611.34924v1, Eqs. (4.33)–(4.34).
const MAX_TERMS = 16384;
const SCALES = Object.freeze([4, 8, 16, 32, 64, 128, 256]);

function compareSums(scale, terms) {
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isInteger(terms) ||
      terms < 1 || terms > MAX_TERMS) {
    throw new RangeError("Expected positive scale and an integer cutoff of 1–16384.");
  }
  const sumFirst = new Float64Array(terms + 1);
  const expandFirst = new Float64Array(terms + 1);
  let scaledReal = 0;
  for (let k = 1; k <= terms; k++) {
    const phase = 2 * k / scale;
    const weight = 1 / (k * k);
    // Sum e^(-2ik/s)/k². Display minus the imaginary part of s³ A_N.
    sumFirst[k] = sumFirst[k - 1] + (scale / 2) * Math.sin(phase) * weight;
    expandFirst[k] = expandFirst[k - 1] + 1 / k;
    scaledReal += Math.cos(phase) * weight;
  }
  return {
    sumFirst,
    expandFirst,
    // This pair is 2s² A_N, so the complex tail is bounded by 1/N.
    scaledReal,
    scaledImaginary: -2 * sumFirst[terms] / scale,
  };
}

module.exports = { compareSums, MAX_TERMS, SCALES };

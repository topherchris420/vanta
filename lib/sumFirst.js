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

// SVG coordinates match CSS pixels once the chart width is measured.
function chartLayout(width) {
  const left = 30;
  const right = width - 28;
  const top = 16;
  const bottom = width < 400 ? 175 : 254;
  const x = (n) => left + (Math.log2(n) / Math.log2(MAX_TERMS)) * (right - left);
  const y = (value) => bottom - (value / 11) * (bottom - top);
  return {
    width, height: bottom + 45, left, right, top, bottom, x, y,
    ticks: width < 360 ? [1, 16, 256, MAX_TERMS] : [1, 16, 256, 4096, MAX_TERMS],
  };
}

module.exports = { chartLayout, compareSums, MAX_TERMS, SCALES };

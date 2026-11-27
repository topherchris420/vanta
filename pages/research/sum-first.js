import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import sums from "../../lib/sumFirst";
import styles from "../../styles/SumFirst.module.css";
import HorizonMark from "../../components/HorizonMark";

const { chartLayout, compareSums, MAX_TERMS, SCALES } = sums;
const sampleTerms = [...new Set(Array.from({ length: 281 }, (_, i) =>
  Math.round(2 ** (i / 20))))];
const number = (n) => n.toFixed(6);
const presets = [
  { name: "Start with 4 modes", scale: 2, exponent: 2 },
  { name: "Extend to 1,024", scale: 2, exponent: 10 },
  { name: "Raise the scale", scale: 6, exponent: 10 },
];

function Trace({ series, terms, scale }) {
  const chart = useRef(null);
  const [chartWidth, setChartWidth] = useState(430);
  useEffect(() => {
    const node = chart.current;
    if (!node) return;
    const measure = () => {
      const width = node.getBoundingClientRect().width;
      if (width > 0) setChartWidth(width);
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const { width, height, left, right, top, bottom, x, y, ticks } = chartLayout(chartWidth);
  const dataAt = (n, values) => `${x(n).toFixed(2)},${y(values[n]).toFixed(2)}`;
  const trace = (values, points) => points.map((n, i) => `${i ? "L" : "M"}${dataAt(n, values)}`).join(" ");
  const included = [...sampleTerms.filter((n) => n < terms), terms];
  const guide = x(scale / 2);
  return (
    <figure className={styles.figure}>
      <div className={styles.legend}>
        <span><i className={styles.solid} />Sum first</span>
        <span><i className={styles.dashed} />Expand first</span>
      </div>
      <svg ref={chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="sum-chart-title sum-chart-description">
        <title id="sum-chart-title">Two ways to add the same modes</title>
        <desc id="sum-chart-description">
          Solid line: finite sum with the original phases. Dashed line: the first-order phase expansion.
          Both are plotted on the same vertical scale against the number of modes on a logarithmic axis.
          Brighter lines and dots show the selected cutoff. A vertical guide marks where the phase reaches one radian.
        </desc>
        <rect x={left} y={top} width={x(terms) - left} height={bottom - top} className={styles.selection} />
        {[0, 2, 4, 6, 8, 10].map((value) => (
          <g key={value}>
            <line x1={left} x2={right} y1={y(value)} y2={y(value)} className={styles.grid} />
            <text x={left - 7} y={y(value) + 4} textAnchor="end">{value}</text>
          </g>
        ))}
        {ticks.map((n) => (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={bottom} y2={bottom + 5} className={styles.grid} />
            <text x={x(n)} y={bottom + 20} textAnchor="middle">{n.toLocaleString("en-US")}</text>
          </g>
        ))}
        <line x1={guide} x2={guide} y1={top} y2={bottom} className={styles.guide} />
        <line x1={x(terms)} x2={x(terms)} y1={top} y2={bottom} className={styles.cursor} />
        {Object.entries({ sum: series.sumFirst, expand: series.expandFirst }).map(([key, values]) => (
          <g key={key} className={styles[key]}>
            <path d={trace(values, sampleTerms)} className={styles.ghost} />
            <path d={trace(values, included)} />
            <circle cx={x(terms)} cy={y(values[terms])} r={key === "sum" ? 4 : 3} />
          </g>
        ))}
        <text x={(left + right) / 2} y={height - 5} textAnchor="middle">Modes included (log scale)</text>
      </svg>
      <figcaption>
        Both curves show the same scaled imaginary contribution. The dotted guide marks mode {scale / 2},
        where the phase reaches one radian. It is a reference, not a sharp threshold.
        Faint lines show what happens beyond the selected cutoff.
      </figcaption>
    </figure>
  );
}

export default function SumFirst() {
  const [scaleIndex, setScale] = useState(2);
  const [exponent, setExponent] = useState(2);
  const scale = SCALES[scaleIndex];
  const terms = 2 ** exponent;
  const series = useMemo(() => compareSums(scale, MAX_TERMS), [scale]);
  const exact = series.sumFirst[terms];
  const approximation = series.expandFirst[terms];
  return (
    <div className={styles.page}>
      <Head>
        <title>Sum First | Vanta Research</title>
        <meta name="description" content="An interactive reproduction of a finite mode sum from Chandrasekaran's null-cone quantization preprint." />
      </Head>
      <a href="#sum-first" className={styles.skip}>Skip to experiment</a>
      <header className={styles.top}>
        <Link href="/research" className={styles.brand}>
          <HorizonMark className={styles.mark} /> Vanta / Research atlas
        </Link>
        <span>Numerical experiment</span>
      </header>
      <main className={styles.main} id="sum-first">
        <div className={styles.intro}>
          <p className={styles.kicker}>Null cone / Mode sums</p>
          <h1>Sum First<span aria-hidden="true">.</span></h1>
          <p>What changes when you approximate each term before adding it up?</p>
          <p className={styles.dek}>Start with four modes. The two answers nearly agree. Then add more modes and watch them separate.</p>
        </div>
        <section className={styles.instrument} aria-label="Mode sum comparison">
          <div className={styles.controls}>
            <h2>Set the conditions</h2>
            <label htmlFor="sum-cutoff"><span>Modes included <i>N</i></span><output htmlFor="sum-cutoff" aria-hidden="true">{terms.toLocaleString("en-US")}</output></label>
            <input id="sum-cutoff" type="range" min="0" max="14" step="1" value={exponent}
              aria-valuetext={terms === 1 ? "1 mode" : `${terms.toLocaleString("en-US")} modes`} onChange={(event) => setExponent(Number(event.target.value))} />
            <label htmlFor="sum-scale"><span>Scale <i>s</i></span><output htmlFor="sum-scale" aria-hidden="true">{scale}</output></label>
            <input id="sum-scale" type="range" min="0" max={SCALES.length - 1} step="1" value={scaleIndex}
              aria-valuetext={String(scale)} onChange={(event) => setScale(Number(event.target.value))} />
            <p className={styles.hint}>A larger scale keeps more modes in the small-phase regime.</p>
            <div className={styles.presets} role="group" aria-label="Suggested comparisons">
              {presets.map((preset) => (
                <button type="button" key={preset.name}
                  aria-pressed={scaleIndex === preset.scale && exponent === preset.exponent}
                  onClick={() => { setScale(preset.scale); setExponent(preset.exponent); }}>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          <Trace series={series} terms={terms} scale={scale} />
          <dl className={styles.results} aria-label="Values at the selected cutoff">
            <div><dt>Sum first</dt><dd data-testid="sum-value">{number(exact)}</dd></div>
            <div><dt>Expand first</dt><dd data-testid="expand-value">{number(approximation)}</dd></div>
            <div><dt>Absolute gap</dt><dd data-testid="gap-value">{number(Math.abs(approximation - exact))}</dd></div>
          </dl>
        </section>
        <section className={styles.method} aria-labelledby="method-title">
          <div>
            <p className={styles.kicker}>Read the trace</p>
            <h2 id="method-title">Why the lines separate</h2>
            <p>The original sine changes sign as the phase grows, so contributions from later modes can cancel. Expanding the sine first replaces it with its argument. Every term then adds a positive 1/k, and the harmonic sum keeps growing even though the original series converges for fixed s.</p>
          </div>
          <div>
            <h3>What this reproduces</h3>
            <p>The finite sum uses <code>−s³ Im(Aₙ) = (s/2) Σ sin(2k/s)/k²</code> for k from 1 to N. The expanded curve uses <code>Σ 1/k</code> over the same modes. The chart compares one component, not the full complex amplitude.</p>
            <p>Source: Venkatesa Chandrasekaran, <a href="https://arxiv.org/html/2611.34924v1#S4.SS4">§4.4, equations (4.33)–(4.34)</a>. This is a numerical reproduction of one calculation from a preprint, not a gravity simulation or a test of its broader theory.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

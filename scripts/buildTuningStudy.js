// Convert a fixed, seed-matched excerpt of public Pine Gap simulation traces.
// Reads only committed blobs. No live site, raw paths, positions or audio are bundled.
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const { gunzipSync } = require("node:zlib");
const path = require("node:path");

const revision = "384848cf21a06a8d34a5e9b5713fdeb2af9f4f47";
const experiment = "experiments/results/tuning-control-magnitude";
const conditions = ["graded", "long", "tap"];
const windowMs = 18000;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function excerpt(trace) {
  if (trace.schema !== "svs-agent-trace/v1" || trace.task !== "after-hours" ||
      trace.provider !== "mock" || trace.model !== "scripted-baseline" ||
      trace.dropped?.decisions !== 0 || trace.dropped?.events !== 0) {
    throw new Error("Expected an intact, scripted After Hours trace");
  }
  const turns = trace.decisions.filter((d) =>
    d.intent?.intent === "tune_terminal" && d.disposition === "executed" &&
    d.task?.terminalsCompleted === 0);
  if (!turns.length || turns.some((d) => !Number.isFinite(d.actionStart))) {
    throw new Error("Missing or invalid first-terminal turns");
  }
  const start = turns[0].actionStart;
  const locks = trace.events.filter((e) => e.type === "terminal_completed");
  const firstLock = locks.find((e) => e.data?.completed === 1);
  const overshoots = trace.events.filter((e) => e.type === "terminal_alignment_lost");
  const until = Math.min(start + windowMs, firstLock?.t ?? Infinity);
  if (!Number.isFinite(until) || until <= start || locks.length > 4) throw new Error("Invalid first-terminal window");
  // A run can end mid-action. The pinned long run does, far outside the excerpt.
  const clip = turns.filter((d) => d.actionStart < until);
  if (clip.some((d) => !Number.isFinite(d.actionEnd) || d.actionEnd <= d.actionStart ||
      !["up", "down"].includes(d.intent.direction) ||
      !["tap", "short", "long"].includes(d.intent.amount))) throw new Error("Invalid excerpt turn");
  const marks = (items) => items.filter((e) => e.t >= start && e.t <= until).map((e) => Math.round(e.t - start));
  return {
    turns: clip.map((d) => [
      Math.round(d.actionStart - start), Math.round(Math.min(d.actionEnd, until) - start),
      d.intent.direction, d.intent.amount,
    ]),
    overshoots: marks(overshoots),
    lockMs: firstLock && firstLock.t <= start + windowMs ? Math.round(firstLock.t - start) : null,
    runTotals: {
      inputs: trace.decisions.filter((d) => d.intent?.intent === "tune_terminal" && d.disposition === "executed").length,
      locks: locks.length,
      overshoots: overshoots.length,
    },
  };
}

function dataset(dir) {
  const blob = (suffix) => execFileSync("git", ["-C", dir, "show", `${revision}:${experiment}/${suffix}`],
    { maxBuffer: 8 * 1024 * 1024 });
  const manifest = JSON.parse(blob("result.json"));
  if (manifest.experiment !== "tuning-control-magnitude" || manifest.status !== "complete") throw new Error("Unexpected experiment");
  return {
    schema: "vanta-tuning-study/v1", revision, experiment, seed: 1, windowMs,
    conditions: conditions.map((id) => {
      const run = manifest.runs.find((r) => r.runId === `${id}-01`);
      if (run?.seed !== 1 || run.condition !== id || !run.paired || run.status !== "ok") throw new Error("Expected a paired seed-1 run");
      const file = `runs/${id}-01.trace.json.gz`;
      if (run.trace?.file !== file) throw new Error("Unexpected trace file");
      const raw = gunzipSync(blob(file));
      if (hash(raw) !== run.trace.sha256) throw new Error(`Digest mismatch: ${file}`);
      return { id, runId: run.runId, file, traceSha256: hash(raw), ...excerpt(JSON.parse(raw)) };
    }),
  };
}
if (require.main === module) {
  const [dir, flag] = process.argv.slice(2);
  if (!dir || (flag && flag !== "--check")) throw new Error("Usage: node scripts/buildTuningStudy.js <pine-gap-checkout> [--check]");
  const data = JSON.stringify(dataset(dir), null, 2) + "\n";
  const output = path.join(__dirname, "../data/research/tuningStudy.json");
  if (flag === "--check") {
    if (data !== readFileSync(output, "utf8")) throw new Error("Tuning study data is stale");
  } else writeFileSync(output, data);
  console.log("Verified and extracted 3 pinned seed-1 simulation traces.");
}
module.exports = { excerpt, dataset };

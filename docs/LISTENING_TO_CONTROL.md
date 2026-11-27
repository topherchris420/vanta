# Listening to Control

Pine Gap produces [recorded After Hours simulation experiments](https://github.com/topherchris420/satellite-vision-scape/blob/384848cf21a06a8d34a5e9b5713fdeb2af9f4f47/experiments/results/tuning-control-magnitude/report.md). Vanta turns a fixed comparison into a replay instrument. It is a way to inspect decisions with two senses, not a new performance metric.

From the Research atlas, open **Listening to Control**. Pick one of the three seed-1 tracks and press Play. Each starts at the first tuning input, ends at the first lock or at 18 simulated seconds, and uses the same 2× playback speed. Tone pitch distinguishes up from down; each tone's duration matches its turn; a bright tick marks an observed loss of alignment, and a chord marks a lock. The aligned diagrams are readable without sound. The full-run table is a separate summary of these same three runs.

The sounds are synthesized from selected timing and event fields. The original audio, raw paths, positions, and recorded observations are not bundled. All conditions use the same mapping, volume, and clock. This is an excerpt from a paired, scripted simulation experiment, not a listening study, measurement of the real Pine Gap facility, or claim about live agents.

## Reproduce

From the Vanta root with Node 20.9 or newer, point at a Pine Gap clone containing commit `384848cf21a06a8d34a5e9b5713fdeb2af9f4f47`:

```sh
node scripts/buildTuningStudy.js ../satellite-vision-scape --check
npm test
npm run build
```

Without `--check`, the first command rewrites the derived JSON. It reads only committed blobs at that revision and requires each decompressed trace digest to match the manifest before extracting a window. The page builds audio locally from the derived JSON, without fetches to GitHub, a model API, or a media server.

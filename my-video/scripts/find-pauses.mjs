// Finds pauses in public/raw.mp4 and writes the parts to keep to src/edit.json.
// Usage: node scripts/find-pauses.mjs [minPauseSeconds] [keepSeconds]
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const minPause = Number(process.argv[2] ?? 0.35);
// Silence left on each side of a cut so speech isn't clipped.
const pad = Number(process.argv[3] ?? 0.24) / 2;

// silencedetect reports on stderr.
const log = spawnSync(
  "ffmpeg",
  ["-i", "public/raw.mp4", "-af", `silencedetect=noise=-35dB:d=${minPause}`, "-f", "null", "-"],
  { encoding: "utf8" },
).stderr;

const duration = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "public/raw.mp4"])
    .toString()
    .trim(),
);

const silences = [...log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [
  Number(m[1]),
  Number(m[2]),
]);

const keep = [];
let cursor = 0;
for (const [start, end] of silences) {
  const cutFrom = start + pad;
  const cutTo = end >= duration - 0.05 ? duration : end - pad;
  if (cutTo - cutFrom < 0.05) continue;
  keep.push([cursor, cutFrom]);
  cursor = cutTo;
}
if (cursor < duration) keep.push([cursor, duration]);

const round = (n) => Math.round(n * 1000) / 1000;
writeFileSync("src/edit.json", JSON.stringify(keep.map(([a, b]) => [round(a), round(b)])));
const kept = keep.reduce((s, [a, b]) => s + b - a, 0);
console.log(`${silences.length} pauses, ${duration.toFixed(2)}s -> ${kept.toFixed(2)}s`);

import edit from "./edit.json";

export const FPS = 30;

// Parts of public/raw.mp4 kept after removing pauses, in frames.
// Regenerate edit.json with scripts/find-pauses.mjs.
const SEGMENTS = (() => {
  let outStart = 0;
  return (edit as [number, number][]).map(([from, to]) => {
    const srcStart = Math.round(from * FPS);
    const srcEnd = Math.round(to * FPS);
    const seg = { srcStart, srcEnd, outStart };
    outStart += srcEnd - srcStart;
    return seg;
  });
})();

export const OUTPUT_FRAMES = SEGMENTS.reduce((n, s) => n + s.srcEnd - s.srcStart, 0);

export const KEPT_SEGMENTS = SEGMENTS;

// Maps a time in raw.mp4 (seconds) to a frame of the edited reel.
// Times inside a removed pause snap to the next kept frame.
export const toFrame = (seconds: number) => {
  const f = seconds * FPS;
  for (const seg of SEGMENTS) {
    if (f < seg.srcStart) return seg.outStart;
    if (f < seg.srcEnd) return seg.outStart + Math.round(f - seg.srcStart);
  }
  return OUTPUT_FRAMES;
};

export const toMs = (ms: number) => (toFrame(ms / 1000) / FPS) * 1000;

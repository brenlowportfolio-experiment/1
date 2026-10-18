import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import rawCaptions from "../public/captions.json";
import { ACCENT, fontFamily, SAFE } from "./theme";
import { toMs } from "./timeline";

// Word timings shifted onto the edited timeline with pauses removed.
const captions = (rawCaptions as Caption[]).map((c) => ({
  ...c,
  startMs: toMs(c.startMs),
  endMs: toMs(c.endMs),
  timestampMs: c.timestampMs === null ? null : toMs(c.timestampMs),
}));

type Page = ReturnType<typeof createTikTokStyleCaptions>["pages"][number];

const CaptionPage: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const fade = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: SAFE.bottom + 40,
        // Same inset on both sides so captions sit on the centre line.
        paddingLeft: SAFE.right,
        paddingRight: SAFE.right,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.3,
          textAlign: "center",
          color: "white",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 16,
          padding: "10px 22px",
          opacity: fade,
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t, i) => {
          const active = t.fromMs <= nowMs && t.toMs > nowMs;
          return (
            <span key={t.fromMs} style={{ color: active ? ACCENT : "white" }}>
              {i === 0 ? t.text.trimStart() : t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 1400,
      }),
    [],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const endMs = next ? next.startMs : page.startMs + page.durationMs;
        const from = Math.round((page.startMs / 1000) * fps);
        const to = Math.round((endMs / 1000) * fps);
        if (to <= from) return null;
        return (
          <Sequence key={page.startMs} from={from} durationInFrames={to - from} layout="none">
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

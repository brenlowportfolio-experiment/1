import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
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
  const pop = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 6 });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: SAFE.bottom + 40,
        paddingLeft: SAFE.side,
        paddingRight: SAFE.right,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 78,
          lineHeight: 1.15,
          textAlign: "center",
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke",
          transform: `scale(${0.85 + 0.15 * pop})`,
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= nowMs && t.toMs > nowMs;
          return (
            <span key={t.fromMs} style={{ color: active ? ACCENT : "white" }}>
              {t.text}
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
        combineTokensWithinMilliseconds: 900,
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

import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { BRoll } from "./BRoll";
import { Captions } from "./Captions";
import { Overlays, Shade } from "./Overlays";
import { FPS, KEPT_SEGMENTS, OUTPUT_FRAMES } from "./timeline";

export const REEL_FPS = FPS;
export const REEL_DURATION_IN_FRAMES = OUTPUT_FRAMES;

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {KEPT_SEGMENTS.map((seg) => (
        <Sequence key={seg.srcStart} from={seg.outStart} durationInFrames={seg.srcEnd - seg.srcStart}>
          <OffthreadVideo
            src={staticFile("raw.mp4")}
            trimBefore={seg.srcStart}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Sequence>
      ))}
      <BRoll />
      <Shade />
      <Overlays />
      <Captions />
    </AbsoluteFill>
  );
};

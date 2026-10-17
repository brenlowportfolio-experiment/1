import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { BRoll } from "./BRoll";
import { Captions } from "./Captions";
import { Overlays, Shade } from "./Overlays";

export const REEL_FPS = 30;
// public/raw.mp4 is 154.19 seconds long.
export const REEL_DURATION_IN_FRAMES = Math.floor(154.19 * REEL_FPS);

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo
        src={staticFile("raw.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <BRoll />
      <Shade />
      <Overlays />
      <Captions />
    </AbsoluteFill>
  );
};

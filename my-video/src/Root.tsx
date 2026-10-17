import { Composition } from "remotion";
import { Reel, REEL_DURATION_IN_FRAMES, REEL_FPS } from "./Reel";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={REEL_DURATION_IN_FRAMES}
      fps={REEL_FPS}
      width={1080}
      height={1920}
    />
  );
};

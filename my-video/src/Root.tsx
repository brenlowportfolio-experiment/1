import { Composition } from "remotion";
import { Carousel, CAROUSEL_HEIGHT, CAROUSEL_SLIDES, CAROUSEL_WIDTH } from "./Carousel";
import { Reel, REEL_DURATION_IN_FRAMES, REEL_FPS } from "./Reel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={REEL_DURATION_IN_FRAMES}
        fps={REEL_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Carousel"
        component={Carousel}
        durationInFrames={CAROUSEL_SLIDES}
        fps={1}
        width={CAROUSEL_WIDTH}
        height={CAROUSEL_HEIGHT}
      />
    </>
  );
};

import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";

// public/music.mp3: "Lofi Hip Hop" by kamaleshsiddu (Pixabay Content License).
const TRACK_SECONDS = 118;
const CROSSFADE_SECONDS = 3;
// The track measures -13.3 LUFS and the voice -16.1 LUFS; this sits the music
// about 22 dB under the voice.
const BED_VOLUME = 0.06;

export const Music: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const track = Math.round(TRACK_SECONDS * fps);
  const fade = Math.round(CROSSFADE_SECONDS * fps);

  // The reel is longer than the track, so a second pass starts during the
  // first one's fade out.
  const passes: number[] = [];
  for (let from = 0; from < durationInFrames; from += track - fade) passes.push(from);

  return (
    <>
      {passes.map((from, i) => {
        const length = Math.min(track, durationInFrames - from);
        const isLast = i === passes.length - 1;
        return (
          <Sequence key={from} from={from} durationInFrames={length} layout="none">
            <Audio
              src={staticFile("music.mp3")}
              volume={(f) =>
                BED_VOLUME *
                interpolate(
                  f,
                  [0, i === 0 ? fps : fade, length - (isLast ? 2 * fps : fade), length],
                  [0, 1, 1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                )
              }
            />
          </Sequence>
        );
      })}
    </>
  );
};

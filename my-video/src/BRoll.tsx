import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, fontFamily, INK } from "./theme";
import { toFrame } from "./timeline";

// Punch-in on entry and a short fade at both ends so cutaways don't hard cut.
const Cutaway: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5, durationInFrames - 5, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 8], [1.08, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})`, backgroundColor: "black" }}>
      {children}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.8) 64%, rgba(0,0,0,0.8) 76%, rgba(0,0,0,0) 84%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Source credit, placed below the caption band.
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      left: 110,
      bottom: 270,
      fontFamily,
      fontWeight: 700,
      fontSize: 22,
      color: "rgba(255,255,255,0.9)",
      textShadow: "0 2px 6px rgba(0,0,0,0.9)",
    }}
  >
    {text}
  </div>
);

const Clip: React.FC<{ src: string; playbackRate?: number; credit?: string }> = ({
  src,
  playbackRate = 1,
  credit,
}) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(src)}
      playbackRate={playbackRate}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    {credit ? <Credit text={credit} /> : null}
  </AbsoluteFill>
);

// A still photo framed like the supplied clips: blurred fill behind a slow zoom.
const Photo: React.FC<{ src: string; credit: string; durationInFrames: number }> = ({
  src,
  credit,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.12]);
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(40px) brightness(0.5)",
          transform: "scale(1.2)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: 900,
            height: 1150,
            objectFit: "cover",
            objectPosition: "50% 20%",
            borderRadius: 28,
            transform: `scale(${zoom})`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
        />
      </AbsoluteFill>
      <Credit text={credit} />
    </AbsoluteFill>
  );
};

// Generated graphic: a wall of 188 clip tiles filling in with a running count.
const VideoWall: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = 188;
  const fillFrames = Math.min(durationInFrames - fps, fps * 4);
  const shown = Math.round(
    interpolate(frame, [0, fillFrames], [0, total], { extrapolateRight: "clamp" }),
  );
  const cols = 14;
  const tile = 56;
  const gap = 8;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 40%, #2A2140 0%, #0B0B0F 70%)",
        alignItems: "center",
        paddingTop: 470,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${tile}px)`,
          gap,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const on = i < shown;
          const pop = spring({
            frame: frame - Math.floor((i / total) * fillFrames),
            fps,
            config: { damping: 12 },
            durationInFrames: 10,
          });
          const hue = (i * 37) % 360;
          return (
            <div
              key={i}
              style={{
                width: tile,
                height: tile * 1.4,
                borderRadius: 8,
                background: on ? `hsl(${hue} 55% 38%)` : "rgba(255,255,255,0.06)",
                transform: `scale(${on ? 0.6 + 0.4 * pop : 1})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              {on
                ? [0.5, 1, 0.7, 0.9, 0.4].map((h, b) => (
                    <div
                      key={b}
                      style={{
                        width: 5,
                        height: 30 * h * (0.6 + 0.4 * Math.abs(Math.sin((frame + i * 3 + b * 5) / 4))),
                        background: "rgba(255,255,255,0.85)",
                        borderRadius: 3,
                      }}
                    />
                  ))
                : null}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 820,
          fontFamily,
          fontWeight: 900,
          fontSize: 230,
          color: ACCENT,
          WebkitTextStroke: "16px " + INK,
          paintOrder: "stroke",
          lineHeight: 1,
        }}
      >
        {shown}
      </div>
    </AbsoluteFill>
  );
};

// Times are in seconds of public/raw.mp4.
type Shot = { fromS: number; toS: number; render: (d: number) => React.ReactNode };

const SHOTS: Shot[] = [
  {
    fromS: 12.5,
    toS: 19.2,
    render: () => <Clip src="broll/tsuda-article.mp4" playbackRate={0.9} />,
  },
  { fromS: 20.4, toS: 29.6, render: (d) => <VideoWall durationInFrames={d} /> },
  { fromS: 79.0, toS: 84.2, render: () => <Clip src="broll/spiderman.mp4" credit="Credit: Timeory (YouTube)" /> },
  { fromS: 84.2, toS: 90.2, render: () => <Clip src="broll/wolverine-deadpool.mp4" credit="Credit: Timeory (YouTube)" /> },
  {
    fromS: 117.1,
    toS: 129.7,
    render: (d) => (
      <Photo
        src="photos/scarlett-johansson.jpg"
        credit="Photo: Dick Thomas Johnson, CC BY 2.0, via Wikimedia Commons"
        durationInFrames={d}
      />
    ),
  },
];

export const BRoll: React.FC = () => {
  return (
    <AbsoluteFill>
      {SHOTS.map((shot) => {
        const from = toFrame(shot.fromS);
        const d = toFrame(shot.toS) - from;
        return (
          <Sequence key={shot.fromS} from={from} durationInFrames={d} layout="none">
            <Cutaway durationInFrames={d}>{shot.render(d)}</Cutaway>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};


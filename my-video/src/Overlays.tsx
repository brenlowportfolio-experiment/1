import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, fontFamily, INK, SAFE } from "./theme";

// Slides in from the top, holds, then slides back out.
const useEnterExit = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const exit = spring({
    frame: frame - (durationInFrames - 10),
    fps,
    config: { damping: 200 },
    durationInFrames: 10,
  });
  return enter - exit;
};

const Hook: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = useEnterExit(durationInFrames);
  const lines = ["CAN AI", "CLONE YOUR", "VOICE?"];

  return (
    <AbsoluteFill style={{ paddingTop: SAFE.top + 20, alignItems: "center" }}>
      {lines.map((line, i) => {
        const delay = spring({
          frame: frame - i * 5,
          fps: 30,
          config: { damping: 12 },
        });
        return (
          <div
            key={line}
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: i === 2 ? 150 : 110,
              lineHeight: 1,
              color: i === 2 ? INK : "white",
              background: i === 2 ? ACCENT : "transparent",
              padding: i === 2 ? "8px 28px" : 0,
              marginTop: i === 2 ? 14 : 0,
              WebkitTextStroke: i === 2 ? undefined : "12px black",
              paintOrder: "stroke",
              transform: `translateY(${(1 - delay) * -80}px) rotate(${i === 2 ? -3 : 0}deg)`,
              opacity: Math.min(delay, progress),
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Chapter: React.FC<{ label: string; durationInFrames: number }> = ({
  label,
  durationInFrames,
}) => {
  const progress = useEnterExit(durationInFrames);
  return (
    <AbsoluteFill style={{ paddingTop: SAFE.top + 30, alignItems: "center" }}>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 72,
          color: INK,
          background: ACCENT,
          padding: "16px 40px",
          borderRadius: 18,
          transform: `translateY(${(1 - progress) * -300}px) rotate(-2deg)`,
          boxShadow: "0 12px 0 rgba(0,0,0,0.35)",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{
  kicker: string;
  title: string;
  detail?: string;
  durationInFrames: number;
}> = ({ kicker, title, detail, durationInFrames }) => {
  const progress = useEnterExit(durationInFrames);
  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE.top + 20,
        paddingLeft: SAFE.side,
        paddingRight: SAFE.right - 40,
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily,
          background: "rgba(11,11,15,0.88)",
          borderLeft: `14px solid ${ACCENT}`,
          borderRadius: 24,
          padding: "28px 36px",
          width: "100%",
          maxWidth: 860,
          transform: `translateY(${(1 - progress) * -420}px)`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 34, color: ACCENT, letterSpacing: 2 }}>
          {kicker}
        </div>
        <div style={{ fontWeight: 900, fontSize: 64, color: "white", lineHeight: 1.08, marginTop: 6 }}>
          {title}
        </div>
        {detail ? (
          <div style={{ fontWeight: 700, fontSize: 36, color: "#D6D6DE", marginTop: 12, lineHeight: 1.25 }}>
            {detail}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Versus: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = useEnterExit(durationInFrames);
  const names = [
    { who: "SPIDER-MAN", actor: "Tobey Maguire", color: "#E63946", at: 45 },
    { who: "WOLVERINE", actor: "Hugh Jackman", color: "#F4C430", at: 90 },
    { who: "DEADPOOL", actor: "Ryan Reynolds", color: "#B5172F", at: 160 },
  ];
  return (
    <AbsoluteFill style={{ paddingTop: SAFE.top + 10, alignItems: "center" }}>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 44,
          color: INK,
          background: ACCENT,
          padding: "8px 24px",
          borderRadius: 12,
          opacity: progress,
        }}
      >
        FAN-MADE "AVENGERS: DOOMSDAY"
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
        {names.map((n) => {
          const pop = spring({ frame: frame - n.at, fps: 30, config: { damping: 12 } });
          return (
            <div
              key={n.who}
              style={{
                fontFamily,
                width: 260,
                padding: "22px 12px",
                borderRadius: 20,
                background: n.color,
                textAlign: "center",
                color: "white",
                transform: `scale(${pop * progress})`,
                boxShadow: "0 10px 0 rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 30, whiteSpace: "nowrap" }}>{n.who}</div>
              <div style={{ fontWeight: 700, fontSize: 26, marginTop: 6, opacity: 0.9 }}>{n.actor}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CallToAction: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = useEnterExit(durationInFrames);
  const pulse = 1 + 0.04 * Math.sin(frame / 4);
  return (
    <AbsoluteFill style={{ paddingTop: SAFE.top + 40, alignItems: "center" }}>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 84,
          color: INK,
          background: ACCENT,
          padding: "20px 44px",
          borderRadius: 24,
          textAlign: "center",
          lineHeight: 1.05,
          transform: `scale(${progress * pulse})`,
        }}
      >
        WHERE'S THE LINE?
        <div style={{ fontSize: 44, marginTop: 10 }}>Comment below</div>
      </div>
    </AbsoluteFill>
  );
};

type Cue = { fromS: number; toS: number; render: (d: number) => React.ReactNode };

const CUES: Cue[] = [
  { fromS: 0, toS: 6, render: (d) => <Hook durationInFrames={d} /> },
  { fromS: 6.3, toS: 9.1, render: (d) => <Chapter label="THE JAPAN CASE" durationInFrames={d} /> },
  {
    fromS: 9.2,
    toS: 19.8,
    render: (d) => (
      <Card kicker="TOKYO DISTRICT COURT" title="Jujutsu Kaisen voice actor vs TikTok" durationInFrames={d} />
    ),
  },
  {
    fromS: 20.4,
    toS: 29.6,
    render: (d) => (
      <Card
        kicker="ANONYMOUS TIKTOK ACCOUNT"
        title="188 videos"
        detail="imitating the actor's voice"
        durationInFrames={d}
      />
    ),
  },
  {
    fromS: 29.9,
    toS: 38.3,
    render: (d) => (
      <Card
        kicker="VERDICT"
        title="Voice = protected publicity right"
        detail="The voice actor won"
        durationInFrames={d}
      />
    ),
  },
  { fromS: 41, toS: 45.8, render: (d) => <Chapter label="NOT SO SIMPLE" durationInFrames={d} /> },
  { fromS: 46.4, toS: 49.3, render: (d) => <Chapter label="THE UPSIDE" durationInFrames={d} /> },
  {
    fromS: 51.3,
    toS: 64.6,
    render: (d) => (
      <Card
        kicker="AI ON YOUTUBE"
        title="Fan fiction brought to life"
        detail="AI voices used to imagine future storylines"
        durationInFrames={d}
      />
    ),
  },
  { fromS: 71.6, toS: 88.2, render: (d) => <Versus durationInFrames={d} /> },
  {
    fromS: 88.4,
    toS: 95.6,
    render: (d) => (
      <Card kicker="THE CATCH" title="No permission from the actors" durationInFrames={d} />
    ),
  },
  { fromS: 112.6, toS: 116, render: (d) => <Chapter label="AN OLD PROBLEM" durationInFrames={d} /> },
  {
    fromS: 116.2,
    toS: 129.7,
    render: (d) => (
      <Card
        kicker="2024"
        title="Scarlett Johansson vs OpenAI"
        detail="Two letters demanding how her voice was cloned"
        durationInFrames={d}
      />
    ),
  },
  {
    fromS: 141.5,
    toS: 150.1,
    render: (d) => (
      <Card kicker="THE BIG QUESTION" title="How far should AI cloning go?" durationInFrames={d} />
    ),
  },
  { fromS: 150.3, toS: 999, render: (d) => <CallToAction durationInFrames={d} /> },
];

export const Overlays: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      {CUES.map((cue) => {
        const from = Math.round(cue.fromS * fps);
        const d = Math.min(Math.round(cue.toS * fps), durationInFrames) - from;
        return (
          <Sequence key={cue.fromS} from={from} durationInFrames={d} layout="none">
            {cue.render(d)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Keeps the top and bottom text readable over bright footage.
export const Shade: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)`,
      }}
    />
  );
};

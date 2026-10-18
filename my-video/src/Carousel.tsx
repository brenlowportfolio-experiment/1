import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ACCENT, fontFamily, INK } from "./theme";

// LinkedIn document post: one slide per frame, 1080x1350.
export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;

const BG = "#0B0B0F";
const MUTED = "#B9B9C6";
const PAD = 84;

type Slide = {
  kicker: string;
  title: string;
  body?: string;
  image?: { src: string; credit: string; height: number; position?: string };
  art?: "wave" | "wall" | "gavel" | "question";
};

const SLIDES: Slide[] = [
  {
    kicker: "AI & THE LAW",
    title: "Can AI clone your voice without permission?",
    body: "A Tokyo court case, fan-made Marvel scenes and Scarlett Johansson.",
    art: "wave",
  },
  {
    kicker: "THE CASE",
    title: "A voice actor took on an anonymous TikTok account",
    body: "Kenjiro Tsuda, the voice of Kento Nanami in Jujutsu Kaisen, sued in the Tokyo District Court.",
    image: { src: "carousel/tsuda-article.jpg", credit: "Source: The Guardian", height: 600, position: "50% 0%" },
  },
  {
    kicker: "THE CLAIM",
    title: "188 videos copying his voice",
    body: "The account posted AI-generated videos imitating his distinctive baritone.",
    art: "wall",
  },
  {
    kicker: "THE RULING",
    title: "A voice is a protected publicity right",
    body: "The court gave Tsuda a partial win, and set a landmark for voice actors in Japan.",
    art: "gavel",
  },
  {
    kicker: "THE UPSIDE",
    title: "Fans use AI voices to bring fan fiction to life",
    body: "Fan-made Avengers: Doomsday scenes imagine Tobey Maguire's Spider-Man meeting Hugh Jackman's Wolverine and Ryan Reynolds' Deadpool.",
    image: { src: "carousel/spiderman.jpg", credit: "Credit: Timeory (YouTube)", height: 470 },
  },
  {
    kicker: "THE CATCH",
    title: "None of the actors gave permission",
    body: "Entertaining for millions of viewers, but built on voices their owners never agreed to lend.",
    image: { src: "carousel/wolverine-deadpool.jpg", credit: "Credit: Timeory (YouTube)", height: 520 },
  },
  {
    kicker: "NOT A NEW PROBLEM",
    title: "2024: Scarlett Johansson vs OpenAI",
    body: "Her lawyers sent OpenAI two letters asking how a voice resembling hers was created. OpenAI denied imitating her.",
    image: {
      src: "photos/scarlett-johansson.jpg",
      credit: "Photo: Dick Thomas Johnson, CC BY 2.0, via Wikimedia Commons",
      height: 560,
    },
  },
  {
    kicker: "YOUR TAKE",
    title: "Where should the line be?",
    body: "Should your voice get the same protection as your face or your name? Tell me in the comments.",
    art: "question",
  },
];

export const CAROUSEL_SLIDES = SLIDES.length;

const Wave: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, height: 360 }}>
    {Array.from({ length: 28 }, (_, i) => {
      const h = 40 + 300 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21));
      return (
        <div
          key={i}
          style={{
            width: 18,
            height: h,
            borderRadius: 9,
            background: i % 5 === 2 ? ACCENT : "rgba(255,255,255,0.85)",
          }}
        />
      );
    })}
  </div>
);

const Wall: React.FC = () => (
  <div style={{ position: "relative" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(17, 44px)", gap: 6 }}>
      {Array.from({ length: 188 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            background: `hsl(${(i * 37) % 360} 50% 36%)`,
          }}
        />
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: 240,
        color: ACCENT,
        WebkitTextStroke: `16px ${INK}`,
        paintOrder: "stroke",
      }}
    >
      188
    </div>
  </div>
);

const Gavel: React.FC = () => (
  <svg width="420" height="360" viewBox="0 0 420 360">
    <g transform="rotate(-30 210 160)">
      <rect x="110" y="70" width="200" height="90" rx="18" fill={ACCENT} />
      <rect x="90" y="60" width="34" height="110" rx="10" fill="#E8C200" />
      <rect x="296" y="60" width="34" height="110" rx="10" fill="#E8C200" />
      <rect x="196" y="160" width="28" height="190" rx="12" fill="white" />
    </g>
    <rect x="70" y="310" width="280" height="36" rx="12" fill="white" opacity="0.85" />
  </svg>
);

const Question: React.FC = () => (
  <div
    style={{
      width: 300,
      height: 300,
      borderRadius: 150,
      background: ACCENT,
      color: INK,
      fontWeight: 900,
      fontSize: 220,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    ?
  </div>
);

const ART = { wave: Wave, wall: Wall, gavel: Gavel, question: Question };

export const Carousel: React.FC = () => {
  const index = useCurrentFrame();
  const slide = SLIDES[index];
  const Art = slide.art ? ART[slide.art] : null;
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        background: "radial-gradient(circle at 80% 0%, #2A2140 0%, #0B0B0F 60%)",
        fontFamily,
        color: "white",
        padding: PAD,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 3, color: ACCENT }}>{slide.kicker}</div>
        <div style={{ fontWeight: 700, fontSize: 28, color: MUTED }}>
          {index + 1}/{SLIDES.length}
        </div>
      </div>

      <div
        style={{
          fontWeight: 900,
          fontSize: isFirst || isLast ? 92 : 70,
          lineHeight: 1.08,
          marginTop: 28,
        }}
      >
        {slide.title}
      </div>

      {slide.body ? (
        <div style={{ fontWeight: 700, fontSize: 36, lineHeight: 1.35, color: MUTED, marginTop: 26 }}>
          {slide.body}
        </div>
      ) : null}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        {slide.image ? (
          <div style={{ width: "100%" }}>
            <Img
              src={staticFile(slide.image.src)}
              style={{
                width: "100%",
                height: slide.image.height,
                objectFit: "cover",
                objectPosition: slide.image.position ?? "50% 25%",
                borderRadius: 24,
                display: "block",
              }}
            />
            <div style={{ fontWeight: 700, fontSize: 20, color: MUTED, marginTop: 10 }}>
              {slide.image.credit}
            </div>
          </div>
        ) : null}
        {Art ? <Art /> : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          height: 50,
          fontWeight: 900,
          fontSize: 30,
          color: isLast ? MUTED : ACCENT,
        }}
      >
        {isLast ? "Follow for more on AI & creators" : "Swipe →"}
      </div>
    </AbsoluteFill>
  );
};

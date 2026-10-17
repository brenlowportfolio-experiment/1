import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const fontFamily = "Montserrat";

// Bundled locally so renders don't depend on Google Fonts being reachable.
loadFont({
  family: fontFamily,
  url: staticFile("fonts/montserrat.woff2"),
  weight: "700 900",
});

export const ACCENT = "#FFD60A";
export const INK = "#0B0B0F";

// Instagram Reels UI covers roughly these areas of a 1080x1920 frame.
export const SAFE = { top: 220, bottom: 480, side: 60, right: 160 };

// Transcribes public/raw.mp4 into public/captions.json using whisper.cpp.
// Usage: node scripts/transcribe.mjs [model] [language]
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const model = process.argv[2] ?? "small";
const whisperPath = path.join(process.cwd(), "whisper.cpp");
const wav = path.join(process.cwd(), "whisper.cpp", "audio.wav");

await installWhisperCpp({ to: whisperPath, version: "1.7.6" });
await downloadWhisperModel({ model, folder: whisperPath });

mkdirSync(whisperPath, { recursive: true });
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", "public/raw.mp4", "-ar", "16000", "-ac", "1", wav]);

const output = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: "1.7.6",
  model,
  tokenLevelTimestamps: true,
  language: process.argv[3] ?? "auto",
});

const { captions } = toCaptions({ whisperCppOutput: output });
writeFileSync("public/captions.json", JSON.stringify(captions, null, 2));
console.log(output.result.language, captions.map((c) => c.text).join(""));

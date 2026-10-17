# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Instagram reel

- `public/raw.mp4` is the source clip, `public/captions.json` its word timings.
- `src/Overlays.tsx` holds the title and card cues (`CUES`), timed in seconds.
- Regenerate captions: `node scripts/transcribe.mjs small en` (builds whisper.cpp; put `ggml-small.bin` in `whisper.cpp/` first if the download fails).
- Pauses: `node scripts/find-pauses.mjs [minPause] [keep]` rewrites `src/edit.json`; all cue times stay in raw.mp4 seconds and are mapped by `src/timeline.ts`.
- Render: `npx remotion render Reel out/reel.mp4`

# Vendored dependencies

## Anthropic TypeScript SDK

`anthropic-sdk.mjs` is [@anthropic-ai/sdk][] v0.135.0, MIT licensed, copyright
Anthropic, PBC, bundled to a single browser ES module.

It is checked in for the same reason as pdf.js in the parent app: no build
step, no package manager, GitHub Pages serves the directory as is.

To update:

```bash
npm install @anthropic-ai/sdk esbuild
echo 'export { default } from "@anthropic-ai/sdk";' > entry.mjs
npx esbuild entry.mjs --bundle --format=esm --minify --platform=browser \
  --outfile=anthropic-sdk.mjs
```

[@anthropic-ai/sdk]: https://www.npmjs.com/package/@anthropic-ai/sdk

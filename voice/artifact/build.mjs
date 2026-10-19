// Bundles the app into one self-contained HTML file for a claude.ai Artifact.
// The only differences from the GitHub Pages build: src/lib/claude.js is
// swapped for claude-sample.js, and sync.js keeps data in the account.
//
//   npm install && npm run build   ->   dist/voicebank.html

import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const swapClaude = {
  name: 'swap-claude',
  setup(build) {
    build.onResolve({ filter: /lib\/claude\.js$/ }, () => ({ path: path.join(here, 'claude-sample.js') }));
  },
};

const out = await esbuild.build({
  entryPoints: [path.join(here, 'entry.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  write: false,
  plugins: [swapClaude],
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(path.join(here, '..', 'styles.css'), 'utf8');

const html = `<title>Voicebank</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&family=Public+Sans:wght@400;500;600;700&display=swap">
<style>
${css}
</style>
<header class="topbar">
  <a class="brand" href="#assemble">Voicebank</a>
  <nav id="nav" class="nav"></nav>
  <span id="sync" class="sync" hidden></span>
</header>
<main id="outlet" class="outlet"></main>
<script type="module">
${js}
</script>
`;
await mkdir(path.join(here, 'dist'), { recursive: true });
await writeFile(path.join(here, 'dist', 'voicebank.html'), html);
console.log(`dist/voicebank.html ${(html.length / 1024).toFixed(1)} KiB`);

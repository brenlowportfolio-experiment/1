# Voicebank

Write job applications in your own voice from reusable chunks of your
experience, so you describe each achievement once and stop rewriting it for
every question and word limit.

Two builds from the same source:

- **claude.ai Artifact** (no API key): https://claude.ai/artifact/9A2bwwBnKqwXjHmQxtmbGo
  Claude calls run on your claude.ai account; data is saved privately to
  that account, so it follows you across devices.
- **GitHub Pages** (bring your own API key):
  https://brenlowportfolio-experiment.github.io/1/voice/ once the default
  branch carries this directory.

To run the Pages build locally:

```bash
python3 -m http.server 8000   # from the repository root
# open http://localhost:8000/voice/
```

No build step. Data lives in this browser's `localStorage`; Voice → Data
exports a backup (without your API key).

## The three parts

**Voice (style injector).** Paste 3 to 5 samples of your own writing. Every
request to Claude puts them in the system prompt, with instructions to match
vocabulary, sentence rhythm, structure, punctuation and stance. Optional voice
notes add explicit rules; *Distil from samples* drafts them for you to correct.
The voice block is identical across calls and marked for prompt caching, so
repeated drafts only pay full price for the job specific part.

**Chunks (tagged database).** Each card is one reusable claim: an experience
with its result, a value proposition, an introduction or a closing. Tag by
theme (Analytical Rigor, Cross-Functional Leadership, Problem Solving and so
on; add your own). Drag cards to reorder; drop a card on a tag to tag it.
*Split with Claude* turns a pasted résumé or profile into proposed cards that
keep your facts and add none.

**Assemble (context aware assembler).** Paste a job description. Chunks are
ranked locally by keyword overlap as you type. *Analyze with Claude* returns
what the employer needs, a single through line, the key requirements with the
chunks that evidence each, gaps, and a suggested sequence. Reorder the
sequence by drag, then add questions, each with its own word or character
limit. Every draft is written from the same sequence in your voice; answers
already written for the application are passed in so the next one takes a
different angle instead of repeating the same lead example. Revise with one
click (Tighter, More like me, More specific, Warmer) or a free instruction;
Undo restores the previous draft.

## Claude API

Calls go from the browser straight to `api.anthropic.com` with your own key,
using the vendored Anthropic SDK (`vendor/`). Model defaults to Claude Opus
5.5 at medium effort; both are changeable under Voice. Analysis and splitting
use structured outputs; drafts stream. Server side refusal fallback is on for
Opus and Sonnet.

The key sits in `localStorage` in plain text. Use a key with a spend limit,
and do not use this on a shared machine.

## Artifact build

`artifact/` swaps `src/lib/claude.js` for `claude-sample.js` (the claude.ai
`sample` capability, plus `downloads` for export) and adds `sync.js`, which
mirrors state into the viewer's private `db` subtree. To rebuild:

```bash
cd voice/artifact && npm install && npm run build   # writes dist/voicebank.html
```

Then republish `dist/voicebank.html` to the same artifact URL.

## Files

```
voice/
  index.html, styles.css
  src/main.js            router
  src/lib/store.js       localStorage state
  src/lib/prompts.js     every prompt and output schema
  src/lib/claude.js      SDK client, structured, text and streaming calls
  src/lib/match.js       local keyword scoring
  src/views/voice.js     samples, voice notes, key, backup
  src/views/chunks.js    card library, tags, Claude split
  src/views/assemble.js  job, match, sequence, questions
  vendor/                bundled @anthropic-ai/sdk
```

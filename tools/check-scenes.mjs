// Checks the scene files for the mistakes that are easy to make by hand and
// silent at runtime:
//
//   node tools/check-scenes.mjs
//
//   - every turn's speaker prefix is a key in that scene's `speakers`
//   - every moment points at a turn by the speaker it names (`who`), so a
//     paragraph inserted above it can't silently shift it onto the wrong line
//   - every moment key phrase actually occurs in the line it highlights
//   - every story part is a real document id
//   - every Chinese word in the scenes is in the dictionary

// The registry reads the user's own documents from localStorage; a script has none.
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const { allDocs, STORIES } = await import('../src/data/contexts/index.js');
const { segment } = await import('../src/lib/segment.js');
const { parseTurn } = await import('../src/lib/turns.js');

const problems = [];
const ids = new Set(allDocs().map((d) => d.id));
let turns = 0;
let moments = 0;
const missing = new Map();

for (const doc of allDocs().filter((d) => d.dialogue)) {
  doc.paragraphs.forEach((text, p) => {
    const t = parseTurn(text, doc.speakers);
    if (t.speaker) turns++;
    else if (!t.stage) problems.push(`${doc.id} ¶${p}: not a turn or a stage direction — "${text.slice(0, 20)}…"`);
    for (const tok of segment(text)) {
      if (tok.han && !tok.entry) missing.set(tok.text, (missing.get(tok.text) || 0) + 1);
    }
  });

  for (const m of doc.moments || []) {
    moments++;
    const text = doc.paragraphs[m.p];
    const t = text ? parseTurn(text, doc.speakers) : {};
    if (t.speaker !== m.who) {
      problems.push(`${doc.id} moment ¶${m.p}: expected ${m.who}, found ${t.speaker || 'no turn'}`);
      continue;
    }
    if (!m.cue || !m.en) problems.push(`${doc.id} moment ¶${m.p}: needs both cue and en`);
    const line = text.slice(t.prefixEnd);
    for (const k of m.keys || []) {
      if (!line.includes(k)) problems.push(`${doc.id} moment ¶${m.p}: key "${k}" is not in the line`);
    }
  }
}

for (const s of STORIES) {
  for (const id of s.parts) if (!ids.has(id)) problems.push(`story ${s.id}: no document "${id}"`);
}

if (missing.size) {
  problems.push(
    'not in the dictionary: ' +
      [...missing].sort((a, b) => b[1] - a[1]).map(([w, n]) => (n > 1 ? `${w}×${n}` : w)).join(' '),
  );
}

console.log(`${STORIES.length} stories, ${turns} turns, ${moments} moments`);
if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log('ok');

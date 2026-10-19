// Local, instant relevance scoring of chunks against a job description.
// Not a substitute for the Claude analysis, but it ranks the library the
// moment a description is pasted, and works without a key.

const STOP = new Set(
  `a an and are as at be been but by can for from has have how i in into is it its of on or our
  that the their them they this to was we were what when which who will with you your us
  role team work working experience ability strong skills including across within new
  about all also any more most other over such than then these those through using
  candidate candidates job position company ideal looking years year plus etc well
  responsibilities requirements qualifications preferred required must able`.split(/\s+/),
);

export function tokens(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/[\s/-]+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

function stem(w) {
  return w.replace(/(ing|ed|es|s|ly|ment|ments|ation|ations)$/, '') || w;
}

/** Returns Map chunkId -> { score 0..100, hits: [terms] }. */
export function score(jd, chunks) {
  const jdTokens = tokens(jd);
  const freq = new Map();
  for (const t of jdTokens) freq.set(t, (freq.get(t) || 0) + 1);

  // Terms common across the whole library say little about fit.
  const df = new Map();
  for (const c of chunks) {
    for (const t of new Set(tokens(`${c.title} ${c.text} ${c.tags.join(' ')}`))) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  const raw = new Map();
  let max = 0;
  for (const c of chunks) {
    const own = new Set(tokens(`${c.title} ${c.text}`));
    const tagTerms = new Set(tokens(c.tags.join(' ')));
    let s = 0;
    const hits = [];
    for (const [t, f] of freq) {
      const idf = Math.log(1 + chunks.length / (df.get(t) || 1));
      if (own.has(t)) {
        s += Math.min(f, 3) * idf;
        hits.push(t);
      }
      if (tagTerms.has(t)) s += 1.5 * Math.min(f, 3) * idf;
    }
    raw.set(c.id, { s, hits });
    max = Math.max(max, s);
  }
  const out = new Map();
  for (const [id, { s, hits }] of raw) {
    out.set(id, { score: max ? Math.round((s / max) * 100) : 0, hits: hits.slice(0, 6) });
  }
  return out;
}

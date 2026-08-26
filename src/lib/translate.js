// Automatic English for terms the curated dictionary doesn't have.
//
// Three sources, in descending order of trust:
//
//   curated  — src/data/dictionary.js, hand-written for legal register.
//              Always wins: "违约金 liquidated damages, penalty" beats
//              CC-CEDICT's bare "penalty (fee)".
//   cedict   — CC-CEDICT, ~111k entries. Knows most ordinary vocabulary and a
//              fair amount of commercial language, but not the specialist
//              compounds (融资租赁, 优先受偿权, 权利瑕疵 are all absent) — which
//              are exactly the terms discovery surfaces most often.
//   composed — built from the parts. Covers what the other two miss, and in
//              testing that was every remaining candidate.
//
// None of this is a translator. It is a first draft to correct, which is why
// the field it fills stays editable and is labelled with where it came from.

import { lexicon } from './lexicon.js';
import { segment } from './segment.js';

let cedict = null;
let loading = null;

export function glossaryReady() {
  return !!cedict;
}

export function glossarySize() {
  return cedict ? Object.keys(cedict).length : 0;
}

/**
 * Fetch the fallback glossary. ~6.9 MB of JSON (about 2.6 MB over the wire
 * once the server compresses it), so it is never loaded on startup — only when
 * a document is actually being imported.
 */
export function loadGlossary() {
  if (cedict) return Promise.resolve(cedict);
  if (loading) return loading;
  const url = new URL('../../vendor/cedict.json', import.meta.url);
  loading = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`glossary ${r.status}`);
      return r.json();
    })
    .then((d) => {
      cedict = d;
      return d;
    })
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

/**
 * @returns {{pinyin, meaning, source: 'curated'|'cedict'|'composed'|'none'}}
 */
export function glossTerm(term) {
  const dict = lexicon();

  const cur = dict[term];
  if (cur && cur[1]) {
    return { pinyin: cur[0], meaning: cur[1], source: 'curated' };
  }

  const ced = cedict?.[term];
  if (ced) {
    return { pinyin: ced[0], meaning: ced[1], source: 'cedict' };
  }

  // Compose from the parts. 融资租赁 has no entry anywhere, but 融资 and 租赁
  // both do, and "financing + lease" is a usable draft.
  //
  // Split against the glossary as well as the curated lexicon. Segmenting with
  // the curated lexicon alone would break 融资租赁 into 融/资/租赁 — it doesn't
  // know 融资 — and yield "to finance + capital, resources + lease" instead of
  // "financing + lease". The glossary knows the ordinary words; the curated
  // dictionary knows the legal ones; composition wants both.
  const parts = splitForGloss(term, dict);
  const pieces = [];
  const syllables = [];
  let complete = true;

  for (const word of parts) {
    const own = dict[word];
    const fallback = cedict?.[word];
    const pin = own ? own[0] : fallback ? fallback[0] : null;
    const mean = own && own[1] ? own[1] : fallback ? fallback[1] : null;
    syllables.push(pin || word);
    if (mean) pieces.push(briefSense(mean));
    else complete = false;
  }

  if (!pieces.length) {
    return { pinyin: syllables.join(' '), meaning: '', source: 'none' };
  }

  return {
    pinyin: syllables.join(' '),
    meaning: pieces.join(' + '),
    source: complete ? 'composed' : 'partial',
  };
}

/** Longest-first split over both tables, used only for composing a gloss. */
function splitForGloss(term, dict) {
  const out = [];
  let i = 0;
  while (i < term.length) {
    let word = null;
    for (let len = Math.min(6, term.length - i); len >= 2; len--) {
      const cand = term.substr(i, len);
      // Skip the whole term: if it were known we would not be composing.
      if (cand === term) continue;
      if (dict[cand] || cedict?.[cand]) {
        word = cand;
        break;
      }
    }
    out.push(word || term[i]);
    i += (word || term[i]).length;
  }
  return out;
}

/**
 * One short sense per part. Stitching full definitions together produces
 * "to add + speed, rapid + to arrive, to reach + period, term" — technically
 * derived from the characters and unreadable as a meaning.
 */
function briefSense(meaning) {
  let first = meaning.split(/[;；]/)[0].trim();
  // Drop the dictionary's asides: 权利 "right (i.e. an entitlement to sth)"
  // is a fine definition and a poor building block.
  const noParen = first.replace(/\s*\([^)]*\)/g, '').trim();
  if (noParen) first = noParen;
  if (first.length <= 26) return first;
  return first.split(/[,，]/)[0].trim();
}

export const SOURCE_LABEL = {
  curated: 'from the legal dictionary',
  cedict: 'auto-translated',
  composed: 'built from the parts',
  partial: 'built from some parts',
  none: 'no translation found',
};

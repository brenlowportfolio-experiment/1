// The effective lexicon = built-in dictionary + anything the user has taught it.
//
// Everything that segments or glosses text reads from here, so a term harvested
// from an uploaded document immediately changes how every document in the app
// is chunked and hovered.

import { TERMS, CHARS } from '../data/dictionary.js';
import { getUserTerms, subscribe } from './userdict.js';

const BUILT_IN = { ...CHARS, ...TERMS };

let merged = build();
let maxLen = computeMax(merged);

function build() {
  // User terms win: they're the more specific, more recently curated source.
  return { ...BUILT_IN, ...getUserTerms() };
}

function computeMax(d) {
  let m = 1;
  for (const k in d) if (k.length > m) m = k.length;
  return m;
}

subscribe(() => {
  merged = build();
  maxLen = computeMax(merged);
});

export function lexicon() {
  return merged;
}

export function maxTermLen() {
  return maxLen;
}

export function isBuiltIn(term) {
  return Object.prototype.hasOwnProperty.call(BUILT_IN, term);
}

export function builtInCount() {
  return Object.keys(BUILT_IN).length;
}

export function lookup(word, dict = merged) {
  const e = dict[word];
  return e ? { word, pinyin: e[0], meaning: e[1], tag: e[2] || 'gen' } : null;
}

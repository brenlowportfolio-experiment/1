// Chinese word segmentation by forward maximum matching against the app's own
// glossary. No external NLP dependency: the dictionary that powers the hover
// glosses is the same dictionary that decides where word boundaries fall, so
// every token the reader shows is a token we can actually explain.

import { lexicon, maxTermLen } from './lexicon.js';

const HAN = /[㐀-䶿一-鿿]/;

export function isHan(ch) {
  return HAN.test(ch);
}

/**
 * Split a paragraph into tokens.
 * @returns {Array<{text, start, end, han, entry}>} offsets are into `text`.
 */
export function segment(text, dict = lexicon()) {
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    if (!isHan(text[i])) {
      // Keep runs of punctuation / latin / digits together as one inert token.
      let j = i;
      while (j < text.length && !isHan(text[j])) j++;
      tokens.push({ text: text.slice(i, j), start: i, end: j, han: false, entry: null });
      i = j;
      continue;
    }

    let word = null;
    const maxLen = Math.min(maxTermLen(), text.length - i);
    for (let len = maxLen; len >= 2; len--) {
      const cand = text.substr(i, len);
      if (dict[cand]) {
        word = cand;
        break;
      }
    }
    if (!word) word = text[i];

    const e = dict[word];
    tokens.push({
      text: word,
      start: i,
      end: i + word.length,
      han: true,
      entry: e ? { pinyin: e[0], meaning: e[1], tag: e[2] || 'gen' } : null,
    });
    i += word.length;
  }

  return tokens;
}

/**
 * Best-effort pinyin + gloss for an arbitrary span the user selected, which is
 * often not itself a dictionary headword (e.g. 支付全部价款). Falls back to
 * concatenating the pinyin of its parts so the card is never blank.
 */
export function describeSpan(span, dict = lexicon()) {
  const exact = dict[span];
  if (exact) return { pinyin: exact[0], meaning: exact[1], exact: true };

  const parts = segment(span, dict).filter((t) => t.han);
  const pinyin = parts
    .map((t) => (t.entry ? t.entry.pinyin : t.text))
    .join(' ');
  // Content words only — glossing 的/于/其 back at the user is just noise.
  const content = parts.filter((t) => t.entry && t.entry.tag !== 'func');
  const meaning = (content.length ? content : parts.filter((t) => t.entry))
    .map((t) => `${t.text} = ${t.entry.meaning}`)
    .join('; ');
  return { pinyin, meaning, exact: false };
}

/** Sentence containing [start,end) within a paragraph — used as card context. */
export function sentenceAround(text, start, end) {
  const BREAK = '。！？；;\n';
  let s = start;
  while (s > 0 && !BREAK.includes(text[s - 1])) s--;
  let e = end;
  while (e < text.length && !BREAK.includes(text[e])) e++;
  if (e < text.length) e++; // include the terminator
  return { text: text.slice(s, e).trim(), offset: s };
}

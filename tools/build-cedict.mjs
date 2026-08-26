// Builds vendor/cedict.json from CC-CEDICT.
//
//   npm install cedict
//   node tools/build-cedict.mjs
//
// CC-CEDICT is CC-BY-SA-3.0 (MDBG). The generated file inherits that licence —
// see vendor/NOTICE.md. Only the fallback gloss layer uses it; the curated
// legal dictionary in src/data/dictionary.js stays hand-written and always wins.

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const entries = require('cedict');

const HAN_ONLY = /^[\u3400-\u4dbf\u4e00-\u9fff]+$/;

// Entries that would add noise rather than meaning to a legal reader.
const SKIP_DEF = [
  /^variant of/i,
  /^old variant of/i,
  /^archaic variant of/i,
  /^see [\u4e00-\u9fff]/i,
  /^abbr\. for [\u4e00-\u9fff]+$/i,
  /^surname /i,
  /^\(onom\.\)/i,
];

const TONES = {
  a: 'aāáǎà', e: 'eēéěè', i: 'iīíǐì',
  o: 'oōóǒò', u: 'uūúǔù', 'ü': 'üǖǘǚǜ',
};

/** si4 er2 -> sì ér, the display form used everywhere in the app. */
function toneMarks(numbered) {
  return numbered
    .split(/\s+/)
    .map((syl) => {
      // ü must be in the class: CC-CEDICT writes both "lu:4" and "lü4", and
      // omitting it left every ü syllable unconverted — including 律师.
      const m = syl.match(/^([a-zA-ZüÜ:]+)([1-5])$/);
      if (!m) return syl;
      let [, body, tone] = m;
      const t = Number(tone);
      body = body.replace(/u:/g, 'ü').replace(/v/g, 'ü').toLowerCase();
      if (t === 5) return body;
      // Tone sits on a/e; on the o of ou; otherwise on the last vowel.
      let idx = -1;
      if (body.includes('a')) idx = body.indexOf('a');
      else if (body.includes('e')) idx = body.indexOf('e');
      else if (body.includes('ou')) idx = body.indexOf('o');
      else {
        for (let i = body.length - 1; i >= 0; i--) {
          if ('aeiouü'.includes(body[i])) { idx = i; break; }
        }
      }
      if (idx < 0) return body;
      const ch = body[idx];
      const marked = TONES[ch] ? TONES[ch][t] : ch;
      return body.slice(0, idx) + marked + body.slice(idx + 1);
    })
    .join(' ');
}

/**
 * CC-CEDICT writes for dictionary users, not for this field. "law; CL:條|条
 * [tiao2], 套[tao4]" is a correct entry and useless as a flashcard meaning, so
 * classifier notes, bracketed pinyin and traditional|simplified pairs go.
 */
function cleanGloss(t) {
  return t
    .replace(/\bCL:.*/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[一-鿿]+\|[一-鿿]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[;,\s]+|[;,\s]+$/g, '')
    .trim();
}

const out = {};
let seen = 0;
let kept = 0;

for (const e of entries) {
  seen++;
  const word = (e.simplified || e.traditional || '').trim();
  if (!word || !HAN_ONLY.test(word)) continue;
  if (word.length > 6) continue;
  const def = e.definitions?.[0];
  if (!def) continue;

  const senses = (def.translations || [])
    .filter((t) => t && !SKIP_DEF.some((re) => re.test(t)))
    .map(cleanGloss)
    .filter(Boolean)
    .slice(0, 2);
  if (!senses.length) continue;

  let gloss = senses.join('; ');
  if (gloss.length > 90) gloss = gloss.slice(0, 87).replace(/[,;\s]+\S*$/, '') + '…';

  // Longer headwords win when CC-CEDICT lists the same string twice.
  if (out[word]) continue;
  out[word] = [toneMarks(def.pinyin || ''), gloss];
  kept++;
}

writeFileSync(
  new URL('../vendor/cedict.json', import.meta.url),
  JSON.stringify(out),
);

console.log(`scanned ${seen} entries, kept ${kept}`);

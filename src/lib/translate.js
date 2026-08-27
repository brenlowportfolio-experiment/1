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
import { cnToArabic } from './sectionize.js';

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
// ── phrases ────────────────────────────────────────────────────────────────
//
// A dragged selection is usually a phrase, not a headword, and glossing it a
// word at a time is close to useless: 关于第八条陈述与保证 came out as
// "regarding + article + eight + representations and warranties".
//
// Two changes fix most of it. Split the span into the *fewest, longest* known
// units rather than greedily left to right, then join them in order instead of
// listing them — Chinese and English agree on verb-object and
// preposition-object order often enough that "regarding article 8
// representations and warranties" simply reads. On top of that sits a small set
// of templates for the function words that carry legal Chinese, since those are
// what a word list mangles worst.

const LEAD_TEMPLATE = [
  ['应当', 'shall'],
  ['必须', 'must'],
  ['不得', 'may not'],
  ['无权', 'has no right to'],
  ['有权', 'is entitled to'],
  ['可以', 'may'],
  ['未能', 'fails to'],
  ['依照', 'in accordance with'],
  ['按照', 'in accordance with'],
  ['根据', 'on the basis of'],
  ['依据', 'pursuant to'],
  ['鉴于', 'whereas'],
  ['除非', 'unless'],
  ['因', 'by reason of'],
  ['经', 'upon'],
  ['自', 'from'],
  ['就', 'in respect of'],
  ['应', 'shall'],
  ['未', 'has not'],
];

// 第八条 and 第一百四十二条 are single references, not numerals to be read
// aloud. Left to the splitter they came out "(ordinal prefix) eight article"
// and "first hundred four twelve article".
const ORDINAL = /第[〇零一二三四五六七八九十百千两\d]+[条款项章节编]/g;
const ORDINAL_LABEL = {
  '条': 'Article', '款': 'paragraph', '项': 'sub-paragraph',
  '章': 'Chapter', '节': 'Section', '编': 'Book',
};

function ordinalGloss(unit) {
  const kind = unit[unit.length - 1];
  const n = cnToArabic(unit.slice(1, -1));
  return n ? `${ORDINAL_LABEL[kind]} ${n}` : null;
}

const TAIL_TEMPLATE = [
  ['之日起', 'from the date of'],
  ['项下', 'under'],
  ['以内', 'within'],
  ['以外', 'outside'],
  ['除外', 'excepted'],
];

/**
 * Gloss an arbitrary selected span — a word, or a phrase dragged across
 * several. Whole-span lookup first, then a phrase assembly.
 *
 * @returns {{pinyin, meaning, source, units}}
 */
export function glossPhrase(span) {
  const dict = lexicon();

  const whole = dict[span] || cedict?.[span];
  if (whole && whole[1]) {
    return {
      pinyin: whole[0],
      meaning: whole[1],
      source: dict[span] ? 'curated' : 'cedict',
      units: [span],
    };
  }

  const units = tokenize(span, dict);
  const syllables = [];
  const glosses = [];
  let complete = true;

  for (const u of units) {
    const own = dict[u];
    const fb = cedict?.[u];
    syllables.push(own ? own[0] : fb ? fb[0] : composedPinyin(u, dict));

    const ord = /^第.+[条款项章节编]$/.test(u)
      ? ordinalGloss(u)
      : /^[〇零一二三四五六七八九十百千两]{2,}$/.test(u)
        ? numeralGloss(u)
        : null;
    const mean = ord || (own && own[1] ? own[1] : fb ? fb[1] : null);
    if (mean) {
      glosses.push({ zh: u, en: ord || tersest(mean) });
    } else {
      glosses.push({ zh: u, en: null });
      complete = false;
    }
  }

  return {
    pinyin: syllables.join(' '),
    meaning: assemble(span, glosses),
    source: units.length === 1 ? (complete ? 'composed' : 'partial') : complete ? 'phrase' : 'partial',
    units,
  };
}

// A run of numerals is a number. Split, 二十四个月 read as "two fourteen
// month"; kept whole it is "24 months".
const NUMERAL = /[〇零一二三四五六七八九十百千两]{2,}/g;

/** Pull statutory references and numbers out whole, split what is left. */
function tokenize(span, dict) {
  const units = [];
  let last = 0;
  const marks = [...span.matchAll(ORDINAL), ...span.matchAll(NUMERAL)].sort(
    (a, b) => a.index - b.index,
  );
  for (const m of marks) {
    if (m.index < last) continue; // an ordinal already swallowed this number
    if (m.index > last) units.push(...bestSplit(span.slice(last, m.index), dict));
    units.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < span.length) units.push(...bestSplit(span.slice(last), dict));
  return units;
}

function numeralGloss(unit) {
  const n = cnToArabic(unit);
  return n ? String(n) : null;
}

function composedPinyin(unit, dict) {
  return [...unit]
    .map((ch) => (dict[ch] ? dict[ch][0] : cedict?.[ch] ? cedict[ch][0] : ch))
    .join(' ');
}

/**
 * The shortest usable form of a sense. Inside a phrase, 价款 wants to be
 * "price", not "price, consideration" — the alternatives belong in a
 * dictionary entry, not in the middle of a sentence.
 */
function tersest(meaning) {
  let t = meaning.split(/[;；]/)[0];
  t = t.replace(/\s*\([^)]*\)/g, '');
  t = t.split(/[,，]/)[0];
  // Curated entries write 之日起 as "from the date of…"; the ellipsis is a
  // placeholder for the thing that follows, which in a phrase is right there.
  return t.replace(/[…]+$/, '').trim();
}

/**
 * Fewest, longest known units. Greedy left-to-right matching splits
 * 支付全部价款 badly; a shortest-path pass over the span keeps whole terms
 * intact and only falls back to single characters where it has to.
 */
function bestSplit(span, dict) {
  const n = span.length;
  const cost = new Array(n + 1).fill(Infinity);
  const from = new Array(n + 1).fill(-1);
  cost[0] = 0;

  for (let i = 0; i < n; i++) {
    if (cost[i] === Infinity) continue;
    for (let len = Math.min(8, n - i); len >= 1; len--) {
      const w = span.substr(i, len);
      const known = !!(dict[w] || cedict?.[w]);
      // A known multi-character unit is cheapest; a bare unknown character is
      // expensive, so the path avoids shredding the span.
      const step = known ? (len > 1 ? 1 : 1.4) : len === 1 ? 3 : Infinity;
      if (step === Infinity) continue;
      if (cost[i] + step < cost[i + len]) {
        cost[i + len] = cost[i] + step;
        from[i + len] = i;
      }
    }
  }

  const out = [];
  let at = n;
  while (at > 0 && from[at] !== -1) {
    out.unshift(span.slice(from[at], at));
    at = from[at];
  }
  return out.length ? out : [...span];
}

// Modals read the same wherever they sit, and their dictionary forms are
// infinitives: 未能 mid-phrase gave "either party to fail to perform".
const MODAL = {
  '应当': 'shall', '应': 'shall', '必须': 'must', '不得': 'may not',
  '可以': 'may', '有权': 'is entitled to', '无权': 'has no right to',
  '未能': 'fails to', '需': 'needs to',
};

function assemble(span, glosses) {
  let parts = glosses
    .filter((g) => g.en)
    .map((g) => (MODAL[g.zh] ? { ...g, en: MODAL[g.zh] } : g));
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].en;

  let lead = '';
  let tail = '';

  // 的 closing a legal clause is the protasis marker: "…的，应当…" reads
  // "where …, shall …". Rendering it as "possessive particle" is noise.
  if (span.endsWith('的')) {
    lead = 'where ';
    parts = parts.filter((g) => g.zh !== '的');
  }

  // 除…外 wraps its object rather than preceding it: 除因不可抗力外 is
  // "other than by reason of force majeure", not "to remove … outside".
  if (parts.length > 2 && parts[0].zh === '除') {
    const wi = parts.findIndex((g, k) => k > 0 && (g.zh === '外' || g.zh === '除外'));
    if (wi > 0) {
      lead += 'other than ';
      parts = [...parts.slice(1, wi), ...parts.slice(wi + 1)];
    }
  }

  // 自…之日起 is a single frame. Applying the lead and tail rules separately
  // produced "from this Agreement to sign from the date of".
  if (span.startsWith('自') && span.endsWith('之日起')) {
    const inner = parts.filter((g) => g.zh !== '自' && g.zh !== '之日起');
    if (inner.length) {
      return `from the date of ${inner.map((g) => g.en).join(' ')}`;
    }
  }

  // Chinese puts the prepositional phrase before the verb, English after:
  // 向任何第三方披露 is "disclose to any third party". The frame is everywhere
  // in operative language, so it is worth turning around.
  //
  // Where the object ends is the only hard part, and the glosses answer it —
  // CC-CEDICT writes verbs as "to disclose", so the first part glossed that
  // way begins the verb phrase and everything before it is the object.
  const PP = { '向': 'to', '对': 'to', '给': 'to', '与': 'with' };
  const pi = parts.findIndex((g) => PP[g.zh]);
  if (pi >= 0 && pi < parts.length - 1) {
    const vi = parts.findIndex((g, k) => k > pi && /^to /.test(g.en));
    if (vi > pi + 1) {
      const obj = parts.slice(pi + 1, vi);
      const vp = parts.slice(vi);
      parts = [...parts.slice(0, pi), ...vp, { zh: parts[pi].zh, en: PP[parts[pi].zh] }, ...obj];
    }
  }

  // Applied repeatedly: 应当依据… needs both "shall" and "pursuant to".
  for (let guard = 0; guard < 3; guard++) {
    const hit = LEAD_TEMPLATE.find(([zh]) => parts.length > 1 && parts[0].zh === zh);
    if (!hit) break;
    lead += `${hit[1]} `;
    parts = parts.slice(1);
  }

  for (const [zh, en] of TAIL_TEMPLATE) {
    if (parts.length > 1 && parts[parts.length - 1].zh === zh) {
      tail = ` ${en}`;
      parts = parts.slice(0, -1);
      break;
    }
  }

  // Structural particles add nothing once the parts are inlined.
  const NOISE = new Set(['的', '之', '所', '了', '着', '地', '其']);
  parts = parts.filter((g) => !NOISE.has(g.zh));
  if (!parts.length) return (lead + tail).trim();

  const text = lead + parts.map((g) => g.en).join(' ') + tail;
  return text
    // A modal already supplies the infinitive: "is entitled to to terminate".
    .replace(/\b(shall|must|may not|may|is entitled to|has no right to|fails to|has not)\s+to\s+/g, '$1 ')
    .replace(/\bto\s+to\b/g, 'to')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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
  phrase: 'read as a phrase',
  composed: 'built from the parts',
  partial: 'built from some parts',
  none: 'no translation found',
};

// Novel-term discovery for uploaded documents.
//
// The problem: a legal compound the lexicon doesn't know (表决权委托, 对赌条款)
// doesn't announce itself — maximum matching just shatters it into single
// characters. So we can't find new words by looking at what segmentation
// failed on alone; we have to propose candidates and score them.
//
// Three signals, combined:
//
//   uncovered  — how much of the span the current lexicon failed to group.
//                A run of characters the segmenter left isolated is the
//                strongest hint that a word is sitting there unrecognised.
//   cohesion   — do these characters stick together? Compared against how
//                often each half occurs independently (a PMI-style ratio).
//   freedom    — does the span vary at its edges? A real word appears in many
//                different left/right contexts; a fragment of a longer phrase
//                is always followed by the same character.
//
// Cohesion and freedom are weak on a single short document, so a candidate can
// also qualify structurally: entirely uncovered characters, bounded by known
// words or punctuation. Those surface with lower confidence and are marked.

import { lexicon } from './lexicon.js';
import { segment, sentenceAround } from './segment.js';
import { builtInCorpus } from '../data/contexts/index.js';

const HAN_RUN = /[㐀-䶿一-鿿]+/g;

// Characters that shouldn't start or end a term — particles, conjunctions,
// numerals, and the bureaucratic scaffolding that glues clauses together.
const EDGE_STOP = new Set([
  ...'的了着是在和与或及其之为以于而则者等且但如就都也很更最不未无非有所被将把从对向由至自即该本此每各任何我你您他们个次份批种类',
  ...'一二三四五六七八九十百千万亿零两第',
  ...'并予亦故遂现须乃若方', // formal connectives — glue, not vocabulary
]);

const NUMERIC = new Set([...'一二三四五六七八九十百千万亿零两0123456789']);

const MIN_N = 2;
const MAX_N = 6;

/**
 * @param {string} text raw uploaded document
 * @returns {{stats, candidates: Array}}
 */
export function discover(text, { limit = 80 } = {}) {
  const dict = lexicon();
  const runs = text.match(HAN_RUN) || [];

  // ── coverage: which characters did the lexicon already group into words? ──
  let hanTotal = 0;
  let inKnownWord = 0;
  const knownTermFreq = new Map();

  // Per-run: a boolean per character, true when that character was absorbed
  // into a multi-character dictionary term.
  const covered = runs.map((run) => {
    const flags = new Array(run.length).fill(false);
    for (const t of segment(run, dict)) {
      hanTotal += t.text.length;
      if (t.text.length > 1) {
        inKnownWord += t.text.length;
        for (let i = t.start; i < t.end; i++) flags[i] = true;
        knownTermFreq.set(t.text, (knownTermFreq.get(t.text) || 0) + 1);
      }
    }
    return flags;
  });

  // ── n-gram statistics ────────────────────────────────────────────────────
  const freq = new Map(); // ngram -> count
  const left = new Map(); // ngram -> Map(char -> count)
  const right = new Map();
  const totalByLen = new Map();

  runs.forEach((run) => {
    for (let n = 1; n <= MAX_N; n++) {
      totalByLen.set(n, (totalByLen.get(n) || 0) + Math.max(0, run.length - n + 1));
      for (let i = 0; i + n <= run.length; i++) {
        const g = run.substr(i, n);
        freq.set(g, (freq.get(g) || 0) + 1);
        if (n >= MIN_N) {
          bump(left, g, i > 0 ? run[i - 1] : '^');
          bump(right, g, i + n < run.length ? run[i + n] : '$');
        }
      }
    }
  });

  // ── candidate generation ─────────────────────────────────────────────────
  const seen = new Set();
  const candidates = [];

  runs.forEach((run, r) => {
    const flags = covered[r];
    for (let n = MIN_N; n <= MAX_N; n++) {
      for (let i = 0; i + n <= run.length; i++) {
        const g = run.substr(i, n);
        if (seen.has(g)) continue;
        if (dict[g]) continue;                       // already known
        if (EDGE_STOP.has(g[0]) || EDGE_STOP.has(g[n - 1])) continue;
        if ([...g].every((c) => NUMERIC.has(c))) continue;

        const uncovered = countFalse(flags, i, i + n) / n;
        const f = freq.get(g) || 0;
        const coh = cohesion(g, freq, totalByLen);
        const free = Math.min(entropy(left.get(g)), entropy(right.get(g)));

        // Two routes in.
        //
        // Statistical: repeats, binds tightly, moves between contexts.
        //
        // Structural: the span is exactly a hole in the segmentation — every
        // character uncovered, and known words or punctuation on both sides.
        // Requiring the *whole* hole is what stops 平食品加 being proposed out
        // of the middle of 安平食品加工有限公司; only the complete gap counts.
        // `uncovered > 0` matters: without it, 权人 gets proposed because it
        // repeats and binds tightly — but every occurrence sits inside 债权人,
        // which the lexicon already knows. A span the lexicon has already
        // grouped into known words is an artefact of the sliding window, not
        // vocabulary. Spans that also occur standalone still qualify there.
        const statistical = f >= 2 && coh >= 1.5 && free >= 0.6 && uncovered > 0;
        const structural = uncovered === 1 && n <= 4 && isWholeHole(flags, i, i + n);
        if (!statistical && !structural) continue;

        seen.add(g);
        candidates.push({
          term: g,
          freq: f,
          uncovered,
          cohesion: coh,
          freedom: free,
          route: statistical ? 'statistical' : 'structural',
          score: score({ f, coh, free, uncovered, n, term: g, dict }),
        });
      }
    }
  });

  // ── prune: drop spans subsumed by a longer candidate of equal frequency ──
  candidates.sort((a, b) => b.term.length - a.term.length || b.score - a.score);
  const kept = [];
  for (const c of candidates) {
    const swallowed = kept.some(
      (k) => k.term.includes(c.term) && k.freq === c.freq,
    );
    if (!swallowed) kept.push(c);
  }

  kept.sort((a, b) => b.score - a.score);
  const top = kept.slice(0, limit);

  // ── attach a usage example + a pinyin guess to each survivor ─────────────
  for (const c of top) {
    c.example = firstExample(text, c.term);
    Object.assign(c, guessPinyin(c.term, dict));
  }

  return {
    stats: {
      chars: text.length,
      hanChars: hanTotal,
      coverage: hanTotal ? inKnownWord / hanTotal : 0,
      knownTerms: knownTermFreq.size,
      topKnown: [...knownTermFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([term, n]) => ({ term, n, meaning: dict[term]?.[1] || '' })),
      candidateCount: kept.length,
      docType: detectType(text),
      outline: outline(text),
    },
    candidates: top,
  };
}

// ── scoring ────────────────────────────────────────────────────────────────

function score({ f, coh, free, uncovered, n, term, dict }) {
  let s = 0;
  s += Math.log2(1 + f) * 1.0;
  s += Math.min(coh / 6, 1) * 1.4;
  s += Math.min(free / 2.5, 1) * 0.8;
  s += uncovered * 1.6;
  // Legal/business characters make a compound far likelier to be worth a card.
  const registerHits = [...term].filter((c) => {
    const tag = dict[c]?.[2];
    return tag === 'law' || tag === 'biz';
  }).length;
  s += Math.min(registerHits / n, 1) * 0.5;
  // Two- and three-character compounds are the sweet spot for vocabulary.
  s -= n >= 5 ? 0.4 : 0;
  return s;
}

/** PMI-flavoured stickiness: the worst split is the one that matters. */
function cohesion(g, freq, totalByLen) {
  const n = g.length;
  const N = totalByLen.get(n) || 1;
  const fg = (freq.get(g) || 0) / N;
  let worst = Infinity;
  for (let k = 1; k < n; k++) {
    const a = g.slice(0, k);
    const b = g.slice(k);
    const fa = (freq.get(a) || 0) / (totalByLen.get(a.length) || 1);
    const fb = (freq.get(b) || 0) / (totalByLen.get(b.length) || 1);
    if (!fa || !fb) continue;
    worst = Math.min(worst, fg / (fa * fb));
  }
  return worst === Infinity ? 0 : worst;
}

/** Is [from,to) exactly a gap the lexicon failed to cover, edge to edge? */
function isWholeHole(flags, from, to) {
  const leftClosed = from === 0 || flags[from - 1];
  const rightClosed = to === flags.length || flags[to];
  return leftClosed && rightClosed;
}

/**
 * Variety of the characters flanking a span. A real word turns up in many
 * different surroundings; a fragment is always followed by the same character.
 *
 * Run boundaries ('^' and '$' — punctuation, line ends) count as *maximum*
 * freedom rather than zero: text ending at a comma is unambiguous evidence of
 * a word edge, which is the opposite of what a naive entropy would score it.
 */
function entropy(ctx) {
  if (!ctx || ctx.size === 0) return 0;
  const counts = [];
  for (const [ch, v] of ctx) {
    if (ch === '^' || ch === '$') for (let i = 0; i < v; i++) counts.push(1);
    else counts.push(v);
  }
  const total = counts.reduce((a, b) => a + b, 0);
  let h = 0;
  for (const c of counts) {
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function bump(map, key, ch) {
  let inner = map.get(key);
  if (!inner) map.set(key, (inner = new Map()));
  inner.set(ch, (inner.get(ch) || 0) + 1);
}

function countFalse(flags, from, to) {
  let n = 0;
  for (let i = from; i < to; i++) if (!flags[i]) n++;
  return n;
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Pinyin assembled from whatever the lexicon already knows. */
export function guessPinyin(term, dict = lexicon()) {
  const syllables = [];
  let complete = true;
  for (const t of segment(term, dict)) {
    if (!t.han) continue;
    if (t.entry) syllables.push(t.entry.pinyin);
    else {
      syllables.push('?');
      complete = false;
    }
  }
  return { pinyin: syllables.join(' '), pinyinComplete: complete };
}

function firstExample(text, term) {
  const at = text.indexOf(term);
  if (at === -1) return '';
  return sentenceAround(text, at, at + term.length).text.slice(0, 120);
}

const TYPE_MARKERS = [
  ['judgments', ['本院认为', '判决如下', '原告', '被告', '上诉人', '经审理查明', '驳回']],
  ['contracts', ['甲方', '乙方', '本协议', '本合同', '双方约定', '违约责任', '第一条']],
  ['emails', ['主题', '您好', '此致', '顺颂商祺', '敬上', '烦请', '收悉']],
];

function detectType(text) {
  let best = { id: 'judgments', hits: 0 };
  for (const [id, markers] of TYPE_MARKERS) {
    const hits = markers.filter((m) => text.includes(m)).length;
    if (hits > best.hits) best = { id, hits };
  }
  return best.hits ? best.id : null;
}

const OUTLINE_MARKERS = [
  '原告', '被告', '上诉人', '被上诉人', '第三人',
  '经审理查明', '本院查明', '原告诉称', '被告辩称', '上诉人上诉称', '被上诉人答辩称',
  '本院认为', '综上', '依照', '判决如下', '驳回', '案件受理费', '如不服本判决',
  '鉴于', '兹', '定义', '陈述与保证', '保密', '竞业限制', '违约责任',
  '不可抗力', '法律适用', '争议解决', '通知', '附件',
  '主题', '此致', '顺颂商祺',
];

/** The structural skeleton — reusable without reusing any of the wording. */
function outline(text) {
  const found = [];
  for (const m of OUTLINE_MARKERS) {
    const at = text.indexOf(m);
    if (at !== -1) found.push({ marker: m, at });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.marker);
}

// ── plagiarism guard ───────────────────────────────────────────────────────

let boilerplate = null;

/**
 * Stock phrasing, taken from the shipped hypotheticals. 判决如下 and
 * 驳回原告的其他诉讼请求 are formulae every judgment shares — reusing them is
 * the entire point of the exercise, so they must not read as copying.
 */
function boilerplateGrams(n) {
  if (!boilerplate || boilerplate.n !== n) {
    const text = (builtInCorpus().match(HAN_RUN) || []).join('');
    const set = new Set();
    for (let i = 0; i + n <= text.length; i++) set.add(text.substr(i, n));
    boilerplate = { n, set };
  }
  return boilerplate.set;
}

/**
 * How much verbatim text does a generated document share with its source,
 * ignoring stock legal phrasing? Used to stop an uploaded real judgment from
 * leaking into study material.
 */
export function verbatimOverlap(source, generated, n = 10) {
  const a = (source.match(HAN_RUN) || []).join('');
  const b = (generated.match(HAN_RUN) || []).join('');
  if (a.length < n || b.length < n) return { maxRun: 0, ratio: 0, longest: '', formulaic: 0 };

  const grams = new Set();
  for (let i = 0; i + n <= a.length; i++) grams.add(a.substr(i, n));
  const stock = boilerplateGrams(n);

  const hit = new Array(b.length).fill(false);
  let maxRun = 0;
  let longest = '';
  let formulaic = 0;

  for (let i = 0; i + n <= b.length; i++) {
    const g = b.substr(i, n);
    if (!grams.has(g)) continue;
    if (stock.has(g)) {
      formulaic++;
      continue;
    }
    // Extend the match as far as it genuinely runs on.
    let end = i + n;
    while (end < b.length && a.includes(b.slice(i, end + 1))) end++;
    for (let k = i; k < end; k++) hit[k] = true;
    if (end - i > maxRun) {
      maxRun = end - i;
      longest = b.slice(i, end);
    }
  }

  const covered = hit.filter(Boolean).length;
  return { maxRun, ratio: b.length ? covered / b.length : 0, longest, formulaic };
}

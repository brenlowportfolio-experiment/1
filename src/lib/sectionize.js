// Cutting a long real document into study-sized pieces.
//
// A statute is not a document you read end to end — 民法典 Book III alone runs
// past 42,000 characters. What's wanted is a few hundred characters at a time,
// cut where the text itself says a unit ends, never mid-article, and labelled
// well enough that you know what you're looking at when it turns up in review.

import { normalizeText, stripTranslation, countHan, hanRatio } from './normalize.js';

// 第一条 / 第四百六十六条 — the article marker, at the head of a line only.
// Mid-sentence cross-references (…依据本法第一百四十二条…) must not split.
const ARTICLE_HEAD = /^(第[〇零一二三四五六七八九十百千两\d]+条)\s*/;
const HEADING_RE = /^(第[〇零一二三四五六七八九十百千\d]+分?[编章节])\s*(\S.*)?$/;
// Contract-style numbering, so the same machinery works on a licensed precedent.
const CLAUSE_HEAD = /^(第[〇零一二三四五六七八九十百千\d]+条|[0-9]+(\.[0-9]+)*)\s*/;
const TERMINAL = /[。！？；]$/;

const TARGET = 380; // Han characters per section — a comfortable sitting
const MAX = 620;

/**
 * A heading is short and unpunctuated. Without this, a wrapped cross-reference
 * — "第三节和本编的有关规定确定，不得仅以…" — reads as a chapter title and
 * derails every section boundary after it.
 */
function HEADING(line) {
  const m = line.match(HEADING_RE);
  if (!m) return null;
  const rest = (m[2] || '').trim();
  if (rest.length > 18) return null;
  if (/[。，；：！？]/.test(rest)) return null;
  return m;
}

/**
 * @param {string} raw text of the uploaded document
 * @returns {{units, sections, meta}}
 */
export function sectionize(raw, { target = TARGET, max = MAX } = {}) {
  const text = normalizeText(raw);
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const { lines, dropped } = stripTranslation(rawLines);

  // ── rebuild paragraphs ──────────────────────────────────────────────────
  // PDF extraction wraps at the column width, so a line ending without
  // terminal punctuation is a continuation, not a new paragraph.
  const paras = [];
  for (const line of lines) {
    const isHeading = !!HEADING(line);
    const startsUnit = ARTICLE_HEAD.test(line) || isHeading;
    const prev = paras[paras.length - 1];
    if (!startsUnit && prev && !TERMINAL.test(prev.text) && !prev.heading && hanRatio(line) > 0.3) {
      prev.text += line;
    } else {
      paras.push({ text: line, heading: isHeading });
    }
  }

  // ── group paragraphs into units (one article, or one run of prose) ──────
  const units = [];
  let chapter = null;
  let book = null;

  for (const p of paras) {
    const h = HEADING(p.text);
    if (h) {
      // PDF letter-spacing turns 准合同 into "准 合 同"; close it back up.
      const rest = (h[2] || '').replace(/(?<=[一-鿿])\s+(?=[一-鿿])/g, '');
      const label = (h[1] + ' ' + rest).trim();
      if (h[1].endsWith('编')) book = label;
      else chapter = label;
      continue; // headings label the units; they aren't study text themselves
    }

    const art = p.text.match(ARTICLE_HEAD);
    if (art || !units.length) {
      units.push({
        label: art ? art[1] : null,
        paragraphs: [p.text],
        book,
        chapter,
        han: countHan(p.text),
      });
    } else {
      const u = units[units.length - 1];
      u.paragraphs.push(p.text);
      u.han += countHan(p.text);
    }
  }

  // Anything before the first article is front matter — a web page's search
  // box, an editor credit line, a publication date. Not study text.
  const firstArticle = units.findIndex((u) => u.label);
  const frontMatter = firstArticle > 0 ? units.splice(0, firstArticle) : [];

  // ── pack units into sections ────────────────────────────────────────────
  const sections = [];
  let cur = null;

  const flush = () => {
    if (cur && cur.units.length) sections.push(finish(cur));
    cur = null;
  };

  for (const u of units) {
    // A chapter boundary is a real seam — start fresh so a section never
    // straddles 合同的订立 and 合同的效力.
    if (cur && (cur.chapter !== u.chapter || cur.han + u.han > max)) flush();
    if (!cur) cur = { units: [], han: 0, book: u.book, chapter: u.chapter };
    cur.units.push(u);
    cur.han += u.han;
    if (cur.han >= target) flush();
  }
  flush();

  // Packing leaves remainders — a chapter of five articles hits the target and
  // flushes, stranding the sixth alone. Fold those back where they fit.
  const merged = [];
  for (const s of sections) {
    const prev = merged[merged.length - 1];
    if (prev && s.han < target / 3 && prev.chapter === s.chapter && prev.han + s.han <= max) {
      prev.paragraphs.push(...s.paragraphs);
      prev.han += s.han;
      prev.articleCount += s.articleCount;
      prev.range = rangeOf(prev.range, s.range);
      prev.titleZh = [prev.chapter, prev.range].filter(Boolean).join('　') || prev.titleZh;
    } else {
      merged.push(s);
    }
  }

  return {
    sections: merged,
    meta: {
      chars: text.length,
      han: countHan(text),
      translationLinesDropped: dropped,
      frontMatterDropped: frontMatter.length,
      articles: units.filter((u) => u.label).length,
      units: units.length,
      chapters: [...new Set(units.map((u) => u.chapter).filter(Boolean))],
      book,
      sourceTitle: guessSourceTitle(text),
    },
  };
}

/** 四百六十三 → 463, so an English title can read "Arts. 463–468". */
export function cnToArabic(str) {
  if (/^\d+$/.test(str)) return Number(str);
  const D = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const U = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let cur = 0;
  for (const ch of str) {
    if (ch in D) cur = D[ch];
    else if (ch in U) {
      total += (cur || 1) * U[ch];
      cur = 0;
    }
  }
  return total + cur;
}

function rangeOf(a, b) {
  const first = (a || b).split('—')[0];
  const parts = (b || a).split('—');
  const last = parts[parts.length - 1];
  return first === last ? first : `${first}—${last}`;
}

function finish(cur) {
  const labels = cur.units.map((u) => u.label).filter(Boolean);
  const range =
    labels.length > 1
      ? `${labels[0]}—${labels[labels.length - 1]}`
      : labels[0] || '';
  const parts = [cur.chapter, range].filter(Boolean);
  return {
    titleZh: parts.join('　') || '节选',
    range,
    chapter: cur.chapter || '',
    book: cur.book || '',
    han: cur.han,
    paragraphs: cur.units.flatMap((u) => u.paragraphs),
    articleCount: labels.length,
  };
}

/** 《中华人民共和国民法典》 and friends, if the document names itself. */
function guessSourceTitle(text) {
  const head = text.slice(0, 3000);
  const bracketed = head.match(/《([^》]{2,40}(?:法典|法|条例|规定|办法|规则|解释))》/);
  if (bracketed) return bracketed[1];
  // Lazy, and 法典 before 法 — otherwise 民法典 can never match, since a greedy
  // prefix leaves 典 dangling after the 法.
  const bare = head.match(/(中华人民共和国[一-鿿]{1,12}?(?:法典|法))(?![一-鿿])/);
  if (bare) return bare[1];
  return '';
}

/**
 * Which context does this belong in? Statutes are the distinctive case: many
 * line-initial 第X条, 本法/本编 self-reference, and none of the 甲方/乙方
 * machinery that marks a contract between parties.
 */
export function classify(raw) {
  const text = normalizeText(raw);
  const lines = text.split('\n').map((l) => l.trim());
  const articleHeads = lines.filter((l) => ARTICLE_HEAD.test(l)).length;
  const headings = lines.filter((l) => HEADING(l)).length;

  const has = (s) => text.includes(s);
  const scores = {
    statutes:
      articleHeads * 2 +
      headings * 3 +
      (has('本法') ? 8 : 0) +
      (has('本编') ? 6 : 0) +
      (has('本条例') ? 8 : 0) +
      (has('施行') ? 4 : 0) +
      (has('中华人民共和国') && articleHeads > 3 ? 5 : 0),
    contracts:
      (has('甲方') ? 10 : 0) +
      (has('乙方') ? 10 : 0) +
      (has('本协议') ? 8 : 0) +
      (has('本合同') ? 8 : 0) +
      (has('双方约定') ? 5 : 0) +
      (has('违约责任') ? 3 : 0),
    judgments:
      (has('本院认为') ? 12 : 0) +
      (has('判决如下') ? 12 : 0) +
      (has('经审理查明') ? 10 : 0) +
      (has('原告') ? 4 : 0) +
      (has('被告') ? 4 : 0) +
      (has('上诉人') ? 5 : 0),
    emails:
      (has('主题') ? 5 : 0) +
      (has('您好') ? 6 : 0) +
      (has('此致') ? 8 : 0) +
      (has('顺颂商祺') ? 10 : 0) +
      (has('烦请') ? 5 : 0),
  };

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [id, score] = ranked[0];
  return {
    contextId: score > 0 ? id : null,
    score,
    scores,
    confident: score >= 12 && score > ranked[1][1] * 1.5,
  };
}

// Cleaning up text pasted or extracted from real documents.
//
// PDF extraction routinely hands back characters that *look* right and aren't:
// 当事人 comes out as 当事⼈, using U+2F08 KANGXI RADICAL MAN instead of U+4EBA.
// Nothing downstream can match those — the dictionary misses, segmentation
// shatters, and the reader shows a wall of unglossed characters.
//
// Blanket NFKC would fix it but does collateral damage: it also folds ，；：（）
// down to ASCII, which wrecks Chinese punctuation and with it the sentence
// splitting. So the fix is applied only to the CJK blocks that need it.

// CJK Radicals Supplement (U+2E80–U+2EFF) has no NFKC decomposition, so the
// ones that double as ordinary characters need mapping by hand.
const RADICALS = {
  '⺁': '厂', '⺄': '乙', '⺇': '几', '⺈': '刀', '⺊': '卜', '⺌': '小',
  '⺎': '兀', '⺏': '尢', '⺒': '己', '⺓': '已', '⺔': '巳', '⺕': '彐',
  '⺗': '心', '⺘': '扌', '⺙': '攵', '⺛': '无', '⺝': '月', '⺟': '母',
  '⺠': '民', '⺡': '氵', '⺣': '灬', '⺤': '爪', '⺦': '丬', '⺨': '犭',
  '⺩': '王', '⺫': '罒', '⺭': '礻', '⺮': '竹', '⺯': '糸', '⺰': '纟',
  '⺱': '网', '⺲': '罒', '⺳': '羊', '⺶': '羊', '⺹': '老', '⺻': '聿',
  '⺼': '肉', '⺽': '臼', '⺾': '艹', '⻁': '虎', '⻂': '衤', '⻃': '西',
  '⻄': '西', '⻅': '见', '⻆': '角', '⻈': '讠', '⻉': '贝', '⻊': '足',
  '⻋': '车', '⻌': '辶', '⻍': '辶', '⻏': '阝', '⻐': '钅', '⻑': '长',
  '⻓': '长', '⻔': '门', '⻖': '阝', '⻗': '雨', '⻘': '青', '⻙': '韦',
  '⻚': '页', '⻛': '风', '⻜': '飞', '⻝': '食', '⻟': '饣', '⻠': '饣',
  '⻡': '首', '⻢': '马', '⻣': '骨', '⻤': '鬼', '⻥': '鱼', '⻦': '鸟',
  '⻧': '卤', '⻨': '麦', '⻩': '黄', '⻪': '黾', '⻫': '齐', '⻬': '齐',
  '⻭': '齿', '⻮': '齿', '⻯': '龙', '⻰': '龙', '⻱': '龟', '⻲': '龟',
};

// Kangxi Radicals + CJK Radicals Supplement + Compatibility Ideographs.
const ODD_CJK = /[⺀-⻿⼀-⿟豈-﫿]/g;
const INVISIBLE = /[­​-‍⁠﻿]/g;

/** Repair a block of text extracted from a PDF or pasted from the web. */
export function normalizeText(input) {
  return input
    .replace(INVISIBLE, '')
    .replace(ODD_CJK, (ch) => {
      if (RADICALS[ch]) return RADICALS[ch];
      const nf = ch.normalize('NFKC');
      // Only accept the decomposition when it lands on a single ideograph.
      return nf.length === 1 && /[一-鿿]/.test(nf) ? nf : ch;
    })
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t　]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

/** How much of a line is Han? Used to tell Chinese from its translation. */
export function hanRatio(line) {
  if (!line) return 0;
  const han = (line.match(/[一-鿿]/g) || []).length;
  const meaningful = line.replace(/[\s\d\p{P}]/gu, '').length || line.length;
  return han / Math.max(meaningful, 1);
}

export function countHan(s) {
  return (s.match(/[一-鿿]/g) || []).length;
}

/**
 * Drop the English from a bilingual source. Statute PDFs commonly interleave
 * each article with its translation; keeping it would halve the Chinese in
 * every section and defeat the point of reading unaided.
 */
export function stripTranslation(lines) {
  const kept = [];
  let dropped = 0;
  for (const line of lines) {
    // A line with no Han at all is never study text in a Chinese document —
    // it's a translation, a page number, or a stray wrapped fragment like
    // "laws." that would otherwise glue itself onto the next Chinese line.
    if (countHan(line) === 0) {
      dropped++;
      continue;
    }
    kept.push(line);
  }
  return { lines: kept, dropped };
}

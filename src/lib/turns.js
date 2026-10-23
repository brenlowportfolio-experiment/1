// Turns: reading a script out of plain paragraphs. Pure functions, so the
// reader, the scene player, the review card and the authoring check all agree
// on what a turn is.

/**
 * @returns {{speaker?, side?, en?, prefixEnd?, stage?}} for one paragraph
 */
export function parseTurn(text, speakers = {}) {
  const m = text.match(/^([^：:（(\s]{1,8})[：:]/);
  if (m && speakers[m[1]]) {
    const sp = speakers[m[1]];
    return { speaker: m[1], side: sp.side || 'neutral', en: sp.en || '', prefixEnd: m[0].length };
  }
  if (/^（.*）$/.test(text.trim())) return { stage: true };
  return {};
}

export function sideClass(side) {
  return `side-${side || 'neutral'}`;
}

/**
 * A scene's "what would you say?" moments, keyed by paragraph index. A moment
 * whose `who` doesn't match the turn it points at is dropped rather than shown
 * on the wrong line (tools/check-scenes.mjs reports it).
 * @returns {Map<number, {p, who, cue, en, keys, line, prefixEnd}>}
 */
export function momentsOf(doc) {
  const out = new Map();
  for (const m of doc.moments || []) {
    const text = doc.paragraphs[m.p];
    if (!text) continue;
    const t = parseTurn(text, doc.speakers);
    if (t.speaker !== m.who) continue;
    out.set(m.p, { ...m, keys: m.keys || [], line: text.slice(t.prefixEnd), prefixEnd: t.prefixEnd });
  }
  return out;
}

/**
 * The turns before paragraph p that set it up — what was just said to you,
 * with any stage direction in between.
 */
export function leadIn(doc, p, max = 1) {
  const out = [];
  for (let i = p - 1; i >= 0; i--) {
    const text = doc.paragraphs[i];
    const t = parseTurn(text, doc.speakers);
    if (t.speaker) out.unshift({ speaker: t.speaker, side: t.side, text: text.slice(t.prefixEnd) });
    else if (t.stage) out.unshift({ stage: true, text });
    if (out.filter((x) => !x.stage).length >= max) break;
  }
  return out;
}

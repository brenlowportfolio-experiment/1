// Reader — read a hypothetical document, hover any word for pinyin + meaning,
// drag across a run of words to mint a flashcard from it.

import { el, clear, ruby, append } from '../lib/dom.js';
import { segment, sentenceAround } from '../lib/segment.js';
import { glossPhrase, loadGlossary, glossaryReady, SOURCE_LABEL } from '../lib/translate.js';
import { getDoc } from '../data/contexts/index.js';
import * as store from '../lib/store.js';

let tooltip;
let popup;

function ensureFloaters() {
  if (!tooltip) {
    tooltip = el('div', { class: 'tooltip', hidden: 'hidden' });
    document.body.append(tooltip);
  }
  if (!popup) {
    popup = el('div', { class: 'selpopup', hidden: 'hidden' });
    document.body.append(popup);
  }
}

function hideTooltip() {
  if (tooltip) tooltip.hidden = true;
}

function hidePopup() {
  if (popup) popup.hidden = true;
}

function place(node, rect) {
  node.hidden = false;
  const pad = 10;
  const w = node.offsetWidth;
  const h = node.offsetHeight;
  let left = rect.left + rect.width / 2 - w / 2 + window.scrollX;
  let top = rect.top - h - 8 + window.scrollY;
  if (top < window.scrollY + pad) top = rect.bottom + 8 + window.scrollY;
  left = Math.max(window.scrollX + pad, Math.min(left, window.scrollX + document.documentElement.clientWidth - w - pad));
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
}

export function render(root, { docId, focus } = {}) {
  ensureFloaters();
  const doc = getDoc(docId);
  clear(root);
  if (!doc) {
    root.append(el('p', { class: 'empty', text: 'Document not found.' }));
    return;
  }

  // paraIndex -> token list, kept so selection can map back to characters.
  const paraTokens = doc.paragraphs.map((p) => segment(p));

  let anchor = null; // {p, i}
  let focusTok = null;
  let dragging = false;

  const page = el('article', { class: 'doc' });

  page.append(
    el('header', { class: 'doc-head' }, [
      el('div', { class: 'doc-kicker', text: `${doc.contextName} · ${doc.level}` }),
      el('h1', { class: 'doc-title-zh', text: doc.titleZh }),
      el('p', { class: 'doc-title-en', text: doc.title }),
      el('p', { class: 'doc-summary', text: doc.summary }),
      doc.meta &&
        el(
          'dl',
          { class: 'doc-meta' },
          doc.meta.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]),
        ),
      el('p', {
        class: 'doc-disclaimer',
        text: doc.verbatim
          ? 'Quoted verbatim. This text is reproduced as written, not rewritten for practice.'
          : 'Hypothetical document. Parties, courts, case numbers and facts are invented for language practice.',
      }),
    ]),
  );

  const body = el('div', { class: 'doc-body' });

  paraTokens.forEach((tokens, p) => {
    const para = el('p', { class: 'para', dataset: { p } });
    tokens.forEach((t, i) => {
      if (!t.han) {
        para.append(el('span', { class: 'tok inert', text: t.text }));
        return;
      }
      const known = !!store.findCardByTerm(t.text);
      const span = el('span', {
        class: `tok${t.entry ? '' : ' unknown'}${known ? ' in-deck' : ''}`,
        text: t.text,
        dataset: { p, i },
      });
      para.append(span);
    });
    body.append(para);
  });

  page.append(body);

  page.append(
    el('footer', { class: 'doc-foot' }, [
      el('p', {
        class: 'hint',
        html:
          '<b>Hover</b> a word for pinyin and meaning. <b>Click</b> it, or <b>drag</b> across several words, to build a flashcard from the phrase.',
      }),
    ]),
  );

  root.append(page);

  // ── selection helpers ────────────────────────────────────────────────
  function tokenAt(ev) {
    const node = ev.target.closest?.('.tok');
    if (!node || node.classList.contains('inert')) return null;
    return { node, p: +node.dataset.p, i: +node.dataset.i };
  }

  function paintSelection() {
    body.querySelectorAll('.tok.sel').forEach((n) => n.classList.remove('sel'));
    if (!anchor || !focusTok || anchor.p !== focusTok.p) return;
    const lo = Math.min(anchor.i, focusTok.i);
    const hi = Math.max(anchor.i, focusTok.i);
    const para = body.querySelector(`.para[data-p="${anchor.p}"]`);
    for (let i = lo; i <= hi; i++) {
      para.querySelector(`.tok[data-i="${i}"]`)?.classList.add('sel');
    }
  }

  function currentSpan() {
    if (!anchor || !focusTok || anchor.p !== focusTok.p) return null;
    const lo = Math.min(anchor.i, focusTok.i);
    const hi = Math.max(anchor.i, focusTok.i);
    const toks = paraTokens[anchor.p];
    const para = doc.paragraphs[anchor.p];
    let start = toks[lo].start;
    let end = toks[hi].end;

    // A drag spanning two words also spans the punctuation between them, and
    // at the edges that punctuation is not part of the phrase — it would end
    // up on the flashcard as 本院认为：原、被告签订的.
    const isHan = (c) => /[一-鿿]/.test(c);
    while (start < end && !isHan(para[start])) start++;
    while (end > start && !isHan(para[end - 1])) end--;
    if (start >= end) return null;

    return { p: anchor.p, start, end, text: para.slice(start, end) };
  }

  function openPopup() {
    const sel = currentSpan();
    if (!sel) return hidePopup();
    let info = glossPhrase(sel.text);
    let edited = false;

    // A dragged phrase leans much harder on the fallback glossary than a
    // single hover does, so it is fetched on the first selection rather than
    // on page load. The popup opens straight away with whatever is already
    // known and refines itself when the glossary arrives.
    if (!glossaryReady()) {
      loadGlossary()
        .then(() => {
          const field = popup.querySelector('.sp-meaning');
          if (popup.hidden || !field || edited) return;
          info = glossPhrase(sel.text);
          field.value = info.meaning;
          const note = popup.querySelector('.sp-note');
          if (note) note.textContent = describeSource(info);
        })
        .catch(() => {});
    }
    const sentence = sentenceAround(doc.paragraphs[sel.p], sel.start, sel.end);
    const existing = store.findCardByTerm(sel.text);

    clear(popup);
    append(
      popup,
      el('div', { class: 'sp-term' }, [ruby(sel.text, info.pinyin)]),
      el('input', {
        class: 'sp-meaning',
        type: 'text',
        value: existing?.meaning || info.meaning || '',
        placeholder: 'Meaning (edit freely)',
        spellcheck: 'false',
        oninput: () => {
          edited = true;
        },
      }),
      el('div', { class: 'sp-sentence', text: sentence.text }),
      el('div', { class: 'sp-actions' }, [
        el('button', {
          class: 'btn primary',
          text: existing ? 'Update card' : 'Add flashcard',
          onclick: () => {
            const meaning = popup.querySelector('.sp-meaning').value.trim();
            const source = {
              docId: doc.id,
              contextId: doc.contextId,
              docTitle: doc.titleZh,
              paraIndex: sel.p,
              start: sel.start,
              end: sel.end,
              sentence: sentence.text,
              sentenceOffset: sentence.offset,
            };
            if (existing) {
              store.updateCard(existing.id, { meaning, pinyin: info.pinyin || existing.pinyin });
              store.addCard({ term: sel.text, source, meaning, pinyin: info.pinyin });
            } else {
              store.addCard({ term: sel.text, pinyin: info.pinyin, meaning, source });
            }
            markInDeck(sel);
            hidePopup();
            anchor = focusTok = null;
            paintSelection();
            toast(existing ? 'Card updated' : 'Added to deck');
          },
        }),
        el('button', {
          class: 'btn ghost',
          text: 'Cancel',
          onclick: () => {
            hidePopup();
            anchor = focusTok = null;
            paintSelection();
          },
        }),
      ]),
      el('p', { class: 'sp-note', text: describeSource(info) }),
    );

    const nodes = body.querySelectorAll('.tok.sel');
    const first = nodes[0]?.getBoundingClientRect();
    const last = nodes[nodes.length - 1]?.getBoundingClientRect();
    if (!first) return;
    place(popup, {
      left: Math.min(first.left, last.left),
      right: Math.max(first.right, last.right),
      top: Math.min(first.top, last.top),
      bottom: Math.max(first.bottom, last.bottom),
      width: Math.max(first.right, last.right) - Math.min(first.left, last.left),
      height: first.height,
    });
    popup.querySelector('.sp-meaning').focus();
  }

  function markInDeck(sel) {
    const para = body.querySelector(`.para[data-p="${sel.p}"]`);
    para?.querySelectorAll('.tok.sel').forEach((n) => n.classList.add('in-deck'));
  }

  // ── events ───────────────────────────────────────────────────────────
  body.addEventListener('mouseover', (ev) => {
    if (dragging || !popup.hidden) return;
    const t = tokenAt(ev);
    if (!t) return hideTooltip();
    const tok = paraTokens[t.p][t.i];
    if (!tok.entry) return hideTooltip();
    clear(tooltip);
    tooltip.append(
      el('div', { class: 'tt-pinyin', text: tok.entry.pinyin }),
      el('div', { class: 'tt-word', text: tok.text }),
      el('div', { class: 'tt-meaning', text: tok.entry.meaning }),
      el('span', { class: `tag tag-${tok.entry.tag}`, text: tok.entry.tag }),
    );
    place(tooltip, t.node.getBoundingClientRect());
  });

  body.addEventListener('mouseleave', hideTooltip);

  body.addEventListener('mousedown', (ev) => {
    const t = tokenAt(ev);
    if (!t) return;
    ev.preventDefault();
    hideTooltip();
    if (ev.shiftKey && anchor && anchor.p === t.p) {
      focusTok = { p: t.p, i: t.i };
    } else {
      anchor = { p: t.p, i: t.i };
      focusTok = { p: t.p, i: t.i };
    }
    dragging = true;
    paintSelection();
  });

  body.addEventListener('mousemove', (ev) => {
    if (!dragging) return;
    const t = tokenAt(ev);
    if (!t || t.p !== anchor.p) return;
    focusTok = { p: t.p, i: t.i };
    paintSelection();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    openPopup();
  };
  document.addEventListener('mouseup', endDrag);

  const onOutside = (ev) => {
    if (popup.hidden) return;
    if (popup.contains(ev.target) || ev.target.closest?.('.tok')) return;
    hidePopup();
    anchor = focusTok = null;
    paintSelection();
  };
  document.addEventListener('mousedown', onOutside);

  // Deep link from a flashcard: highlight and scroll to the exact occurrence.
  if (focus && typeof focus.paraIndex === 'number') {
    const toks = paraTokens[focus.paraIndex] || [];
    const para = body.querySelector(`.para[data-p="${focus.paraIndex}"]`);
    toks.forEach((t, i) => {
      if (t.start >= focus.start && t.end <= focus.end) {
        para?.querySelector(`.tok[data-i="${i}"]`)?.classList.add('focus-hit');
      }
    });
    requestAnimationFrame(() => {
      para?.querySelector('.focus-hit')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  return () => {
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('mousedown', onOutside);
    hideTooltip();
    hidePopup();
  };
}

/**
 * Say how the gloss was arrived at. For a multi-word selection the unit split
 * is the useful part: it shows where the app thought the boundaries were, so a
 * wrong reading is obvious at a glance rather than after a week of reviews.
 */
function describeSource(info) {
  const label = SOURCE_LABEL[info.source] || '';
  // Show only the words. Listing the punctuation a drag happened to cross
  // ("的 · 对方 · （ · " · 披露方") obscures the split rather than explaining it.
  const words = (info.units || []).filter((u) => /[一-鿿]/.test(u));
  if (words.length > 1) {
    return `Read as a phrase: ${words.join(' · ')} — edit the meaning to suit.`;
  }
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} — edit the meaning to suit.`;
}

let toastTimer;
export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = el('div', { class: 'toast' });
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}
